import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileText,Save,Send,Users,IdCard,MapPinned,Phone,ShieldCheck,UploadCloud,Trash2,CalendarDays} from 'lucide-react';
import {api} from '../../api';
import Combobox from '../../shared/components/Combobox';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {birthDateFromCurp} from './curpBirthDate';
import {PHONE_COUNTRIES} from './StudentPhoneForm';

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
 const [phoneCountry,setPhoneCountry]=useState('MX'),[dragging,setDragging]=useState(false);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const tips=['Verifica que la CURP coincida con el acta de nacimiento.','Registra un domicilio donde se pueda localizar al aspirante.','Utiliza un teléfono vigente para emergencias.','Confirma quién puede atender emergencias y recoger al alumno.','Adjunta documentos legibles y verifica los requisitos.','Revisa todos los datos y requisitos antes de enviar.'];
 const icons=[IdCard,MapPinned,Phone,Users,FileText,ShieldCheck];
 const curpDate=birthDateFromCurp(form.curp);
 const curpStatus=!form.curp?'Sin capturar':form.curp.length<18?'Incompleta':curpDate?'Fecha de CURP válida':'Formato inválido';
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

 const set=(key:string,value:string)=>{setErrors(previous=>{const next={...previous};delete next[key];return next;});setForm(current=>{
  if(key==='curp'){
   const normalized=value.toUpperCase().trim();
   const extracted=birthDateFromCurp(normalized);
   return {...current,curp:normalized,...(extracted?{birth_date:extracted}:{})};
  }
  return {...current,[key]:value};
 });};
 const field=(key:string,label:string,type='text',required=true)=> <label key={key} className="sc-applicant-field"><span>{ui(label)}{required?' *':''}</span><input type={type} value={form[key]||''}
  onChange={event=>set(key,event.target.value)} required={required} aria-invalid={!!errors[key]}/>{errors[key]&&<small className="sc-applicant-field-error" role="alert">{ui(label)}: {ui(errors[key])}</small>}</label>;
 async function proceed(){
  if(busy)return;
  setError('');setErrors({});
  const required:Record<number,string[]>={0:['first_name','last_name','curp','birth_date','academic_year_id'],1:['line1','locality','region'],2:['number_e164'],3:['contact_name','relationship','contact_phone']};
  const invalid=Object.fromEntries((required[step]||[]).filter(key=>!form[key]?.trim()).map(key=>[key,'Es obligatorio']));
  if(step===0&&form.curp&&(!curpDate||form.curp.length!==18))invalid.curp='Formato o fecha inválidos';
  if(step===2&&form.number_e164&&!/^\+[1-9]\d{1,14}$/.test(form.number_e164))invalid.number_e164='Introduce un número internacional válido';
  if(Object.keys(invalid).length){setErrors(invalid);setError(ui('Revisa los campos marcados.'));return;}
  setBusy(true);
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
  <header className="sc-applicant-wizard-header"><div className="sc-applicant-hero-copy"><button type="button" className="sc-record-back" onClick={onClose}><ArrowLeft size={17}/>{ui('Volver a mis aspirantes')}</button>
  <div className="eyebrow">{ui('PORTAL DE FAMILIAS / NUEVO INGRESO')}</div><h1>{student?ui('Completar expediente de aspirante'):ui('Registro de aspirante')}</h1>
  <p>{ui('Completa la información para iniciar el proceso de admisión escolar.')}</p><span className="sc-applicant-hero-stage">{ui('Paso')} {step+1} / 6 · {ui(stages[step])}</span>
  {admission?.folio&&<span className="sc-applicant-folio">{ui('Folio')}: {admission.folio}</span>}</div>
  <div className="sc-applicant-hero-mascot"><img src="/illustrations/auli-welcome.svg" alt={ui('Auli, mascota de School Control')}/><strong>{ui('Auli te acompaña en tu registro')}</strong></div></header>
  <div className="sc-applicant-mobile-progress"><strong>{ui('Paso')} {step+1} / 6 · {ui(stages[step])}</strong><div role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step+1}><span style={{width:((step+1)/6*100)+'%'}}/></div></div>
  <ol className="sc-applicant-progress">{stages.map((name,index)=><li key={name} aria-current={step===index?'step':undefined} className={index<step?'is-done':''}>
   <button type="button" disabled={!student||!editable} aria-label={ui('Ir a')+' '+ui(name)} aria-current={step===index?'step':undefined} onClick={()=>setStep(index)}>
    <span>{index<step?<CheckCircle2 size={16}/>:index+1}</span><small>{ui(name)}</small></button></li>)}</ol>
  <div className="sc-applicant-body"><div className="sc-applicant-step"><div className="sc-applicant-step-title"><div className="sc-applicant-step-icon">{(() => {const Icon=icons[step];return <Icon size={22}/>;})()}</div><div><span>{ui('PASO')} {step+1} / 6</span><h2>{ui(stages[step])}</h2><p>{ui(['Datos personales y académicos','Ubicación y domicilio principal','Teléfono de emergencia','Familiares y autorizaciones','Archivos del expediente','Verificación final'][step])}</p></div></div>
   {step===0&&<><div className="sc-applicant-subheading"><IdCard size={17}/>{ui('Datos personales')}</div><div className="sc-applicant-grid">{field('first_name','Nombre(s)')}{field('last_name','Primer apellido')}
    {field('second_last_name','Segundo apellido','text',false)}<div className="sc-applicant-curp-group">{field('curp','CURP')}<small className={'sc-applicant-curp-indicator'+(curpDate?' is-valid':'')}>{ui('CURP')}: {ui(curpStatus)}</small></div>{field('birth_date','Fecha de nacimiento','date')}{birthDateFromCurp(form.curp)&&<p className="sc-applicant-curp-hint" role="status">{ui('Fecha de nacimiento obtenida automáticamente de la CURP. Puedes corregirla si es necesario.')}</p>}{field('birth_place','Lugar de nacimiento','text',false)}
    {field('birth_state','Entidad de nacimiento','text',false)}{field('nationality','Nacionalidad','text',false)}</div><div className="sc-applicant-subheading"><CalendarDays size={17}/>{ui('Datos académicos iniciales')}</div><div className="sc-applicant-grid">
    <label className="sc-applicant-field"><span>{ui('Ciclo escolar')} *</span><Combobox label={ui('Ciclo escolar')} value={form.academic_year_id} onChange={value=>set('academic_year_id',value)} searchable={years.length>7} options={years.map(year=>({value:String(year.id),label:year.name}))}/></label>
    <label className="sc-applicant-field"><span>{ui('Grado solicitado')}</span><Combobox label={ui('Grado solicitado')} value={form.grade_level} onChange={value=>set('grade_level',value)} searchable={false} options={[{value:'1',label:ui('Primero de primaria')}]}/></label>
   </div></>}
   {step===1&&<div className="sc-applicant-grid">{field('country_code','Código de país ISO')}{field('line1','Calle y número exterior')}
    {field('line2','Número interior y referencias','text',false)}
    {field('neighborhood','Colonia','text',false)}{field('locality','Municipio o alcaldía')}{field('region','Estado')}{field('postal_code','Código postal','text',false)}</div>}
   {step===2&&<div className="sc-applicant-grid"><div className="sc-applicant-field"><span>{ui('País y prefijo')}</span><Combobox label={ui('País y prefijo')} searchable={PHONE_COUNTRIES.length>7} value={phoneCountry} onChange={value=>{setPhoneCountry(value);set('number_e164',PHONE_COUNTRIES.find(c=>c.value===value)?.dial||'+52');}} options={PHONE_COUNTRIES.map(c=>({value:c.value,label:c.label}))}/></div>{field('number_e164','Teléfono de emergencia con código internacional','tel')}
    <p className="sc-applicant-hint">{ui('Puedes agregar teléfonos adicionales desde el expediente del aspirante.')}</p></div>}
   {step===3&&<div className="sc-applicant-family">
    <div className="sc-applicant-grid">{field('contact_name','Nombre del familiar')}{field('relationship','Parentesco')}
     {field('contact_phone','Teléfono de contacto','tel')}{field('contact_email','Correo electrónico','email',false)}
     <label className="sc-applicant-switch"><input type="checkbox" checked={pickupAuthorized} onChange={e=>setPickupAuthorized(e.target.checked)}/><span className="sc-applicant-switch-track"/><span>{ui('Autorizado para recoger al menor')}</span></label>
    </div>
    <div className="sc-applicant-family-extras">
     {family.map((person,index)=><fieldset key={person.id||index} className="sc-applicant-family-entry"><legend>{ui('Familiar adicional')} {index+1}</legend><button type="button" className="sc-applicant-remove-family" aria-label={ui('Eliminar familiar adicional')+' '+(index+1)} onClick={()=>setFamily(current=>current.filter((_,i)=>i!==index))}><Trash2 size={15}/>{ui('Eliminar')}</button>
      <div className="sc-applicant-grid">{([
       ['name','Nombre completo'],['relationship','Parentesco'],['phone','Teléfono'],['email','Correo electrónico']
      ] as const).map(([key,label])=><label key={key} className="sc-applicant-field"><span>{ui(label)}</span><input type={key==='email'?'email':'text'} value={person[key]} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,[key]:e.target.value}:entry))}/></label>)}</div>
      <div className="sc-applicant-family-flags"><label className="sc-applicant-switch"><input type="checkbox" checked={person.emergency} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,emergency:e.target.checked}:entry))}/><span className="sc-applicant-switch-track"/><span>{ui('Contacto de emergencia')}</span></label>
      <label className="sc-applicant-switch"><input type="checkbox" checked={person.pickup_authorized} onChange={e=>setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,pickup_authorized:e.target.checked}:entry))}/><span className="sc-applicant-switch-track"/><span>{ui('Autorizado para recoger')}</span></label></div>
     </fieldset>)}
    </div>
    <button type="button" className="secondary" onClick={()=>setFamily(previous=>[...previous,{name:'',relationship:'',phone:'',email:'',emergency:false,pickup_authorized:false}])}>{ui('Agregar otro familiar')}</button>
    <p className="sc-applicant-hint"><Users size={16}/>{ui('El tutor que inició sesión permanece vinculado como responsable principal. La autorización de recogida se registra por persona.')}</p>
   </div>}
   {step===4&&<div className="sc-applicant-documents"><UploadCloud size={28}/><p>{ui('Adjunta un PDF, PNG o JPG de hasta 10 MB. Los documentos obligatorios dependen del ciclo y grado.')}</p>
    {requirements.length>0&&<label className="sc-applicant-field"><span>{ui('Tipo de documento')}</span><Combobox label={ui('Tipo de documento')} value={docTitle} onChange={setDocTitle} options={requirements.map(r=>({value:r.title,label:r.title}))}/></label>}
    <label className={'sc-applicant-dropzone'+(dragging?' is-dragging':'')} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files[0])setFile(e.dataTransfer.files[0]);}}><UploadCloud size={24}/><strong>{file?file.name:ui('Arrastra o selecciona tu documento')}</strong><small>{ui('PDF, PNG, JPG · máximo 10 MB')}</small><input type="file" aria-label={ui('Documento del aspirante')} accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
    <button type="button" className="secondary" disabled={busy||!file} onClick={()=>void uploadDocument()}>{ui('Adjuntar documento')}</button>
    <div className="sc-applicant-doc-list">{requirements.map(req=><article key={req.title}><FileText size={16}/><strong>{req.title}</strong><span>{documents.includes(req.title)?ui('Cargado'):req.required_for_submission?ui('Obligatorio · pendiente'):ui('Pendiente')}</span></article>)}</div>{documents.map((name,index)=><span className="sc-applicant-uploaded" key={name+index}><CheckCircle2 size={15}/>{name}</span>)}</div>}
   {step===5&&<div className="sc-applicant-review"><CheckCircle2 size={27}/><h3>{ui('Revisa antes de enviar')}</h3>
    <div className="sc-applicant-review-grid">{[{label:'Identidad',value:(student?.full_name||form.first_name+' '+form.last_name)+' · '+form.curp,index:0},{label:'Domicilio',value:form.line1+', '+form.locality,index:1},{label:'Teléfonos',value:form.number_e164,index:2},{label:'Familiares',value:form.contact_name,index:3},{label:'Documentos',value:documents.length+' '+ui('archivos cargados'),index:4}].map(item=><article key={item.label}><div><strong>{ui(item.label)}</strong><p>{item.value||ui('Pendiente')}</p></div><button className="secondary" type="button" onClick={()=>setStep(item.index)}>{ui('Editar')}</button></article>)}</div>
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
  </div><aside className="sc-applicant-auli-tip"><img src="/illustrations/auli-explain.svg" alt=""/><div><strong>{ui('Auli recomienda')}</strong><p>{ui(tips[step])}</p></div></aside></div></section>;
}
