import {useEffect,useState,type FormEvent} from 'react';
import Swal from 'sweetalert2';
import {AlertCircle,ContactRound,LoaderCircle,Mail,Phone,Save,ShieldCheck,UserRound,UsersRound,X} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

type EditableKey='name'|'relationship'|'phone'|'email';
type ContactValues={name:string;relationship:string;phone:string;email:string;emergency:boolean;pickup_authorized:boolean};
type Props={initial:Row;studentName:string;busy:boolean;error:string;fieldErrors?:Record<string,string[]>;onCancel:()=>void;onSubmit:(values:Row)=>void};

const enabled=(value:unknown)=>value===true||value===1||value==='true'||value==='1';
const labels:Record<EditableKey,string>={name:'Nombre completo',relationship:'Parentesco',phone:'Teléfono',email:'Correo electrónico'};
const EMPTY_FIELD_ERRORS:Record<string,string[]>={};

export function familyContactValues(initial:Row):ContactValues{
 return {name:String(initial.name??''),relationship:String(initial.relationship??''),phone:String(initial.phone??''),
  email:String(initial.email??''),emergency:enabled(initial.emergency),pickup_authorized:enabled(initial.pickup_authorized)};
}

export function validateFamilyContact(values:ContactValues):Partial<Record<EditableKey,string>>{
 const errors:Partial<Record<EditableKey,string>>={};
 for(const key of ['name','relationship','phone'] as EditableKey[]){
  if(!values[key].trim())errors[key]=labels[key]+' no puede estar vacío.';
  else if(values[key].trim().length>150)errors[key]=labels[key]+' no puede superar los 150 caracteres.';
 }
 const phone=values.phone.trim();
 if(phone&&(!/^\+?[0-9 ()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7))
  errors.phone='Teléfono ingresa un número válido de al menos 7 dígitos (máximo 30 caracteres).';
 const email=values.email.trim();
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))errors.email='Correo electrónico ingresa una dirección válida.';
 return errors;
}

export default function EditFamilyContactForm({initial,studentName,busy,error,fieldErrors=EMPTY_FIELD_ERRORS,onCancel,onSubmit}:Props){
 const {ui}=useSchoolLocale();
 const [values,setValues]=useState<ContactValues>(()=>familyContactValues(initial));
 const [errors,setErrors]=useState<Partial<Record<EditableKey,string>>>({});
 const [dismissed,setDismissed]=useState<Partial<Record<EditableKey,boolean>>>({});
 useEffect(()=>setDismissed({}),[fieldErrors]);
 const original=familyContactValues(initial);
 const changed=(Object.keys(original) as (keyof ContactValues)[]).some(key=>{
  const a=original[key],b=values[key];
  return typeof a==='string'&&typeof b==='string'?a.trim()!==b.trim():a!==b;
 });
 const displayName=String(initial.name||'Contacto familiar').trim();
 const initials=displayName.split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join('').toUpperCase();
 const fieldError=(key:EditableKey)=>errors[key]||(!dismissed[key]&&fieldErrors[key]?.[0]?
  labels[key]+' '+fieldErrors[key][0].replace(/\.$/,'')+'.':'');
 function update<Key extends keyof ContactValues>(key:Key,value:ContactValues[Key]){
  setValues(previous=>({...previous,[key]:value}));
  setErrors(previous=>({...previous,[key]:undefined}));
  setDismissed(previous=>({...previous,[key]:true}));
 }
 async function cancel(){
  if(busy)return;
  if(!changed){onCancel();return;}
  const result=await Swal.fire({
   title:'¿Descartar los cambios?',
   text:'Los cambios de este contacto todavía no se han guardado.',
   icon:'warning',showCancelButton:true,confirmButtonText:'Descartar cambios',
   cancelButtonText:'Continuar editando',reverseButtons:true,focusCancel:true,
   buttonsStyling:false,customClass:{popup:'school-dialog',title:'school-dialog-title',
    confirmButton:'school-dialog-confirm',cancelButton:'school-dialog-cancel'}
  });
  if(result.isConfirmed)onCancel();
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const next=validateFamilyContact(values);
  setErrors(next);
  const first=(Object.keys(next) as EditableKey[])[0];
  if(first){document.getElementById('family-edit-'+first)?.focus();return;}
  if(!changed||busy)return;
  onSubmit({name:values.name.trim(),relationship:values.relationship.trim(),phone:values.phone.trim(),
   email:values.email.trim()||null,emergency:values.emergency,pickup_authorized:values.pickup_authorized});
 }
 function field(key:EditableKey,placeholder:string,icon:typeof UserRound,help?:string){
  const Icon=icon,invalid=!!fieldError(key);
  return <div className="sc-family-edit-field" key={key}>
   <label htmlFor={'family-edit-'+key}>{ui(labels[key])}{key!=='email'&&<span className="required" aria-hidden="true"> *</span>}{key==='email'&&<span className="sc-family-edit-optional"> {ui('Opcional')}</span>}</label>
   <div className={'sc-family-edit-input-wrap'+(invalid?' is-invalid':'')}>
    <Icon size={18} aria-hidden="true"/>
    <input id={'family-edit-'+key} type={key==='email'?'email':key==='phone'?'tel':'text'}
     autoComplete={key==='name'?'name':key==='email'?'email':key==='phone'?'tel':'off'}
     inputMode={key==='phone'?'tel':undefined} value={values[key]} disabled={busy} placeholder={ui(placeholder)}
     aria-invalid={invalid} aria-describedby={invalid?'family-edit-'+key+'-error':help?'family-edit-'+key+'-help':undefined}
     onChange={event=>update(key,event.target.value)}/>
   </div>
   {invalid?<p className="sc-field-error" role="alert" id={'family-edit-'+key+'-error'}>{ui(fieldError(key))}</p>:
    help&&<small id={'family-edit-'+key+'-help'}>{ui(help)}</small>}
  </div>;
 }
 return <>
  <header className="sc-family-edit-header">
   <div className="sc-family-edit-heading">
    <span className="sc-family-edit-eyebrow"><ContactRound size={15}/> {ui('CONTACTOS FAMILIARES / EDICIÓN')}</span>
    <h2 id="dialog-title">{ui('Editar contacto')}</h2>
    <p>{ui('Actualiza sus datos y revisa quién puede atender emergencias o recoger al alumno.')}</p>
   </div>
   <button type="button" className="sc-family-edit-close" disabled={busy} aria-label={ui('Cerrar formulario')} onClick={()=>void cancel()}><X size={20}/></button>
  </header>
  <div className="sc-family-edit-profile">
   <span className="sc-family-edit-avatar" aria-hidden="true">{initials||'?'}</span>
   <div className="sc-family-edit-profile-name"><strong>{displayName}</strong><span>{String(initial.relationship||'Familiar registrado')}</span></div>
   <div className="sc-family-edit-student"><UserRound size={16} aria-hidden="true"/><div><span>{ui('Alumno vinculado')}</span><strong>{studentName}</strong></div></div>
  </div>
  <form className="sc-family-edit-form" noValidate onSubmit={submit}>
   <div className="sc-family-edit-body">
    <section className="sc-family-edit-section" aria-labelledby="family-edit-identity-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><UsersRound size={19}/></span><div><h3 id="family-edit-identity-title">{ui('Información del familiar')}</h3><p>{ui('Identifica correctamente a la persona registrada en el expediente.')}</p></div></div>
     <div className="sc-family-edit-fields">
      {field('name','Nombre y apellidos',UserRound)}
      {field('relationship','Ej. Madre, padre, abuelo o tutor',UsersRound)}
     </div>
    </section>
    <section className="sc-family-edit-section" aria-labelledby="family-edit-contact-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><Phone size={19}/></span><div><h3 id="family-edit-contact-title">{ui('Medios de contacto')}</h3><p>{ui('Mantén estos datos vigentes para una comunicación oportuna.')}</p></div></div>
     <div className="sc-family-edit-fields">
      {field('phone','Ej. 55 1234 5678',Phone,'Puedes incluir código internacional, espacios o guiones.')}
      {field('email','correo@ejemplo.com',Mail)}
     </div>
    </section>
    <section className="sc-family-edit-section" aria-labelledby="family-edit-permissions-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><ShieldCheck size={19}/></span><div><h3 id="family-edit-permissions-title">{ui('Permisos y autorizaciones')}</h3><p>{ui('Estas opciones afectan la atención de emergencias y la recogida del alumno.')}</p></div></div>
     <div className="sc-family-edit-permissions">
      <label className="sc-family-edit-permission">
       <span className="sc-family-edit-permission-icon is-emergency"><AlertCircle size={20}/></span>
       <span className="sc-family-edit-permission-copy"><strong>{ui('Contacto de emergencia')}</strong><small>{ui('La escuela podrá acudir a esta persona ante una emergencia.')}</small></span>
       <span className="sc-family-edit-toggle"><input type="checkbox" role="switch" aria-label={ui('Contacto de emergencia')} checked={values.emergency} disabled={busy} onChange={event=>update('emergency',event.target.checked)}/><span aria-hidden="true"/></span>
      </label>
      <label className="sc-family-edit-permission">
       <span className="sc-family-edit-permission-icon is-pickup"><ShieldCheck size={20}/></span>
       <span className="sc-family-edit-permission-copy"><strong>{ui('Autorizado para recoger')}</strong><small>{ui('Esta persona tiene autorización registrada para recoger al alumno.')}</small></span>
       <span className="sc-family-edit-toggle"><input type="checkbox" role="switch" aria-label={ui('Autorizado para recoger')} checked={values.pickup_authorized} disabled={busy} onChange={event=>update('pickup_authorized',event.target.checked)}/><span aria-hidden="true"/></span>
      </label>
     </div>
    </section>
    {error&&<div className="sc-family-edit-server-error" role="alert"><AlertCircle size={18}/><p>{error}</p></div>}
   </div>
   <footer className="sc-family-edit-footer">
    <p role="status">{busy?ui('Guardando los cambios…'):changed?ui('Tienes cambios pendientes por guardar.'):ui('No hay cambios pendientes.')}</p>
    <div className="sc-family-edit-actions">
     <button type="button" className="secondary" disabled={busy} onClick={()=>void cancel()}>{ui('Cancelar')}</button>
     <button type="submit" className="primary" disabled={busy||!changed}>{busy?<LoaderCircle className="sc-family-edit-spinner" size={17}/>:<Save size={17}/>} {busy?ui('Guardando…'):ui('Guardar cambios')}</button>
    </div>
   </footer>
  </form>
 </>;
}
