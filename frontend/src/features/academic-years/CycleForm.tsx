import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowLeft,CalendarDays,GraduationCap,Save,Users,RefreshCcw} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
type FieldKey='name'|'starts_on'|'ends_on'|'admissions_open_on'|'admissions_close_on'|'reenrollment_open_on'|'reenrollment_close_on';
const labels:Record<FieldKey,string>={name:'Nombre del ciclo',starts_on:'Inicio de clases',ends_on:'Fin de clases',admissions_open_on:'Inscripciones: apertura',admissions_close_on:'Inscripciones: cierre',reenrollment_open_on:'Reinscripciones: apertura',reenrollment_close_on:'Reinscripciones: cierre'};
const keys=Object.keys(labels) as FieldKey[];
export function validateCycle(values:Record<FieldKey,string>):Partial<Record<FieldKey,string>>{
 const errors:Partial<Record<FieldKey,string>>={};
 keys.forEach(key=>{if(!values[key]?.trim())errors[key]=labels[key]+' no puede estar vacío.';});
 const ranges:[FieldKey,FieldKey][]=[['starts_on','ends_on'],['admissions_open_on','admissions_close_on'],['reenrollment_open_on','reenrollment_close_on']];
 for(const [start,end] of ranges){
  if(values[start]&&values[end]&&values[start]>values[end])errors[end]=labels[end]+' debe ser igual o posterior a '+labels[start].toLowerCase()+'.';
 }
 if(values.starts_on&&values.ends_on&&values.starts_on===values.ends_on)errors.ends_on=labels.ends_on+' debe ser posterior al inicio de clases.';
 return errors;
}
export default function CycleForm({initial,onCancel,onSave}:{initial?:Row|null;onCancel:()=>void;onSave:(data:Record<FieldKey,string>)=>Promise<void>}){
 const {ui}=useSchoolLocale();
 const [values,setValues]=useState<Record<FieldKey,string>>(()=>Object.fromEntries(keys.map(k=>[k,String(initial?.[k]||'').slice(0,10)])) as Record<FieldKey,string>);
 const [errors,setErrors]=useState<Partial<Record<FieldKey,string>>>({});
 const [generalError,setGeneralError]=useState('');
 const [saving,setSaving]=useState(false);
 const titleRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{titleRef.current?.focus();},[]);
 const update=(key:FieldKey,value:string)=>{setValues(old=>({...old,[key]:value}));setErrors(old=>({...old,[key]:undefined}));setGeneralError('');};
 async function submit(event:FormEvent){
  event.preventDefault();if(saving)return;
  const next=validateCycle(values);setErrors(next);
  if(Object.keys(next).length){document.getElementById('cycle-'+Object.keys(next)[0])?.focus();return;}
  setSaving(true);setGeneralError('');
  try{await onSave(values);}catch(error){
   const e=error as Error & {fieldErrors?:Record<string,string[]>};
   const mapped:Partial<Record<FieldKey,string>>={};
   for(const key of keys){const message=e.fieldErrors?.[key]?.[0];if(message)mapped[key]=labels[key]+' '+message.replace(/\.$/,'')+'.';}
   if(e.fieldErrors?.base?.length)setGeneralError(e.fieldErrors.base.join('. '));
   else if(!Object.keys(mapped).length)setGeneralError(e.message);
   setErrors(mapped);
   if(Object.keys(mapped).length)document.getElementById('cycle-'+Object.keys(mapped)[0])?.focus();
  }finally{setSaving(false);}
 }
 const field=(key:FieldKey,type:'date'|'text'='date')=><div className="sc-cycle-form-field" key={key}>
  <label htmlFor={'cycle-'+key}>{ui(labels[key])} <span aria-hidden="true">*</span></label>
  <input id={'cycle-'+key} type={type} value={values[key]} onChange={e=>update(key,e.target.value)} aria-invalid={!!errors[key]}
   aria-describedby={errors[key]?'cycle-'+key+'-error':undefined} placeholder={type==='text'?'2026–2027':undefined}/>
  {errors[key]&&<p id={'cycle-'+key+'-error'} className="sc-cycle-form-error" role="alert">{ui(errors[key])}</p>}
 </div>;
 const section=(title:string,description:string,icon:typeof CalendarDays,start:FieldKey,end:FieldKey)=>{
  const Icon=icon;return <section className="sc-cycle-form-section"><div className="sc-cycle-form-section-heading"><span className="sc-cycle-form-section-icon"><Icon size={21}/></span><div><h3>{ui(title)}</h3><p>{ui(description)}</p></div></div>
   <div className="sc-cycle-form-grid">{field(start)}{field(end)}</div></section>;
 };
 return <main className="sc-cycle-form-page">
  <button className="sc-cycle-form-back" type="button" onClick={onCancel}><ArrowLeft size={18}/>{ui('Volver a ciclos y convocatorias')}</button>
  <header className="sc-cycle-form-hero"><span>{ui('ADMINISTRACIÓN ESCOLAR / CICLOS')}</span><h2 ref={titleRef} tabIndex={-1}>{ui(initial?'Editar ciclo escolar':'Registrar ciclo escolar')}</h2>
   <p>{ui('Organiza las fechas lectivas y las convocatorias de las familias. Los campos marcados con * son obligatorios.')}</p></header>
  <form noValidate onSubmit={e=>void submit(e)} className="sc-cycle-form-card">
   <section className="sc-cycle-form-section"><div className="sc-cycle-form-section-heading"><span className="sc-cycle-form-section-icon"><GraduationCap size={21}/></span><div><h3>{ui('01 · Información del ciclo')}</h3><p>{ui('Identifica el ciclo escolar y establece las fechas de inicio y fin de clases.')}</p></div></div>
   <div className="sc-cycle-form-name">{field('name','text')}</div><div className="sc-cycle-form-grid">{field('starts_on')}{field('ends_on')}</div></section>
   {section('02 · Convocatoria de nuevo ingreso','Periodo en el que las familias pueden presentar solicitudes de admisión.',Users,'admissions_open_on','admissions_close_on')}
   {section('03 · Periodo de reinscripciones','Fechas para solicitar la continuidad de alumnos del ciclo anterior.',RefreshCcw,'reenrollment_open_on','reenrollment_close_on')}
   {initial&&<p className="sc-cycle-form-notice">{ui('Los cambios en las fechas pueden modificar la disponibilidad de las convocatorias para las familias.')}</p>}
   {generalError&&<p role="alert" className="sc-cycle-form-general-error">{generalError}</p>}
   <footer className="sc-cycle-form-actions"><button type="button" className="secondary" disabled={saving} onClick={onCancel}>{ui('Cancelar')}</button>
    <button type="submit" className="primary" disabled={saving}><Save size={17}/>{saving?ui('Guardando…'):ui(initial?'Guardar cambios':'Crear ciclo escolar')}</button></footer>
  </form>
 </main>;
}
