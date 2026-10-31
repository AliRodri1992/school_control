import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileText,Save,Send,Users,IdCard,MapPinned,Phone,ShieldCheck,UploadCloud,Trash2,CalendarDays,BookOpenCheck,LockKeyhole,Info,Check,ClipboardCheck,UserRoundCheck,Sparkles} from 'lucide-react';
import {api} from '../../api';
import Combobox from '../../shared/components/Combobox';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {birthDateFromCurp} from './curpBirthDate';
import {PHONE_COUNTRIES} from './StudentPhoneForm';
import {relationshipChoices} from '../../shared/relationships';
import {confirmDanger} from '../../notifications';

type Props={years:Row[];existing?:Row|null;admissions:Row[];onClose:()=>void;onSaved:()=>Promise<void>};
const stages=['Identidad','Domicilio','Teléfonos','Familiares','Documentos','Revisión y envío'] as const;
const stageDescriptions=['Información personal y ciclo solicitado','Dirección de residencia del aspirante','Número disponible para emergencias','Personas responsables y autorizaciones','Requisitos y archivos del expediente','Validación final antes del envío'] as const;
export function applicantStepIssues(step:number,form:Record<string,string>,curpDate:ReturnType<typeof birthDateFromCurp>){
 const required:Record<number,string[]>={0:['first_name','last_name','curp','birth_date','academic_year_id'],1:['line1','locality','region'],2:['number_e164'],3:['contact_name','relationship','contact_phone']};
 const issues:Record<string,string>={};
 for(const key of required[step]||[])if(!form[key]?.trim())issues[key]='Es obligatorio';
 if(step===0&&form.curp&&(!curpDate||form.curp.length!==18))issues.curp='Formato o fecha inválidos';
 if(step===0&&curpDate&&form.birth_date&&curpDate!==form.birth_date)issues.birth_date='La fecha no coincide con la CURP';
 if(step===0&&form.birth_date&&form.birth_date>=new Date().toISOString().slice(0,10))issues.birth_date='Debe ser anterior a hoy';
 if(step===2&&form.number_e164&&!/^\+[1-9]\d{1,14}$/.test(form.number_e164))issues.number_e164='Introduce un número internacional válido';
 if(step===1&&form.postal_code&&!/^\d{5}$/.test(form.postal_code))issues.postal_code='Introduce un código postal de 5 dígitos';
 if(step===3&&form.contact_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email))issues.contact_email='Introduce un correo válido';
 if(step===3&&['contact_first_name','contact_paternal_surname','contact_curp'].some(key=>form[key]?.trim())){
  for(const key of ['contact_first_name','contact_paternal_surname','contact_curp'])
   if(!form[key]?.trim())issues[key]='Completa este dato para la identidad estructurada';
  if(form.contact_curp&&!birthDateFromCurp(form.contact_curp))issues.contact_curp='CURP de 18 caracteres con fecha válida';
 }
 return issues;
}
type FamilyEntry={id?:number;name:string;relationship:string;phone:string;email:string;emergency:boolean;pickup_authorized:boolean};
type ApplicantDocument={id:number;title:string;status:'pending'|'approved'|'correction_requested';review_notes?:string};
type FieldApiError=Error & {fieldErrors?:Record<string,string[]>};
export function preferredApplicantRecord(records:Row[],purpose:string):Row|undefined{
 return records.find(item=>item.primary===true&&item.purpose===purpose)
  ||records.find(item=>item.primary===true)||records.find(item=>item.purpose===purpose)||records[0];
}
export function applicantDocumentState(documents:ApplicantDocument[],title:string):ApplicantDocument|undefined{
 return documents.filter(item=>item.title===title).sort((a,b)=>{
  const rank={approved:3,pending:2,correction_requested:1};
  return rank[b.status]-rank[a.status]||b.id-a.id;
 })[0];
}
export default function ApplicantRegistration({years,existing,admissions,onClose,onSaved}:Props){
 const {ui}=useSchoolLocale();
 const [student,setStudent]=useState<Row|null>(existing||null);
 const [admission,setAdmission]=useState<Row|null>(()=>admissions.find(a=>String(a.student_id)===String(existing?.id))||null);
 const [step,setStep]=useState(0),[furthest,setFurthest]=useState(existing?5:0);
 const [savedSteps,setSavedSteps]=useState<number[]>(existing?[0]:[]);
 const [dirty,setDirty]=useState(false),[loadingRecord,setLoadingRecord]=useState(Boolean(existing?.id));
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [readinessLoading,setReadinessLoading]=useState(false),[readinessChecked,setReadinessChecked]=useState(false);
 const stepTitleRef=useRef<HTMLHeadingElement>(null);
 const [form,setForm]=useState<Record<string,string>>({
  first_name:existing?.first_name||'',last_name:existing?.last_name||'',second_last_name:existing?.second_last_name||'',curp:existing?.curp||'',
  birth_place:existing?.birth_place||'',birth_state:existing?.birth_state||'',nationality:existing?.nationality||'MX',sex:existing?.sex||'',
  birth_date:existing?.birth_date||'',academic_year_id:String(years[0]?.id||''),grade_level:'1',
  country_code:'MX',purpose:'home',line1:'',locality:'',region:'',postal_code:'',
  number_e164:'',phone_purpose:'emergency',contact_name:'',relationship:'',contact_phone:'',contact_email:'',
  contact_first_name:'',contact_paternal_surname:'',contact_maternal_surname:'',contact_curp:''
 });
 const [file,setFile]=useState<File|null>(null);
 const [documents,setDocuments]=useState<ApplicantDocument[]>([]);
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
 const registeredName=[form.first_name,form.last_name].filter(Boolean).join(' ')||ui('Aspirante sin nombre');
 const selectedYear=years.find(year=>String(year.id)===form.academic_year_id);
 const requiredDocs=requirements.filter(item=>item.required_for_submission);
 const documentsComplete=Boolean(admission)&&requiredDocs.every(item=>documents.some(doc=>doc.title===item.title&&['pending','approved'].includes(doc.status)));
 const completedSteps=[...savedSteps,...(documentsComplete?[4]:[]),...(admission?.status==='submitted'?[5]:[])];
 const progressLabel=Math.round(new Set(completedSteps).size/stages.length*100);
 const stepIsSaved=(index:number)=>completedSteps.includes(index);
 const isDraft=admission?.status==='draft';
 async function moveTo(target:number){
  if(busy||loadingRecord||target>furthest||target===step)return;
  if(dirty&&editable&&step<4){
   if(!await persistCurrent())return;
  }else if(dirty){
   if(!await confirmDanger('Cambios sin guardar','Los cambios no guardados se perderán. ¿Quieres descartarlos?','Descartar cambios'))return;
   setDirty(false);
  }
  setStep(target);setError('');setErrors({});
 }
 useEffect(()=>{if(step>0)stepTitleRef.current?.focus();},[step]);
 useEffect(()=>{
  if(!existing?.id){setLoadingRecord(false);return;}
  let active=true;
  void Promise.all([
   api('students/'+existing.id+'/details/addresses'),
   api('students/'+existing.id+'/details/phones'),
   api('student_contacts'),
   api('student_documents')
  ]).then(([addresses,phones,contacts,docs])=>{
    if(!active)return;
    const address=preferredApplicantRecord(addresses as Row[],'home');
    const phone=preferredApplicantRecord(phones as Row[],'emergency');
    const related=(contacts as Row[]).filter(row=>String(row.student_id)===String(existing.id));
    const contact=related.find(row=>row.emergency===true)||related[0];
    setFamily(related.filter(row=>row.id!==contact?.id).map(row=>({id:row.id,name:row.name,relationship:row.relationship,phone:row.phone,
      email:row.email||'',emergency:row.emergency===true,pickup_authorized:row.pickup_authorized===true})));
    setPickupAuthorized(contact?.pickup_authorized===true);
    const files=(docs as Row[]).filter(row=>String(row.student_id)===String(existing.id));
    setRecordIds({address:address?.id,phone:phone?.id,contact:contact?.id});
    setDocuments(files.map(row=>({id:Number(row.id),title:String(row.title),
     status:row.status as ApplicantDocument['status'],review_notes:String(row.review_notes||'')})));
    const inferred=PHONE_COUNTRIES.find(item=>item.value===phone?.country_code)
     ||[...PHONE_COUNTRIES].sort((a,b)=>b.dial.length-a.dial.length).find(item=>String(phone?.number_e164||'').startsWith(item.dial));
    setPhoneCountry(inferred?.value||'MX');
    setSavedSteps([0,...(address?[1]:[]),...(phone?[2]:[]),...(contact?[3]:[])]);
    setForm(previous=>({...previous,academic_year_id:String(admission?.academic_year_id||previous.academic_year_id),
     grade_level:String(admission?.grade_level||previous.grade_level),
     country_code:address?.country_code||previous.country_code,
     line1:address?.line1||'',line2:address?.line2||'',neighborhood:address?.neighborhood||'',
     locality:address?.locality||'',region:address?.region||'',postal_code:address?.postal_code||'',
     number_e164:phone?.number_e164||'',
     contact_name:contact?.name||'',relationship:contact?.relationship||'',
     contact_phone:contact?.phone||'',contact_email:contact?.email||'',
     contact_first_name:contact?.first_name||'',contact_paternal_surname:contact?.paternal_surname||'',
     contact_maternal_surname:contact?.maternal_surname||'',contact_curp:contact?.curp||''}));
  }).catch((cause:Error)=>{if(active)setError(cause.message);})
   .finally(()=>{if(active)setLoadingRecord(false);});
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
  setReadinessLoading(true);setReadinessChecked(false);
  void api('admissions/'+admission.id+'/readiness')
   .then((result:{missing_for_submission:string[]})=>{if(active){setChecklist(result.missing_for_submission);setReadinessChecked(true);}})
   .catch((cause:Error)=>{if(active){setError(cause.message);setReadinessChecked(false);}})
   .finally(()=>{if(active)setReadinessLoading(false);});
  return()=>{active=false;};
 },[step,admission?.id]);
 async function uploadDocument(){
  if(!student||!file||busy)return;
  if(file.size>10*1024*1024){setError(ui('Documento: el archivo no debe superar 10 MB.'));return;}
  if(!['application/pdf','image/png','image/jpeg'].includes(file.type)){setError(ui('Documento: selecciona un archivo PDF, PNG o JPG.'));return;}
  setBusy(true);setError('');
  try{
   const payload=new FormData();payload.append('student_id',String(student.id));
   payload.append('title',docTitle.trim()||file.name);payload.append('file',file);
   const uploaded=await api('student_documents','POST',payload);
   setDocuments(current=>[...current,{id:Number(uploaded.id),title:String(uploaded.title),status:uploaded.status||'pending'}]);setFile(null);
   await onSaved();
  }catch(cause){setError((cause as Error).message);}finally{setBusy(false);}
 }

 const markDirty=()=>{setDirty(true);setSavedSteps(previous=>previous.filter(index=>index!==step));};
 const set=(key:string,value:string)=>{markDirty();setErrors(previous=>{const next={...previous};delete next[key];return next;});setForm(current=>{
  if(key==='curp'){
   const normalized=value.toUpperCase().trim();
   const extracted=birthDateFromCurp(normalized);
   return {...current,curp:normalized,...(extracted?{birth_date:extracted}:{})};
  }
  return {...current,[key]:key==='contact_curp'?value.toUpperCase().trim():value};
 });};
 const field=(key:string,label:string,type='text',required=true,helpId?:string)=> <label key={key} className="sc-applicant-field"><span>{ui(label)}{required?' *':''}</span><input type={type} value={form[key]||''}
  onChange={event=>set(key,event.target.value)} required={required} disabled={!editable||busy} aria-invalid={!!errors[key]}
  aria-describedby={[errors[key]?'applicant-error-'+key:null,helpId].filter(Boolean).join(' ')||undefined}/>{errors[key]&&<small id={'applicant-error-'+key} className="sc-applicant-field-error" role="alert">{ui(label)}: {ui(errors[key])}</small>}</label>;
 async function persistCurrent():Promise<boolean>{
  if(busy||loadingRecord)return false;
  if(step>=4)return true;
  setError('');setErrors({});
  const invalid=applicantStepIssues(step,form,curpDate);
  if(Object.keys(invalid).length){setErrors(invalid);setError(ui('Revisa los campos marcados.'));return false;}
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
     number_e164:form.number_e164,country_code:phoneCountry,purpose:'emergency',primary:true
    });
    setRecordIds(previous=>({...previous,phone:updated.id}));
   }else if(step===3){
    if(!form.contact_name.trim()||!form.relationship.trim()||!form.contact_phone.trim())throw Error(ui('Agrega al menos un contacto familiar.'));
    const updated=await api('student_contacts'+(recordIds.contact?'/'+recordIds.contact:''),recordIds.contact?'PATCH':'POST',{
     student_id:student?.id,name:form.contact_name,relationship:form.relationship,
     phone:form.contact_phone,email:form.contact_email,emergency:true,pickup_authorized:pickupAuthorized,
     first_name:form.contact_first_name||null,paternal_surname:form.contact_paternal_surname||null,
     maternal_surname:form.contact_maternal_surname||null,curp:form.contact_curp||null});
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
   setSavedSteps(previous=>previous.includes(step)?previous:[...previous,step]);
   setDirty(false);
   return true;
  }catch(e){
   const failure=e as FieldApiError;
   if(failure.fieldErrors)setErrors(Object.fromEntries(Object.entries(failure.fieldErrors).map(([key,values])=>[key,values.join(', ')])));
   setError(failure.message);return false;
  }finally{setBusy(false);}
 }
 async function proceed(){
  if(!editable||busy||loadingRecord)return;
  if(!await persistCurrent())return;
  const following=Math.min(step+1,5);
  setFurthest(current=>Math.max(current,following));
  setStep(following);
 }
 async function saveAndExit(){
  if(busy||loadingRecord)return;
  if(!editable||(!dirty&&!file)){onClose();return;}
  if(file){setError('Hay un archivo seleccionado sin adjuntar. Adjúntalo antes de salir o retíralo.');return;}
  if(step<4){
   if(await persistCurrent())onClose();
  }else onClose();
 }
 async function removeFamily(person:FamilyEntry,index:number){
  if(busy||!editable)return;
  if(person.id){
   if(!await confirmDanger('Eliminar familiar','Se eliminará el familiar guardado en el expediente. Esta acción no se puede deshacer.'))return;
   setBusy(true);setError('');
   try{
    await api('student_contacts/'+person.id,'DELETE');await onSaved();
    setFamily(previous=>previous.filter(item=>item.id!==person.id));
   }catch(e){setError((e as Error).message);}
   finally{setBusy(false);}
  }else setFamily(previous=>previous.filter((_,i)=>i!==index));
 }
 async function send(){
  if(!admission||busy||readinessLoading||!readinessChecked||checklist.length)return;setBusy(true);setError('');
  try{await api('admissions/'+admission.id+'/submit','POST');await onSaved();onClose();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-applicant-wizard sc-applicant-redesign" aria-label={ui('Registro de aspirante')}>
  <div className="sc-applicant-topline"><button type="button" className="sc-applicant-backlink" disabled={busy||loadingRecord} onClick={()=>void saveAndExit()}><ArrowLeft size={16}/>{ui('Mis aspirantes')}</button>
   <div className="sc-applicant-topline-right"><span><LockKeyhole size={13}/>{ui('Expediente privado')}</span><span><BookOpenCheck size={13}/>{ui('Nuevo ingreso a primaria')}</span></div></div>
  <header className="sc-applicant-wizard-header"><div className="sc-applicant-hero-copy">
   <div className="eyebrow"><span className="sc-applicant-eyebrow-dot"/>{ui('PORTAL DE FAMILIAS · ADMISIÓN ESCOLAR')}</div>
   <h1>{student?ui('Completar expediente de aspirante'):ui('Registro de aspirante')}</h1>
   <p>{ui('Completa los datos de cada sección. El sistema guardará tu información al avanzar o salir.')}</p>
   <div className="sc-applicant-hero-badges"><span className="sc-applicant-hero-stage"><ClipboardCheck size={15}/>{ui('Paso')} {step+1} {ui('de')} 6 · {ui(stages[step])}</span>
    <span className="sc-applicant-hero-state"><span/>{ui(admission?.status==='correction_requested'?'Correcciones solicitadas':isDraft?'Borrador guardado':'Captura inicial')}</span>
    {admission?.folio&&<span className="sc-applicant-folio">{ui('Folio')}: {admission.folio}</span>}</div>
  </div><div className="sc-applicant-hero-mascot"><img src="/illustrations/auli-welcome.svg" alt={ui('Auli, mascota de School Control')}/>
   <div className="sc-applicant-hero-mascot-caption"><Sparkles size={14}/><strong>{ui('Auli te acompaña en tu registro')}</strong></div></div></header>
  <div className="sc-applicant-mobile-progress"><div><strong>{ui('Paso')} {step+1} / 6 · {ui(stages[step])}</strong><small>{progressLabel}%</small></div>
   <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressLabel} aria-label={ui('Avance guardado del registro')}><span style={{width:progressLabel+'%'}}/></div>
   <nav className="sc-applicant-mobile-steps" aria-label={ui('Navegar entre las etapas del registro')}>
    {stages.map((name,index)=><button key={name} type="button" aria-current={step===index?'step':undefined}
     className={step===index?'is-current':''} disabled={busy||loadingRecord||index>furthest}
     onClick={()=>void moveTo(index)}>{stepIsSaved(index)?<Check size={13}/>:index+1} {ui(name)}</button>)}
   </nav></div>
  <nav className="sc-applicant-progress-shell" aria-label={ui('Etapas del registro')}>
   <ol className="sc-applicant-progress">{stages.map((name,index)=>{const Icon=icons[index];const completed=stepIsSaved(index);return <li key={name}
    aria-current={step===index?'step':undefined} className={[completed?'is-done':'',step===index?'is-current':''].join(' ')}>
    <button type="button" disabled={busy||loadingRecord||index>furthest} aria-label={ui('Ir a')+' '+ui(name)}
     aria-current={step===index?'step':undefined} onClick={()=>moveTo(index)}>
     <span className="sc-applicant-progress-index">{completed?<Check size={17}/>:<Icon size={17}/>}</span>
     <span className="sc-applicant-progress-text"><strong>{ui(name)}</strong><small>{ui(completed?'Guardado':index===step?'En curso':index<furthest?'Disponible':'Pendiente')}</small></span>
    </button></li>;})}</ol>
  </nav>
  <div className="sc-applicant-body"><div className="sc-applicant-step">
   <div className="sc-applicant-step-title"><div className="sc-applicant-step-icon">{(() => {const Icon=icons[step];return <Icon size={22}/>;})()}</div>
    <div><span>{ui('SECCIÓN')} {String(step+1).padStart(2,'0')} / 06</span><h2 tabIndex={-1} ref={stepTitleRef}>{ui(stages[step])}</h2><p>{ui(stageDescriptions[step])}</p></div>
    <span className="sc-applicant-step-badge">{progressLabel}% {ui('guardado')}</span></div>
   <div className="sc-applicant-step-description"><Info size={16}/><p>{ui(tips[step])}</p></div>
   {step===0&&<><div className="sc-applicant-subheading"><IdCard size={17}/>{ui('Datos personales')}</div><div className="sc-applicant-grid">{field('first_name','Nombre(s)')}{field('last_name','Primer apellido')}
    {field('second_last_name','Segundo apellido','text',false)}
    <div className="sc-applicant-curp-group">
     {field('curp','CURP','text',true,'applicant-curp-feedback')}
     <small id="applicant-curp-feedback" className={'sc-applicant-curp-indicator'+(curpDate?' is-valid':'')}>{ui('CURP')}: {ui(curpStatus)}</small>
    </div>
    <div className="sc-applicant-birthdate-group">
     {field('birth_date','Fecha de nacimiento','date',true,curpDate?'applicant-birthdate-feedback':undefined)}
     {curpDate&&<small id="applicant-birthdate-feedback" className="sc-applicant-curp-hint" role="status">
      {ui('Fecha de nacimiento obtenida automáticamente de la CURP. Verifica que coincida con el acta de nacimiento.')}
     </small>}
    </div>
    {field('birth_place','Lugar de nacimiento','text',false)}
    {field('birth_state','Entidad de nacimiento','text',false)}{field('nationality','Nacionalidad','text',false)}
    <label className="sc-applicant-field"><span>{ui('Sexo (opcional)')}</span>
     <Combobox label={ui('Sexo')} value={form.sex||''} onChange={value=>set('sex',value)} searchable={false}
      options={[{value:'female',label:ui('Mujer')},{value:'male',label:ui('Hombre')},{value:'unspecified',label:ui('No especificado')}]}/></label></div><div className="sc-applicant-subheading"><CalendarDays size={17}/>{ui('Datos académicos iniciales')}</div><div className="sc-applicant-grid">
    <label className="sc-applicant-field"><span>{ui('Ciclo escolar')} *</span><Combobox label={ui('Ciclo escolar')} value={form.academic_year_id} onChange={value=>set('academic_year_id',value)} searchable={years.length>7} options={years.map(year=>({value:String(year.id),label:year.name}))}/></label>
    <label className="sc-applicant-field"><span>{ui('Grado solicitado')}</span><Combobox label={ui('Grado solicitado')} value={form.grade_level} onChange={value=>set('grade_level',value)} searchable={false} options={[{value:'1',label:ui('Primero de primaria')}]}/></label>
   </div></>}
   {step===1&&<div className="sc-applicant-grid">{field('country_code','Código de país ISO')}{field('line1','Calle y número exterior')}
    {field('line2','Número interior y referencias','text',false)}
    {field('neighborhood','Colonia','text',false)}{field('locality','Municipio o alcaldía')}{field('region','Estado')}{field('postal_code','Código postal','text',false)}</div>}
   {step===2&&<div className="sc-applicant-grid"><div className="sc-applicant-field"><span>{ui('País y prefijo')}</span><Combobox label={ui('País y prefijo')} searchable={PHONE_COUNTRIES.length>7} value={phoneCountry} onChange={value=>{
      const oldDial=PHONE_COUNTRIES.find(c=>c.value===phoneCountry)?.dial||'+52';
      const newDial=PHONE_COUNTRIES.find(c=>c.value===value)?.dial||'+52';
      setPhoneCountry(value);
      const local=form.number_e164.startsWith(oldDial)?form.number_e164.slice(oldDial.length):form.number_e164.replace(/^\+\d{1,3}/,'');
      set('number_e164',newDial+local);
     }} options={PHONE_COUNTRIES.map(c=>({value:c.value,label:c.label}))}/></div>{field('number_e164','Teléfono de emergencia con código internacional','tel')}
    <p className="sc-applicant-hint">{ui('Verifica que el país corresponda al prefijo internacional. Puedes agregar teléfonos adicionales desde el expediente.')}</p></div>}
   {step===3&&<div className="sc-applicant-family">
    <div className="sc-applicant-grid">{field('contact_name','Nombre del familiar')}<label className="sc-applicant-field"><span>{ui('Parentesco')} *</span><Combobox label={ui('Parentesco')} value={form.relationship||''} onChange={value=>set('relationship',value)} options={relationshipChoices(form.relationship)} searchable placeholder={ui('Selecciona un parentesco')}/>{errors.relationship&&<small className="sc-applicant-field-error" role="alert">{ui('Parentesco')}: {ui(errors.relationship)}</small>}</label>
     {field('contact_phone','Teléfono de contacto','tel')}{field('contact_email','Correo electrónico','email',false)}
     <details className="sc-applicant-identity-extra"><summary>{ui('Identidad adicional del familiar (opcional)')}</summary>
      <p>{ui('Si capturas los datos de identidad, registra nombre, primer apellido y CURP del familiar.')}</p>
      <div className="sc-applicant-grid">{field('contact_first_name','Nombre(s) del familiar','text',false)}
       {field('contact_paternal_surname','Primer apellido del familiar','text',false)}
       {field('contact_maternal_surname','Segundo apellido del familiar','text',false)}
       {field('contact_curp','CURP del familiar','text',false)}</div>
     </details>
     <label className="sc-applicant-switch"><input type="checkbox" checked={pickupAuthorized} onChange={e=>{setPickupAuthorized(e.target.checked);markDirty();}}/><span className="sc-applicant-switch-track"/><span>{ui('Autorizado para recoger al menor')}</span></label>
    </div>
    <div className="sc-applicant-family-extras">
     {family.map((person,index)=><fieldset key={person.id||index} className="sc-applicant-family-entry"><legend>{ui('Familiar adicional')} {index+1}</legend><button type="button" className="sc-applicant-remove-family" aria-label={ui('Eliminar familiar adicional')+' '+(index+1)} disabled={busy||!editable} onClick={()=>void removeFamily(person,index)}><Trash2 size={15}/>{ui('Eliminar')}</button>
      <div className="sc-applicant-grid">{([
       ['name','Nombre completo'],['relationship','Parentesco'],['phone','Teléfono'],['email','Correo electrónico']
      ] as const).map(([key,label])=><label key={key} className="sc-applicant-field"><span>{ui(label)}</span>{key==='relationship'?<Combobox label={ui('Parentesco')+' '+(index+1)} value={person.relationship} options={relationshipChoices(person.relationship)} searchable placeholder={ui('Selecciona un parentesco')} onChange={value=>{markDirty();setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,relationship:value}:entry));}}/>:<input type={key==='email'?'email':'text'} value={person[key]} onChange={e=>{markDirty();setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,[key]:e.target.value}:entry));}}/>}</label>)}</div>
      <div className="sc-applicant-family-flags"><label className="sc-applicant-switch"><input type="checkbox" checked={person.emergency} onChange={e=>{markDirty();setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,emergency:e.target.checked}:entry));}}/><span className="sc-applicant-switch-track"/><span>{ui('Contacto de emergencia')}</span></label>
      <label className="sc-applicant-switch"><input type="checkbox" checked={person.pickup_authorized} onChange={e=>{markDirty();setFamily(previous=>previous.map((entry,i)=>i===index?{...entry,pickup_authorized:e.target.checked}:entry));}}/><span className="sc-applicant-switch-track"/><span>{ui('Autorizado para recoger')}</span></label></div>
     </fieldset>)}
    </div>
    <button type="button" className="secondary" disabled={busy||!editable} onClick={()=>{markDirty();setFamily(previous=>[...previous,{name:'',relationship:'',phone:'',email:'',emergency:false,pickup_authorized:false}]);}}>{ui('Agregar otro familiar')}</button>
    <p className="sc-applicant-hint"><Users size={16}/>{ui('El tutor que inició sesión permanece vinculado como responsable principal. La autorización de recogida se registra por persona.')}</p>
   </div>}
   {step===4&&<div className="sc-applicant-documents"><div className="sc-applicant-document-head"><span className="sc-applicant-document-icon"><UploadCloud size={24}/></span><div><h3>{ui('Documentación del expediente')}</h3><p>{ui('Adjunta un PDF, PNG o JPG de hasta 10 MB. Los documentos obligatorios dependen del ciclo y grado.')}</p></div></div>
    {requirements.length>0&&<label className="sc-applicant-field"><span>{ui('Tipo de documento')}</span><Combobox label={ui('Tipo de documento')} value={docTitle} onChange={setDocTitle} options={requirements.map(r=>({value:r.title,label:r.title}))}/></label>}
    <label className={'sc-applicant-dropzone'+(dragging?' is-dragging':'')} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files[0])setFile(e.dataTransfer.files[0]);}}><UploadCloud size={24}/><strong>{file?file.name:ui('Arrastra o selecciona tu documento')}</strong><small>{ui('PDF, PNG, JPG · máximo 10 MB')}</small><input type="file" aria-label={ui('Documento del aspirante')} accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
    <button type="button" className="secondary" disabled={busy||!file} onClick={()=>void uploadDocument()}>{ui('Adjuntar documento')}</button>
    <div className="sc-applicant-doc-list">{requirements.map(req=>{const doc=applicantDocumentState(documents,req.title);return <article key={req.title}><FileText size={16}/>
      <strong>{req.title}</strong><span className={doc?.status==='approved'?'is-uploaded':doc?.status==='correction_requested'?'is-required':''}>
       {doc?.status==='approved'?ui('Aprobado'):doc?.status==='pending'?ui('En revisión'):
        doc?.status==='correction_requested'?ui('Requiere corrección'):
        req.required_for_submission?ui('Obligatorio · pendiente'):ui('Opcional')}</span>
      {doc?.review_notes&&<small className="sc-applicant-document-note">{doc.review_notes}</small>}
     </article>;})}</div>
     {documents.map(doc=><span className="sc-applicant-uploaded" key={doc.id}><CheckCircle2 size={15}/>{doc.title} ·
      {ui(doc.status==='approved'?'Aprobado':doc.status==='pending'?'En revisión':'Corrección solicitada')}</span>)}</div>}
   {step===5&&<div className="sc-applicant-review"><div className="sc-applicant-review-title"><span><ShieldCheck size={26}/></span><div><h3>{ui('Revisa antes de enviar')}</h3><p>{ui('Verifica los datos capturados antes de presentar tu solicitud.')}</p></div></div>
    <div className="sc-applicant-review-grid">{[{label:'Identidad',value:(student?.full_name||form.first_name+' '+form.last_name)+' · '+form.curp,index:0},{label:'Domicilio',value:form.line1+', '+form.locality,index:1},{label:'Teléfonos',value:form.number_e164,index:2},{label:'Familiares',value:form.contact_name,index:3},{label:'Documentos',value:documents.length+' '+ui('archivos cargados'),index:4}].map(item=><article key={item.label}><div><strong>{ui(item.label)}</strong><p>{item.value||ui('Pendiente')}</p></div><button className="secondary" type="button" onClick={()=>setStep(item.index)}>{ui('Editar')}</button></article>)}</div>
    <p>{ui('Al enviar, el equipo escolar revisará la solicitud. La aprobación no significa inscripción automática.')}</p>
    {checklist.length>0&&<div role="alert" className="sc-applicant-missing"><strong>{ui('Antes de enviar, completa lo siguiente:')}</strong>
      <ul>{checklist.map(missing=><li key={missing}><span>{missing}</span>
       <button className="secondary" type="button" onClick={()=>void moveTo(missing.includes('Documento')?4:missing.includes('Domicilio')?1:missing.includes('Teléfono')?2:missing.includes('Contacto')||missing.includes('Tutor')?3:0)}>{ui('Corregir')}</button>
      </li>)}</ul></div>}
    {readinessLoading&&<p role="status" className="sc-applicant-review-checking">{ui('Comprobando requisitos del expediente…')}</p>}
     {readinessChecked&&checklist.length===0&&<p role="status" className="sc-applicant-review-ready"><CheckCircle2 size={17}/>{ui('Sin secciones obligatorias pendientes de completar.')}</p>}</div>}
   {admission&&!editable&&<p className="sc-applicant-hint" role="status">{ui('Esta solicitud ya fue enviada o resuelta. Consulta el estado desde el listado de admisiones.')}</p>}
   {error&&<p role="alert" className="sc-applicant-error">{error}</p>}
    <footer className="sc-applicant-step-actions"><div className="sc-applicant-step-actions-secondary">
     <button className="sc-applicant-exit" type="button" disabled={busy||loadingRecord} onClick={()=>void saveAndExit()}><Save size={15}/>{ui(dirty?'Guardar borrador y salir':'Salir y continuar después')}</button>
     {step>0&&<button className="secondary sc-applicant-previous" type="button" disabled={busy} onClick={()=>void moveTo(step-1)}><ArrowLeft size={16}/>{ui('Anterior')}</button>}</div>
     {step<5?<button className="primary sc-applicant-next" type="button" disabled={busy||!editable} onClick={()=>void proceed()}>{busy?ui('Guardando…'):ui('Guardar y continuar')}<ArrowRight size={16}/></button>:
      <button className="primary sc-applicant-next" type="button" disabled={busy||!admission||!editable||readinessLoading||!readinessChecked||checklist.length>0} onClick={()=>void send()}><Send size={16}/>{busy?ui('Enviando…'):ui('Enviar solicitud')}</button>}
    </footer>
   </div><aside className="sc-applicant-guidance">
    <section className="sc-applicant-context-card">
     <div className="sc-applicant-context-head"><span><UserRoundCheck size={18}/></span><div><strong>{ui('Tu expediente')}</strong><small>{ui('Resumen del registro')}</small></div></div>
     <div className="sc-applicant-context-person"><strong>{registeredName}</strong><small>{ui(isDraft?'Borrador de admisión':'Registro del aspirante')}</small></div>
     <dl><div><dt>{ui('Ciclo escolar')}</dt><dd>{selectedYear?.name||'—'}</dd></div>
      <div><dt>{ui('Grado solicitado')}</dt><dd>{ui('Primero de primaria')}</dd></div>
      <div><dt>{ui('Secciones guardadas')}</dt><dd>{new Set(completedSteps).size} / 6</dd></div>
      <div><dt>{ui('Documentos adjuntos')}</dt><dd>{documents.length}</dd></div></dl>
     <div className="sc-applicant-context-note"><LockKeyhole size={15}/><span>{ui('La solicitud solo se enviará al presionar Enviar solicitud en el último paso.')}</span></div>
    </section>
    <section className="sc-applicant-auli-tip"><img src="/illustrations/auli-explain.svg" alt=""/><div><strong>{ui('Auli recomienda')}</strong><p>{ui('Verifica la información antes de guardar y conserva los documentos originales.')}</p></div></section>
   </aside></div></section>;
}
