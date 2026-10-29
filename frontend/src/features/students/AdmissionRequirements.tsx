import {useEffect,useState} from 'react';
import {ClipboardCheck,FilePlus2,Trash2} from 'lucide-react';
import {api} from '../../api';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import type {Row} from '../../modules';

type Requirement={id:number;title:string;grade_level:number;academic_year_id:number;
 required_for_submission:boolean;required_for_formalization:boolean};
export default function AdmissionRequirements({years}:{years:Row[]}){
 const {ui}=useSchoolLocale();
 const [yearId,setYearId]=useState(''),[grade,setGrade]=useState('1'),[title,setTitle]=useState('');
 const [onSubmit,setOnSubmit]=useState(true),[onEnroll,setOnEnroll]=useState(true);
 const [items,setItems]=useState<Requirement[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const selected=yearId||String(years[0]?.id||'');
 useEffect(()=>{
  if(!selected)return;
  let active=true;
  void api('admission_document_requirements?academic_year_id='+encodeURIComponent(selected)+'&grade_level='+grade)
   .then((result:Requirement[])=>{if(active)setItems(result);})
   .catch((e:Error)=>{if(active)setError(e.message);});
  return()=>{active=false;};
 },[selected,grade]);
 async function add(){
  if(!selected||!title.trim()||busy)return;
  setBusy(true);setError('');
  try{
   const created=await api('admission_document_requirements','POST',{academic_year_id:Number(selected),
    grade_level:Number(grade),title:title.trim(),required_for_submission:onSubmit,required_for_formalization:onEnroll});
   setItems(current=>[...current,created]);setTitle('');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function remove(item:Requirement){
  if(busy)return;setBusy(true);setError('');
  try{await api('admission_document_requirements/'+item.id,'DELETE');setItems(current=>current.filter(x=>x.id!==item.id));}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-admission-requirements" aria-label={ui('Requisitos documentales por convocatoria')}>
  <div className="sc-admission-requirements-intro"><span className="sc-admission-requirements-icon"><ClipboardCheck size={22}/></span>
   <div><h2>{ui('Requisitos documentales')}</h2><p>{ui('Define qué documentos se solicitan y cuáles deben estar aprobados antes de matricular a un aspirante.')}</p></div>
  </div>
  <div className="sc-admission-requirements-toolbar">
   <label>{ui('Ciclo escolar')}<select value={selected} onChange={e=>setYearId(e.target.value)}>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
   <label>{ui('Grado')}<select value={grade} onChange={e=>setGrade(e.target.value)}>{Array.from({length:6},(_,i)=><option key={i} value={i+1}>{i+1}°</option>)}</select></label>
  </div>
  <div className="sc-admission-requirements-list">{items.length?items.map(item=><div key={item.id}>
   <FilePlus2 size={17}/><strong>{item.title}</strong><small>{item.required_for_submission?ui('Requerido para enviar'):ui('Opcional al enviar')} · {item.required_for_formalization?ui('Aprobado para matricular'):ui('No bloquea matrícula')}</small>
   <button className="secondary" type="button" disabled={busy} aria-label={ui('Quitar requisito')+' '+item.title} onClick={()=>void remove(item)}><Trash2 size={16}/></button>
  </div>):<p>{ui('No hay requisitos documentales obligatorios configurados para este ciclo y grado.')}</p>}</div>
  <div className="sc-admission-requirements-add"><label>{ui('Nuevo documento')}<input value={title} onChange={e=>setTitle(e.target.value)} placeholder={ui('Ej. Acta de nacimiento')}/></label>
   <label><input type="checkbox" checked={onSubmit} onChange={e=>setOnSubmit(e.target.checked)}/>{ui('Exigir al enviar')}</label>
   <label><input type="checkbox" checked={onEnroll} onChange={e=>setOnEnroll(e.target.checked)}/>{ui('Exigir aprobación para matricular')}</label>
   <button className="primary" type="button" disabled={busy||!selected||!title.trim()} onClick={()=>void add()}><FilePlus2 size={16}/>{ui('Agregar requisito')}</button>
  </div>
  {error&&<p role="alert" className="sc-applicant-error">{error}</p>}
 </section>;
}
