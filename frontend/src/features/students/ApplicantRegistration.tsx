import {useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileText,Save,Send,Users} from 'lucide-react';
import {api} from '../../api';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

type Props={years:Row[];existing?:Row|null;admissions:Row[];onClose:()=>void;onSaved:()=>Promise<void>};
const stages=['Identidad','Domicilio','Teléfonos','Familiares','Documentos','Revisión y envío'];
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
    await api('students/'+student?.id+'/details/addresses','POST',{
     country_code:form.country_code.toUpperCase(),purpose:'home',line1:form.line1,
     locality:form.locality,region:form.region,postal_code:form.postal_code,primary:true
    });
   }else if(step===2){
    if(!form.number_e164.match(/^\+[1-9]\d{1,14}$/))throw Error(ui('El teléfono debe incluir código internacional, por ejemplo +525512345678.'));
    await api('students/'+student?.id+'/details/phones','POST',{
     number_e164:form.number_e164,country_code:form.country_code,purpose:'emergency',primary:true
    });
   }else if(step===3){
    if(!form.contact_name.trim()||!form.relationship.trim()||!form.contact_phone.trim())throw Error(ui('Agrega al menos un contacto familiar.'));
    await api('student_contacts','POST',{student_id:student?.id,name:form.contact_name,relationship:form.relationship,
     phone:form.contact_phone,email:form.contact_email,emergency:true,pickup_authorized:false});
   }else if(step===4&&file){
    const payload=new FormData();payload.append('student_id',String(student?.id));payload.append('title',file.name);payload.append('file',file);
    await api('student_documents','POST',payload);setDocuments(v=>[...v,file.name]);setFile(null);
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
   <span>{index<step?<CheckCircle2 size={16}/>:index+1}</span><small>{ui(name)}</small></li>)}</ol>
  <div className="sc-applicant-step"><div className="sc-applicant-step-title"><span>{ui('PASO')} {step+1} / 6</span><h2>{ui(stages[step])}</h2></div>
   {step===0&&<div className="sc-applicant-grid">{field('first_name','Nombre(s)')}{field('last_name','Primer apellido')}
    {field('second_last_name','Segundo apellido','text',false)}{field('curp','CURP')}{field('birth_date','Fecha de nacimiento','date')}{field('birth_place','Lugar de nacimiento','text',false)}
    {field('birth_state','Entidad de nacimiento','text',false)}{field('nationality','Nacionalidad','text',false)}
    <label className="sc-applicant-field"><span>{ui('Ciclo escolar')} *</span><select value={form.academic_year_id}
     onChange={e=>set('academic_year_id',e.target.value)}>{years.map(year=><option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
    <label className="sc-applicant-field"><span>{ui('Grado solicitado')}</span><select value={form.grade_level} onChange={e=>set('grade_level',e.target.value)}><option value="1">{ui('Primero de primaria')}</option></select></label>
   </div>}
   {step===1&&<div className="sc-applicant-grid">{field('country_code','Código de país ISO')}{field('line1','Calle, número exterior e interior')}
    {field('locality','Municipio o alcaldía')}{field('region','Estado')}{field('postal_code','Código postal','text',false)}</div>}
   {step===2&&<div className="sc-applicant-grid">{field('number_e164','Teléfono de emergencia con código internacional','tel')}
    <p className="sc-applicant-hint">{ui('Puedes agregar teléfonos adicionales desde el expediente del aspirante.')}</p></div>}
   {step===3&&<div className="sc-applicant-grid">{field('contact_name','Nombre del familiar')}{field('relationship','Parentesco')}
    {field('contact_phone','Teléfono de contacto','tel')}{field('contact_email','Correo electrónico','email',false)}
    <p className="sc-applicant-hint"><Users size={16}/>{ui('El tutor que inició sesión permanecerá vinculado como responsable principal. Puedes agregar más familiares desde el expediente.')}</p>
   </div>}
   {step===4&&<div className="sc-applicant-documents"><FileText size={28}/><p>{ui('Adjunta un PDF, PNG o JPG de hasta 10 MB. También puedes completar documentos posteriormente desde tu portal.')}</p>
    <input type="file" aria-label={ui('Documento del aspirante')} accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/>
    {documents.map(name=><span key={name}>{name}</span>)}</div>}
   {step===5&&<div className="sc-applicant-review"><CheckCircle2 size={27}/><h3>{ui('Revisa antes de enviar')}</h3>
    <p>{student?.full_name||form.first_name+' '+form.last_name}</p><p>{ui('CURP')}: {form.curp}</p>
    <p>{ui('Domicilio')}: {form.line1}, {form.locality}</p><p>{ui('Responsable adicional')}: {form.contact_name}</p>
    <p>{ui('Al enviar, el equipo escolar revisará la solicitud. La aprobación no significa inscripción automática.')}</p></div>}
   {error&&<p role="alert" className="sc-applicant-error">{error}</p>}
   <footer className="sc-applicant-step-actions">
    <button className="secondary" type="button" disabled={busy} onClick={onClose}><Save size={16}/>{ui('Salir y continuar después')}</button>
    {step<5?<button className="primary" type="button" disabled={busy} onClick={()=>void proceed()}>{ui('Guardar y continuar')}<ArrowRight size={16}/></button>:
     <button className="primary" type="button" disabled={busy||!admission} onClick={()=>void send()}><Send size={16}/>{ui('Enviar solicitud')}</button>}
   </footer>
  </div></section>;
}
