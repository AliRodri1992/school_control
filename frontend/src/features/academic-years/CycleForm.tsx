import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,CalendarDays,ClipboardCheck,GraduationCap,Save,Users,ShieldCheck,Info} from 'lucide-react';
import type {Row} from '../../modules';
import Combobox from '../../shared/components/Combobox';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

const terms=['first','second','third'] as const;
export const cycleLabels:Record<string,string>={
 name:'Nombre del ciclo',starts_on:'Inicio de clases',ends_on:'Fin de clases',
 status:'Estado del ciclo',planned_school_days:'Días de clase previstos',
 administrative_closes_on:'Cierre administrativo previsto',archive_on:'Archivo histórico previsto',
 admissions_open_on:'Inscripciones: apertura',admissions_close_on:'Inscripciones: cierre',
 reenrollment_open_on:'Reinscripciones: apertura',reenrollment_close_on:'Reinscripciones: cierre',
 calendar_source:'Origen del calendario',calendar_source_url:'URL de publicación oficial',
 calendar_source_reference:'Acuerdo o referencia',calendar_published_on:'Fecha de publicación',notes:'Notas y observaciones',
 ...Object.fromEntries(terms.flatMap((term,index)=>[
  [term+'_term_starts_on',['Primer','Segundo','Tercer'][index]+' trimestre: inicio'],
  [term+'_term_ends_on',['Primer','Segundo','Tercer'][index]+' trimestre: cierre'],
  [term+'_term_capture_opens_on',['Primer','Segundo','Tercer'][index]+' trimestre: apertura de captura'],
  [term+'_term_capture_closes_on',['Primer','Segundo','Tercer'][index]+' trimestre: cierre de captura'],
  [term+'_term_review_on',['Primer','Segundo','Tercer'][index]+' trimestre: revisión'],
  [term+'_term_reports_on',['Primer','Segundo','Tercer'][index]+' trimestre: entrega de boletas']
 ]))
};
type FieldKey=keyof typeof cycleLabels;
const required=['name','starts_on','ends_on','admissions_open_on','admissions_close_on','reenrollment_open_on','reenrollment_close_on',
 ...terms.flatMap(t=>[t+'_term_starts_on',t+'_term_ends_on'])];
const dateRanges:[string,string][]=[['starts_on','ends_on'],['admissions_open_on','admissions_close_on'],
 ['reenrollment_open_on','reenrollment_close_on'],...terms.flatMap(t=>[[t+'_term_starts_on',t+'_term_ends_on'],
 [t+'_term_capture_opens_on',t+'_term_capture_closes_on']] as [string,string][])];
type Tab='general'|'terms'|'applications'|'source';
const tabs:{id:Tab;title:string;description:string;icon:typeof CalendarDays}[]=[
 {id:'general',title:'Datos generales',description:'Vigencia y cierre administrativo',icon:GraduationCap},
 {id:'terms',title:'Evaluación',description:'Tres trimestres y entregas',icon:ClipboardCheck},
 {id:'applications',title:'Convocatorias',description:'Ingreso y reinscripciones',icon:Users},
 {id:'source',title:'Procedencia',description:'Referencia para la futura importación',icon:ShieldCheck}
];
const groupOf=(key:string):Tab=>key.includes('_term_')?'terms':key.startsWith('admissions_')||key.startsWith('reenrollment_')?'applications':key.startsWith('calendar_')||key==='notes'?'source':'general';

export function validateCycle(values:Partial<Record<FieldKey,string>>):Partial<Record<FieldKey,string>>{
 const errors:Record<string,string>={};
 required.forEach(key=>{if(!String(values[key]||'').trim())errors[key]=cycleLabels[key]+' no puede estar vacío.';});
 dateRanges.forEach(([start,end])=>{
  if((values[start]||'')!==(values[end]||'')&&(!values[start]||!values[end])&&start.includes('_capture_')){
   errors[!values[start]?start:end]=cycleLabels[!values[start]?start:end]+' debe configurarse junto con la otra fecha.';
  }
  if(values[start]&&values[end]&&values[start]>values[end])
   errors[end]=cycleLabels[end]+' debe ser igual o posterior a '+cycleLabels[start].toLowerCase()+'.';
 });
 if(values.starts_on&&values.ends_on&&values.starts_on===values.ends_on)errors.ends_on=cycleLabels.ends_on+' debe ser posterior al inicio de clases.';
 terms.forEach((term,index)=>{
  const start=term+'_term_starts_on',end=term+'_term_ends_on';
  if(values[start]&&values.starts_on&&values[start]<values.starts_on)errors[start]=cycleLabels[start]+' debe estar dentro del ciclo escolar.';
  if(values[end]&&values.ends_on&&values[end]>values.ends_on)errors[end]=cycleLabels[end]+' debe estar dentro del ciclo escolar.';
  const currentStart=values[start], previousEnd=index>0?values[terms[index-1]+'_term_ends_on']:undefined;
  if(index>0&&currentStart&&previousEnd&&currentStart<=previousEnd)
   errors[start]=cycleLabels[start]+' debe ser posterior al cierre del trimestre anterior.';
  const captureEnd=values[term+'_term_capture_closes_on'],review=values[term+'_term_review_on'],reports=values[term+'_term_reports_on'];
  if(captureEnd&&review&&review<captureEnd)errors[term+'_term_review_on']=cycleLabels[term+'_term_review_on']+' no puede ser anterior al cierre de captura.';
  if(review&&reports&&reports<review)errors[term+'_term_reports_on']=cycleLabels[term+'_term_reports_on']+' no puede ser anterior a la revisión.';
  ['capture_opens_on','capture_closes_on','review_on','reports_on'].forEach(suffix=>{
   const key=term+'_term_'+suffix;
   if(values[key]&&values.starts_on&&values[key]<values.starts_on)
    errors[key]=cycleLabels[key]+' debe quedar dentro del calendario escolar.';
  });
 });
 if(values.administrative_closes_on&&values.ends_on&&values.administrative_closes_on<values.ends_on)
  errors.administrative_closes_on='El cierre administrativo no puede ser anterior al fin de clases.';
 if(values.archive_on&&values.archive_on<(values.administrative_closes_on||values.ends_on||''))
  errors.archive_on='El archivo histórico no puede preceder al cierre del ciclo.';
 if(values.planned_school_days&&(!/^\d+$/.test(values.planned_school_days)||Number(values.planned_school_days)<1||Number(values.planned_school_days)>366))
  errors.planned_school_days='Días de clase previstos debe estar entre 1 y 366.';
 if(values.calendar_source_url&&!/^https?:\/\/[^\s/]+/i.test(values.calendar_source_url))
  errors.calendar_source_url='URL de publicación oficial debe comenzar con http:// o https://.';
 return errors;
}
export default function CycleForm({initial,onCancel,onSave}:{initial?:Row|null;onCancel:()=>void;onSave:(data:Record<string,string>)=>Promise<void>}){
 const {ui}=useSchoolLocale();
 const [tab,setTab]=useState<Tab>('general');
 const [values,setValues]=useState<Record<string,string>>(()=>{
  const data=Object.fromEntries(Object.keys(cycleLabels).map(key=>[key,String(initial?.[key]??'').slice(0,key==='notes'?4000:255)]));
  data.calendar_source=String(initial?.calendar_source||'manual');
  return data;
 });
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [generalError,setGeneralError]=useState('');
 const [saving,setSaving]=useState(false);
 const titleRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{titleRef.current?.focus();},[]);
 const update=(key:string,value:string)=>{setValues(old=>({...old,[key]:value}));setErrors(old=>({...old,[key]:''}));setGeneralError('');};
 async function submit(event:FormEvent){
  event.preventDefault();
  if(saving)return;
  const next=validateCycle(values);setErrors(next as Record<string,string>);
  if(Object.keys(next).length){setTab(groupOf(Object.keys(next)[0]));return;}
  setSaving(true);setGeneralError('');
  try{
   await onSave(Object.fromEntries(Object.entries(values).filter(([key])=>key!=='status').map(([key,value])=>[key,value.trim()===''?null:value])) as Record<string,string>);
  }catch(error){
   const e=error as Error & {fieldErrors?:Record<string,string[]>};
   const mapped:Record<string,string>={};
   for(const [key,messages] of Object.entries(e.fieldErrors||{})){if(cycleLabels[key])mapped[key]=cycleLabels[key]+' '+messages.join(', ');}
   setErrors(mapped);setGeneralError(e.fieldErrors?.base?.join('. ')||(!Object.keys(mapped).length?e.message:''));
   if(Object.keys(mapped).length)setTab(groupOf(Object.keys(mapped)[0]));
  }finally{setSaving(false);}
 }
 const field=(key:string,type:'date'|'text'|'number'|'url'|'textarea'='date',help?:string)=><div className="sc-cycle-form-field" key={key}>
  <label htmlFor={'cycle-'+key}>{ui(cycleLabels[key])} {required.includes(key)&&<span aria-hidden="true">*</span>}</label>
  {type==='textarea'?<textarea id={'cycle-'+key} value={values[key]||''} maxLength={4000} rows={4}
    onChange={e=>update(key,e.target.value)} aria-invalid={!!errors[key]}/>:<input id={'cycle-'+key} type={type}
    value={values[key]||''} min={type==='number'?1:undefined} max={type==='number'?366:undefined}
    onChange={e=>update(key,e.target.value)} aria-invalid={!!errors[key]}
    placeholder={type==='text'&&key==='name'?'2026–2027':undefined}
    aria-describedby={errors[key]?'cycle-'+key+'-error':undefined}/>}
  {help&&<p className="sc-cycle-field-help">{ui(help)}</p>}
  {errors[key]&&<p id={'cycle-'+key+'-error'} role="alert" className="sc-cycle-form-error">{ui(errors[key])}</p>}
 </div>;
 const selectField=(key:string,options:{value:string;label:string}[])=><div className="sc-cycle-form-field" key={key}>
  <label>{ui(cycleLabels[key])}</label><Combobox label={ui(cycleLabels[key])} value={values[key]||''} onChange={value=>update(key,value)}
    options={options.map(option=>({...option,label:ui(option.label)}))} searchable={false} invalid={!!errors[key]}/>
  {errors[key]&&<p className="sc-cycle-form-error" role="alert">{ui(errors[key])}</p>}
 </div>;
 const section=(title:string,description:string,fields:React.ReactNode)=><section className="sc-cycle-form-section">
  <div className="sc-cycle-form-section-heading"><span className="sc-cycle-form-section-icon"><CalendarDays size={20}/></span><div><h3>{ui(title)}</h3><p>{ui(description)}</p></div></div>{fields}
 </section>;
 return <main className="sc-cycle-form-page">
  <button className="sc-cycle-form-back" type="button" onClick={onCancel}><ArrowLeft size={18}/>{ui('Volver a ciclos escolares')}</button>
  <header className="sc-cycle-form-hero"><span>{ui('GESTIÓN ACADÉMICA / CICLOS ESCOLARES')}</span>
   <h2 ref={titleRef} tabIndex={-1}>{ui(initial?'Editar ciclo escolar':'Registrar ciclo escolar')}</h2>
   <p>{ui('Define las fechas oficiales y operativas. La importación del calendario SEP se incorporará posteriormente.')}</p>
  </header>
  <form noValidate onSubmit={e=>void submit(e)} className="sc-cycle-form-card">
   <nav className="sc-cycle-form-tabs" aria-label={ui('Secciones de configuración')}>
    {tabs.map((item,index)=>{const Icon=item.icon;return <button key={item.id} type="button" className={tab===item.id?'is-selected':''}
      aria-current={tab===item.id?'step':undefined} onClick={()=>setTab(item.id)}>
     <Icon size={18}/><span><strong>{String(index+1).padStart(2,'0')} · {ui(item.title)}</strong><small>{ui(item.description)}</small></span>
     {Object.keys(errors).some(key=>errors[key]&&groupOf(key)===item.id)&&<span className="sc-cycle-tab-warning" aria-label="Errores de validación">!</span>}
    </button>;})}
   </nav>
   {tab==='general'&&section('Información general','Identidad, vigencia y días previstos de trabajo escolar.',<>
    <div className="sc-cycle-form-name">{field('name','text')}</div>
    <div className="sc-cycle-form-grid">{field('starts_on')}{field('ends_on')}{field('planned_school_days','number','Captura los días autorizados; no se calculan automáticamente hasta disponer del calendario.')}{field('administrative_closes_on','date','Opcional: por defecto, 30 días después de terminar las clases.')}{field('archive_on','date','Opcional: por defecto, cinco años después del fin de clases. Archivar nunca elimina el historial.')}</div>
    <p className="sc-cycle-form-notice"><ShieldCheck size={17}/>{ui('El estatus se controla automáticamente:')} <strong>{ui(initial?({draft:'En preparación',active:'Activo',closing:'En cierre',closed:'Cerrado',archived:'Archivado'} as Record<string,string>)[String(initial.status)]||'En preparación':'En preparación')}</strong>. {ui('No puede modificarse manualmente.')}</p>
   </>)}
   {tab==='terms'&&section('Periodos de evaluación','Cada trimestre conserva su vigencia y sus fechas de captura, revisión y entrega.',<>
    <div className="sc-cycle-form-term-list">{terms.map((term,index)=><div className="sc-cycle-form-term" key={term}>
     <h4><span>{index+1}</span>{ui(['Primer trimestre','Segundo trimestre','Tercer trimestre'][index])}</h4>
     <div className="sc-cycle-form-grid">{field(term+'_term_starts_on')}{field(term+'_term_ends_on')}
      {field(term+'_term_capture_opens_on')}{field(term+'_term_capture_closes_on')}
      {field(term+'_term_review_on')}{field(term+'_term_reports_on')}</div>
    </div>)}</div>
    <p className="sc-cycle-form-notice"><Info size={16}/>{ui('Las fechas de captura y publicación son administrativas. Deben respetar los periodos y disposiciones oficiales aplicables.')}</p>
   </>)}
   {tab==='applications'&&<>
    {section('Nuevo ingreso','Apertura y cierre de las solicitudes de admisión.',<div className="sc-cycle-form-grid">{field('admissions_open_on')}{field('admissions_close_on')}</div>)}
    {section('Reinscripciones','Plazo para la continuidad de estudiantes existentes.',<div className="sc-cycle-form-grid">{field('reenrollment_open_on')}{field('reenrollment_close_on')}</div>)}
   </>}
   {tab==='source'&&section('Procedencia del calendario','Estos campos permiten registrar manualmente información verificable; todavía no descargan ni importan fechas.',<>
    <div className="sc-cycle-form-grid">{selectField('calendar_source',[
     {value:'manual',label:'Captura manual'},{value:'sep',label:'SEP federal'},{value:'state',label:'Autoridad educativa estatal'},{value:'school',label:'Calendario del plantel'}])}
     {field('calendar_published_on')}{field('calendar_source_reference','text')}{field('calendar_source_url','url')}
    </div><div className="sc-cycle-form-note-field">{field('notes','textarea','Registra las autorizaciones, excepciones y observaciones; no sobrescribas una fecha oficial sin respaldo.')}</div>
   </>)}
   {initial&&<p className="sc-cycle-form-notice"><Info size={16}/>{ui('Modificar las fechas de un ciclo existente puede afectar convocatorias y evaluaciones. Verifica el impacto antes de guardar.')}</p>}
   {generalError&&<p role="alert" className="sc-cycle-form-general-error">{generalError}</p>}
   <footer className="sc-cycle-form-actions"><button className="secondary" type="button" disabled={saving} onClick={onCancel}>{ui('Cancelar')}</button>
    <button className="primary" type="submit" disabled={saving}><Save size={17}/>{saving?ui('Guardando…'):ui(initial?'Guardar cambios':'Crear ciclo escolar')}</button></footer>
  </form>
 </main>;
}
