import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileText,Save,Send,Users} from 'lucide-react';
import {api} from '../../api';
import Combobox from '../../shared/components/Combobox';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

type Props={years:Row[];existing?:Row|null;admissions:Row[];onClose:()=>void;onSaved:()=>Promise<void>};
const stages=['Identidad','Domicilio','Teléfonos','Familiares','Documentos','Revisión y envío'];
type FamilyEntry={id?:number;name:string;relationship:string;phone:string;email:string;emergency:boolean;pickup_authorized:boolean};
export default function ApplicantRegistration({years,existing,admissions,onClose,onSaved}:Props){
 const {ui}=useSchoolLocale();
 const [student,setStudent]=useState<Row|null>(existing||null);
 const [admission,setAdmission]=useState<Row|null>(()=>admissions.find(a=>String(a.student_id)===String(existing?.id))||null);
 const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState<Record<string,string>>({
  first_name:existing?.first_name||'',last_name:existing?.last_name||'',second_last_name:existing?.second_last_name||'',curp:existing?.curp||'',
  birth_place:existing?.birth_place||'',birth_state:existing?.birth_state||'',nationality:existing?.nationality||'MX',sex:existing?.sex||'',
  birth_date:existing?.birth_date||'',academic_year_id:String(years[0]?.id||''),grade_level:'1',
  country_code:'MX',purpose:'home',line1:'',locality:'',region:'',postal_code:'',
  number_e164:'',phone_purpose:'emergency',contact_name:'',relationship:'',contact_phone:'',contact_email:''
 });
 const [file,setFile]=useState<File|null>(null);
 const [documents,setDocuments]=useState<string[]>([]);
 const [requirements,setRequirements]=useState<{title:string;required_for_submission:boolean;required_for_formalization:boolean}[]>([]);
 const [checklist,setChecklist]=useState<string[]>([]);
 const [docTitle,setDocTitle]=useState('');
 const [recordIds,setRecordIds]=useState<{address?:number;phone?:number;contact?:number}>({});
 const [family,setFamily]=useState<FamilyEntry[]>([]);
 const [pickupAuthorized,setPickupAuthorized]=useState(false);
 const editable=!admission||['draft','correction_requested'].includes(admission.status);
 useEffect(()=>{
  if(!existing?.id)return;
  let active=true;
  void Promise.all([
   api('students/'+existing.id+'/details/addresses'),
   api('students/'+existing.id+'/details/phones'),
   api('student_contacts'),
   api('student_documents')
  ]).then(([addresses,phones,contacts,docs])=>{
    if(!active)return;
    const address=(addresses as Row[])[0],phone=(phones as Row[])[0];
    const related=(contacts as Row[]).filter(row=>String(row.student_id)===String(existing.id));
    const contact=related[0];
    setFamily(related.slice(1).map(row=>({id:row.id,name:row.name,relationship:row.relationship,phone:row.phone,
      email:row.email||'',emergency:row.emergency===true,pickup_authorized:row.pickup_authorized===true})));
    setPickupAuthorized(contact?.pickup_authorized===true);
    const files=(docs as Row[]).filter(row=>String(row.student_id)===String(existing.id));
    setRecordIds({address:address?.id,phone:phone?.id,contact:contact?.id});
    setDocuments(files.map(row=>String(row.title)));
    setForm(previous=>({...previous,academic_year_id:String(admission?.academic_year_id||previous.academic_year_id),
     grade_level:String(admission?.grade_level||previous.grade_level),
     country_code:address?.country_code||previous.country_code,
     line1:address?.line1||'',line2:address?.line2||'',neighborhood:address?.neighborhood||'',
     locality:address?.locality||'',region:address?.region||'',postal_code:address?.postal_code||'',
     number_e164:phone?.number_e164||'',
     contact_name:contact?.name||'',relationship:contact?.relationship||'',
     contact_phone:contact?.phone||'',contact_email:contact?.email||''}));
  }).catch((cause:Error)=>{if(active)setError(cause.message);});
  return()=>{active=false;};
 },[existing?.id]);
 useEffect(()=>{
  if(!admission)return;
  let active=true;
  void api('admission_document_requirements?academic_year_id='+admission.academic_year_id+'&grade_level='+admission.grade_level)
   .then((items:typeof requirements)=>{if(active){setRequirements(items);setDocTitle(current=>current||items[0]?.title||'');}})
   .catch((cause:Error)=>{if(active)setError(cause.message);});
  return()=>{active=false;};
 },[admission?.id]);
 useEffect(()=>{
  if(step!==5||!admission)return;
  let active=true;
  void api('admissions/'+admission.id+'/readiness')
   .then((result:{missing_for_submission:string[]})=>{if(active)setChecklist(result.missing_for_submission);})
   .catch((cause:Error)=>{if(active)setError(cause.message);});
  return()=>{active=false;};
 },[step,admission?.id]);
 async function uploadDocument(){
  if(!student||!file||busy)return;
  setBusy(true);setError('');
  try{
   const payload=new FormData();payload.append('student_id',String(student.id));
   payload.append('title',docTitle.trim()||file.name);payload.append('file',file);
   await api('student_documents','POST',payload);
   setDocuments(current=>[...current,docTitle.trim()||file.name]);setFile(null);
   await onSaved();
  }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
 }

 const set=(key:string,value:string)=>setForm(current=>({...current,[key]:value}));
 const field=(key:string,label:string,type='text',required=true)=> <label key={key} className="sc-applicant-field"><span>{ui(label)}{required?' *':''}</span><input type={type} value={form[key]||''}
  onChange={event=>set(key,event.target.value)} required={required}/></label>;
 async function proceed(){
  if(busy)return;
  setBusy(true);setError('');
  try{
   if(step===0){
    if(!form.first_name.trim()||!form.last_name.trim()||!form.curp.trim()||!form.birth_date||!form.academic_year_id)throw Error(ui('Completa la identidad, CURP, fecha y ciclo escolar.'));
    const record=student?await api('students/'+student.id,'PATCH',{
     first_name:form.first_name,last_name:form.last_name,second_last_name:form.second_last_name,
     birth_place:form.birth_place,birth_state:form.birth_state,nationality:form.nationality,sex:form.sex||null,
     curp:form.curp,birth_date:form.birth_date
    }):await api('students','POST',{
     first_name:form.first_name,last_name:form.last_name,second_last_name:form.second_last_name,
     birth_place:form.birth_place,birth_state:form.birth_state,nationality:form.nationality,sex:form.sex||null,
     curp:form.curp,birth_date:form.birth_date
    });
    setStudent(record);
    const draft=admission||await api('admissions','POST',{
     student_id:record.id,academic_year_id:Number(form.academic_year_id),grade_level:Number(form.grade_level),
     kind:'new',draft:true
    });
    setAdmission(draft);
   }else if(step===1){
    if(!form.line1.trim()||!form.country_code||!form.locality.trim()||!form.region.trim())throw Error(ui('Completa el domicilio principal.'));
    const updated=await api('students/'+student?.id+'/details/addresses'+(recordIds.address?'/'+recordIds.address:''),recordIds.address?'PATCH':'POST',{
     country_code:form.country_code.toUpperCase(),purpose:'home',line1:form.line1,line2:form.line2,
     neighborhood:form.neighborhood,locality:form.locality,region:form.region,postal_code:form.postal_code,primary:true
    });
    setRecordIds(previous=>({...previous,address:updated.id}));
   }else if(step===2){
    if(!form.number_e164.match(/^\+[1-9]\d{1,14}$/))throw Error(ui('El teléfono debe incluir código internacional, por ejemplo +525512345678.'));
    const updated=await api('students/'+student?.id+'/details/phones'+(recordIds.phone?'/'+recordIds.phone:''),recordIds.phone?'PATCH':'POST',{
     number_e164:form.number_e164,country_code:form.country_code,purpose:'emergency',primary:true
    });
    setRecordIds(previous=>({...previous,phone:updated.id}));
   }else if(step===3){
    if(!form.contact_name.trim()||!form.relationship.trim()||!form.contact_phone.trim())throw Error(ui('Agrega al menos un contacto familiar.'));
    const updated=await api('student_contacts'+(recordIds.contact?'/'+recordIds.contact:''),recordIds.contact?'PATCH':'POST',{
     student_id:student?.id,name:form.contact_name,relationship:form.relationship,
     phone:form.contact_phone,email:form.contact_email,emergency:true,pickup_authorized:pickupAuthorized});
    setRecordIds(previous=>({...previous,contact:updated.id}));
    for(let index=0;index<family.length;index++){
     const person=family[index];
     if(!person.name.trim()||!person.phone.trim()||!person.relationship.trim())throw Error(ui('Completa los datos de cada familiar agregado.'));
     const saved=await api('student_contacts'+(person.id?'/'+person.id:''),person.id?'PATCH':'POST',{
      student_id:student?.id,name:person.name,relationship:person.relationship,
      phone:person.phone,email:person.email,emergency:person.emergency,pickup_authorized:person.pickup_authorized
     });
     setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,id:saved.id}:entry));
    }
   }
   await onSaved();
   setStep(current=>Math.min(current+1,5));
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function send(){
  if(!admission||busy)return;setBusy(true);setError('');
  try{await api('admissions/'+admission.id+'/submit','POST');await onSaved();onClose();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-applicant-wizard" aria-label={ui('Registro de aspirante')}>
  <header className="sc-applicant-wizard-header"><button type="button" className="sc-record-back" onClick={onClose}><ArrowLeft size={17}/>{ui('Volver a mis aspirantes')}</button>
   <div className="eyebrow">{ui('PORTAL DE FAMILIAS / NUEVO INGRESO')}</div>
   <h1>{student?ui('Completar expediente de aspirante'):ui('Registrar aspirante')}</h1>
   <p>{ui('Guarda tu avance en la escuela y revisa los datos antes de enviar la solicitud.')}</p>
   {admission&&<span className="sc-applicant-folio">{ui('Folio')}: {admission.folio}</span>}</header>
  <ol className="sc-applicant-progress">{stages.map((name,index)=><li key={name} aria-current={step===index?'step':undefined} className={index<step?'is-done':''}>
   <button type="button" disabled={!student||!editable} aria-label={ui('Ir a')+' '+ui(name)} aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}>
    <span>{index<step?<CheckCircle2 size={16}/>:index+1}</span><small>{ui(name)}</small></button></li>)}</ol>
  <div className="sc-applicant-step"><div className="sc-applicant-step-title"><span>{ui('PASO')} {step+1} / 6</span><h2>{ui(stages[step])}</h2></div>
   {step===0&&<div className="sc-applicant-grid">{field('first_name','Nombre(s)')}{field('last_name','Primer apellido')}
    {field('second_last_name','Segundo apellido','text',false)}{field('curp','CURP')}{field('birth_date','Fecha de nacimiento','date')}{field('birth_place','Lugar de nacimiento','text',false)}
    {field('birth_state','Entidad de nacimiento','text',false)}{field('nationality','Nacionalidad','text',false)}
    <label className="sc-applicant-field"><span>{ui('Ciclo escolar')} *</span><Combobox label={ui('Ciclo escolar')} value={form.academic_year_id} onChange={value=>set('academic_year_id',value)} options={years.map(year=>({value:String(year.id),label:year.name}))}/></label>
    <label className="sc-applicant-field"><span>{ui('Grado solicitado')}</span><Combobox label={ui('Grado solicitado')} value={form.grade_level} onChange={value=>set('grade_level',value)} options={[{value:'1',label:ui('Primero de primaria')}]}/></label>
   </div>}
   {step===1&&<div className="sc-applicant-grid">{field('country_code','Código de país ISO')}{field('line1','Calle y número exterior')}
    {field('line2','Número interior y referencias','text',false)}
    {field('neighborhood','Colonia','text',false)}{field('locality','Municipio o alcaldía')}{field('region','Estado')}{field('postal_code','Código postal','text',false)}</div>}
   {step===2&&<div className="sc-applicant-grid">{field('number_e164','Teléfono de emergencia con código internacional','tel')}
    <p className="sc-applicant-hint">{ui('Puedes agregar teléfonos adicionales desde el expediente del aspirante.')}</p></div>}
   {step===3&&<div className="sc-applicant-family">
    <div className="sc-applicant-grid">{field('contact_name','Nombre del familiar')}{field('relationship','Parentesco')}
     {field('contact_phone','Teléfono de contacto','tel')}{field('contact_email','Correo electrónico','email',false)}
     <label className="sc-applicant-check"><input type="checkbox" checked={pickupAuthorized} onChange={e=>setPickupAuthorized(e.target.checked)}/>{ui('Autorizado para recoger al menor')}</label>
    </div>
    <div className="sc-applicant-family-extras">
     {family.map((person,index)=><fieldset key={person.id||index} className="sc-applicant-family-entry"><legend>{ui('Familiar adicional')} {index+1}</legend>
      <div className="sc-applicant-grid">{([
       ['name','Nombre completo'],['relationship','Parentesco'],['phone','Teléfono'],['email','Correo electrónico']
      ] as const).map(([key,label])=><label key={key} className="sc-applicant-field"><span>{ui(label)}</span><input type={key==='email'?'email':'text'} value={person[key]} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,[key]:e.target.value}:entry))}/></label>)}</div>
      <div className="sc-applicant-family-flags"><label><input type="checkbox" checked={person.emergency} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,emergency:e.target.checked}:entry))}/>{ui('Contacto de emergencia')}</label>
      <label><input type="checkbox" checked={person.pickup_authorized} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,pickup_authorized:e.target.checked}:entry))}/>{ui('Autorizado para recoger')}</label></div>
     </fieldset>)}
    </div>
    <button type="button" className="secondary" onClick={()=>setFamily(previous=>[...previous,{name:'',relationship:'',phone:'',email:'',emergency:false,pickup_authorized:false}])}>{ui('Agregar otro familiar')}</button>
    <p className="sc-applicant-hint"><Users size={16}/>{ui('El tutor que inició sesión permanece vinculado como responsable principal. La autorización de recogida se registra por persona.')}</p>
   </div>}
   {step===4&&<div className="sc-applicant-documents"><FileText size={28}/><p>{ui('Adjunta un PDF, PNG o JPG de hasta 10 MB. Los documentos obligatorios dependen del ciclo y grado.')}</p>
    {requirements.length>0&&<label className="sc-applicant-field"><span>{ui('Tipo de documento')}</span><Combobox label={ui('Tipo de documento')} value={docTitle} onChange={setDocTitle} options={requirements.map(r=>({value:r.title,label:r.title}))}/></label>}
    <input type="file" aria-label={ui('Documento del aspirante')} accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/>
    <button type="button" className="secondary" disabled={busy||!file} onClick={()=>void uploadDocument()}>{ui('Adjuntar documento')}</button>
    {documents.map((name,index)=><span key={name+index}>{name}</span>)}</div>}
   {step===5&&<div className="sc-applicant-review"><CheckCircle2 size={27}/><h3>{ui('Revisa antes de enviar')}</h3>
    <p>{student?.full_name||form.first_name+' '+form.last_name}</p><p>{ui('CURP')}: {form.curp}</p>
    <p>{ui('Domicilio')}: {form.line1}, {form.locality}</p><p>{ui('Responsable adicional')}: {form.contact_name}</p>
    <p>{ui('Al enviar, el equipo escolar revisará la solicitud. La aprobación no significa inscripción automática.')}</p>
    {checklist.length>0&&<div role="alert" className="sc-applicant-missing"><strong>{ui('Antes de enviar, completa lo siguiente:')}</strong>
      <ul>{checklist.map(missing=><li key={missing}>{missing}</li>)}</ul></div>}
    {checklist.length===0&&<p role="status">{ui('Sin secciones obligatorias pendientes de completar.')}</p>}</div>}
   {admission&&!editable&&<p className="sc-applicant-hint" role="status">{ui('Esta solicitud ya fue enviada o resuelta. Consulta el estado desde el listado de admisiones.')}</p>}
   {error&&<p role="alert" className="sc-applicant-error">{error}</p>}
   <footer className="sc-applicant-step-actions">
    <button className="secondary" type="button" disabled={busy} onClick={onClose}><Save size={16}/>{ui('Salir y continuar después')}</button>
    {step<5?<button className="primary" type="button" disabled={busy||!editable} onClick={()=>void proceed()}>{ui('Guardar y continuar')}<ArrowRight size={16}/></button>:
     <button className="primary" type="button" disabled={busy||!admission||!editable||checklist.length>0} onClick={()=>void send()}><Send size={16}/>{ui('Enviar solicitud')}</button>}
   </footer>
  </div></section>;
}
