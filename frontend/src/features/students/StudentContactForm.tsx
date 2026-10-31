import {useState,type FormEvent} from 'react';
import Swal from 'sweetalert2';
import {AlertCircle,CheckCircle2,IdCard,LoaderCircle,Mail,Phone,Save,ShieldCheck,UserRound,UsersRound} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {familyContactFullName} from '../contacts/EditFamilyContactForm';
import {parseFamilyCurp} from '../contacts/familyCurp';
import Combobox from '../../shared/components/Combobox';
import {relationshipChoices} from '../../shared/relationships';

type Key='first_name'|'middle_name'|'paternal_surname'|'maternal_surname'|'curp'|'relationship'|'legacy_phone'|'email';
type Values=Record<Key,string>&{emergency:boolean;pickup_authorized:boolean;primary:boolean};
type Props={initial:Row;studentName:string;busy:boolean;error:string;fieldErrors:Record<string,string[]>;onSave:(values:Row)=>void;onCancel:()=>void};
const labels:Record<Key,string>={
 first_name:'Primer nombre',middle_name:'Segundo nombre',paternal_surname:'Apellido paterno',
 maternal_surname:'Apellido materno',curp:'CURP',relationship:'Parentesco',
 legacy_phone:'Teléfono',email:'Correo electrónico'
};
const truthy=(v:unknown)=>v===true||v===1||v==='true'||v==='1';
export function studentContactFormValues(record:Row):Values{
 return {
  first_name:String(record.first_name??''),middle_name:String(record.middle_name??''),
  paternal_surname:String(record.paternal_surname??''),maternal_surname:String(record.maternal_surname??''),
  curp:String(record.curp??''),relationship:String(record.relationship??''),
  legacy_phone:String(record.legacy_phone??record.phone??''),email:String(record.email??''),
  emergency:truthy(record.emergency),pickup_authorized:truthy(record.pickup_authorized),
  primary:truthy(record.primary)
 };
}
export function validateStudentContact(values:Values):Partial<Record<Key,string>>{
 const errors:Partial<Record<Key,string>>={};
 for(const key of ['first_name','middle_name','paternal_surname','maternal_surname','relationship'] as const){
  const text=values[key].trim();
  if(['first_name','paternal_surname','relationship'].includes(key)&&!text)errors[key]=labels[key]+' es obligatorio.';
  else if(text.length>(key==='relationship'?150:80))errors[key]=labels[key]+' supera la longitud permitida.';
 }
 const phone=values.legacy_phone.trim();
 if(!phone)errors.legacy_phone='Teléfono es obligatorio.';
 else if(!/^\+?[0-9 ()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7)
  errors.legacy_phone='Teléfono ingresa un número válido de al menos 7 dígitos.';
 if(!values.curp.trim())errors.curp='CURP es obligatoria.';
 else if(!parseFamilyCurp(values.curp))errors.curp='CURP debe contener 18 caracteres, fecha y dígito verificador válidos.';
 if(values.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
  errors.email='Correo electrónico ingresa una dirección válida.';
 return errors;
}
export function studentContactPayload(values:Values,mirror:boolean):Row{
 const payload:Row={
  first_name:values.first_name.trim(),middle_name:values.middle_name.trim()||null,
  paternal_surname:values.paternal_surname.trim(),maternal_surname:values.maternal_surname.trim()||null,
  curp:values.curp.trim().toUpperCase(),relationship:values.relationship.trim(),
  email:values.email.trim()||null,emergency:values.emergency,pickup_authorized:values.pickup_authorized
 };
 if(mirror)payload.phone=values.legacy_phone.trim();
 else{payload.legacy_phone=values.legacy_phone.trim();payload.primary=values.primary;}
 return payload;
}

export default function StudentContactForm({initial,studentName,busy,error,fieldErrors,onSave,onCancel}:Props){
 const {ui}=useSchoolLocale();
 const mirror=Boolean(initial.legacy_student_contact_id);
 const [values,setValues]=useState<Values>(()=>studentContactFormValues(initial));
 const [validation,setValidation]=useState<Partial<Record<Key,string>>>({});
 const [modified,setModified]=useState<Partial<Record<Key,boolean>>>({});
 const original=studentContactFormValues(initial);
 const dirty=(Object.keys(original) as (keyof Values)[]).some(key=>{
  const a=original[key],b=values[key];
  return typeof a==='string'&&typeof b==='string'?a.trim()!==b.trim():a!==b;
 });
 const fullName=familyContactFullName(values);
 const initialName=String(initial.name||'').trim();
 const showLegacy=Boolean(initial.id&&!initial.curp);
 const hasErrors=Object.keys(validation).length>0;
 const feedback=(key:Key)=>validation[key]||(!modified[key]&&fieldErrors[key]?.length?labels[key]+' '+fieldErrors[key][0]:undefined);
 const update=<K extends keyof Values>(key:K,value:Values[K])=>{
  setValues(v=>({...v,[key]:value}));
  setModified(v=>({...v,[key]:true}));
  if(key in validation)setValidation(v=>({...v,[key]:undefined}));
 };
 async function cancel(){
  if(busy)return;
  if(!dirty){onCancel();return;}
  const answer=await Swal.fire({title:'¿Descartar los cambios?',text:'Los cambios de este contacto aún no se han guardado.',
   icon:'warning',showCancelButton:true,confirmButtonText:'Descartar cambios',cancelButtonText:'Seguir editando',
   reverseButtons:true,focusCancel:true,buttonsStyling:false,
   customClass:{popup:'school-dialog',title:'school-dialog-title',confirmButton:'school-dialog-confirm',cancelButton:'school-dialog-cancel'}});
  if(answer.isConfirmed)onCancel();
 }
 function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  const issues=validateStudentContact(values);
  setValidation(issues);
  const first=(Object.keys(issues) as Key[])[0];
  if(first){document.getElementById('student-contact-'+first)?.focus();return;}
  if(busy||(!dirty&&initial.id))return;
  onSave(studentContactPayload(values,mirror));
 }
 function field(key:Key,placeholder:string,Icon:typeof UserRound,optional=false,help?:string){
  const issue=feedback(key);
  return <div className={'sc-student-contact-field'+(key==='curp'?' is-curp':'')} key={key}>
   <label htmlFor={'student-contact-'+key}>{ui(labels[key])}{optional?<small>{ui('Opcional')}</small>:<span aria-hidden="true" className="required"> *</span>}</label>
   <div className={'sc-student-contact-input'+(issue?' has-error':'')}>
    <Icon size={17} aria-hidden="true"/>
    <input id={'student-contact-'+key} value={values[key]} disabled={busy}
     type={key==='email'?'email':key==='legacy_phone'?'tel':'text'}
     autoComplete={key==='first_name'?'given-name':key==='paternal_surname'?'family-name':key==='email'?'email':key==='legacy_phone'?'tel':'off'}
     maxLength={key==='curp'?18:undefined} inputMode={key==='legacy_phone'?'tel':undefined}
     placeholder={ui(placeholder)} aria-invalid={Boolean(issue)}
     aria-describedby={issue?'student-contact-'+key+'-error':help?'student-contact-'+key+'-help':undefined}
     onChange={event=>update(key,key==='curp'?event.target.value.toUpperCase():event.target.value)}/>
   </div>
   {issue?<small className="sc-student-contact-error" role="alert" id={'student-contact-'+key+'-error'}>{ui(issue)}</small>:
    help?<small className="sc-student-contact-help" id={'student-contact-'+key+'-help'}>{ui(help)}</small>:null}
  </div>;
 }
 function switchField(key:'emergency'|'pickup_authorized'|'primary',title:string,description:string,Icon:typeof ShieldCheck){
  return <label className="sc-student-contact-permission" key={key}>
   <span className="sc-student-contact-permission-icon"><Icon size={20}/></span>
   <span className="sc-student-contact-permission-text"><strong>{ui(title)}</strong><small>{ui(description)}</small></span>
   <span className="sc-student-contact-switch"><input type="checkbox" role="switch" checked={values[key]}
    aria-label={ui(title)} disabled={busy} onChange={e=>update(key,e.target.checked)}/><span aria-hidden="true"/></span>
  </label>;
 }
 return <form className="sc-student-contact-form" noValidate onSubmit={submit}>
  {showLegacy&&<div className="sc-student-contact-legacy" role="status"><AlertCircle size={18}/><p>{ui('Este contacto tiene un nombre anterior sin separar. Conservamos el original; completa los campos para actualizar su identidad, sin inventar apellidos ni CURP.')}</p></div>}
  {mirror&&<p className="sc-student-contact-linked"><UsersRound size={17}/>{ui('Contacto vinculado con Contactos familiares. Los cambios se sincronizan con ambos módulos.')}</p>}
  <section className="sc-student-contact-section" aria-labelledby="sc-student-contact-identity">
   <header><span className="sc-student-contact-section-icon"><IdCard size={20}/></span><div>
    <h4 id="sc-student-contact-identity">{ui('Identidad del familiar')}</h4>
    <p>{ui('Registra cada nombre y apellido como aparece en sus documentos oficiales.')}</p></div></header>
   <div className="sc-student-contact-grid">
    {field('first_name','Ej. María',UserRound)}
    {field('middle_name','Ej. Fernanda',UserRound,true)}
    {field('paternal_surname','Ej. Hernández',UserRound)}
    {field('maternal_surname','Ej. López',UserRound,true)}
    {field('curp','18 caracteres',IdCard,false,'La fecha de nacimiento y el sexo codificado se guardan internamente; no se verifica la identidad ante RENAPO.')}
   </div>
   <div className="sc-student-contact-preview" aria-live="polite">
    <span>{ui('Nombre completo generado automáticamente')}</span>
    <strong>{fullName||initialName||ui('Completa los datos del familiar')}</strong>
    <small>{ui('Los campos opcionales vacíos no se incluyen en el nombre.')}</small>
   </div>
  </section>
  <section className="sc-student-contact-section" aria-labelledby="sc-student-contact-connection">
   <header><span className="sc-student-contact-section-icon"><Phone size={20}/></span><div>
    <h4 id="sc-student-contact-connection">{ui('Parentesco y comunicación')}</h4>
    <p>{ui('Estos datos ayudan a contactar a la persona cuando la escuela lo necesite.')}</p></div></header>
   <div className="sc-student-contact-grid">
    <div className="sc-student-contact-field">
     <label htmlFor="student-contact-relationship">{ui('Parentesco')} <span aria-hidden="true" className="required">*</span></label>
     <Combobox id="student-contact-relationship" label={ui('Parentesco')} value={values.relationship} onChange={value=>update('relationship',value)}
      options={relationshipChoices(values.relationship)} searchable disabled={busy} placeholder={ui('Selecciona un parentesco')}
      invalid={!!feedback('relationship')} describedBy={feedback('relationship')?'student-contact-relationship-error':undefined}/>
     {feedback('relationship')&&<small id="student-contact-relationship-error" className="sc-student-contact-error" role="alert">{ui(feedback('relationship')||'')}</small>}
    </div>
    {field('legacy_phone','Ej. 55 1234 5678',Phone)}
    {field('email','correo@ejemplo.com',Mail,true)}
   </div>
  </section>
  <section className="sc-student-contact-section" aria-labelledby="sc-student-contact-authorizations">
   <header><span className="sc-student-contact-section-icon"><ShieldCheck size={20}/></span><div>
    <h4 id="sc-student-contact-authorizations">{ui('Autorizaciones del expediente')}</h4>
    <p>{ui('Confirma qué acciones puede realizar este familiar respecto del alumno.')}</p></div></header>
   <div className="sc-student-contact-permissions">
    {switchField('emergency','Contacto de emergencia','Puede ser contactado en una emergencia.',AlertCircle)}
    {switchField('pickup_authorized','Autorizado para recoger','Tiene autorización para recoger al alumno.',CheckCircle2)}
    {!mirror&&switchField('primary','Contacto principal','Se identifica como contacto principal del alumno.',ShieldCheck)}
   </div>
  </section>
  {error&&<div className="sc-student-contact-server-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
  <footer className="sc-student-contact-footer">
   <div className="sc-student-contact-context"><strong>{studentName}</strong><span>{busy?ui('Guardando y verificando datos…'):hasErrors?ui('Revisa las validaciones señaladas.'):dirty?ui('Cambios pendientes por guardar'):ui('Información sin modificaciones')}</span></div>
   <div className="sc-student-contact-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>void cancel()}>{ui('Cancelar')}</button>
    <button type="submit" className="primary" disabled={busy||(!dirty&&Boolean(initial.id))}>{busy?<LoaderCircle size={17} className="sc-student-contact-spinner"/>:<Save size={17}/>}
     {ui(busy?'Guardando…':initial.id?'Guardar cambios':'Registrar contacto')}</button></div>
  </footer>
 </form>;
}
