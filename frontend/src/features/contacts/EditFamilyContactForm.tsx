import {useEffect,useState,type FormEvent} from 'react';
import Swal from 'sweetalert2';
import {AlertCircle,ContactRound,IdCard,LoaderCircle,Mail,Phone,Save,ShieldCheck,UserRound,UsersRound,X} from 'lucide-react';
import type {Row} from '../../modules';
import Combobox from '../../shared/components/Combobox';
import {relationshipChoices} from '../../shared/relationships';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {parseFamilyCurp} from './familyCurp';

type EditableKey='first_name'|'middle_name'|'paternal_surname'|'maternal_surname'|'curp'|'relationship'|'phone'|'email'|'student_id';
type IdentityKey='first_name'|'middle_name'|'paternal_surname'|'maternal_surname'|'curp'|'relationship'|'phone'|'email';
type ContactValues={
 first_name:string;middle_name:string;paternal_surname:string;maternal_surname:string;curp:string;
 relationship:string;phone:string;email:string;student_id:string;emergency:boolean;pickup_authorized:boolean;
};
type Props={initial:Row;students?:Row[];studentName?:string;busy:boolean;error:string;fieldErrors?:Record<string,string[]>;onCancel:()=>void;onSubmit:(values:Row)=>void};
const enabled=(value:unknown)=>value===true||value===1||value==='true'||value==='1';
const labels:Record<EditableKey,string>={first_name:'Primer nombre',middle_name:'Segundo nombre',paternal_surname:'Apellido paterno',
 maternal_surname:'Apellido materno',curp:'CURP',relationship:'Parentesco',phone:'Teléfono',email:'Correo electrónico',student_id:'Alumno'};
const EMPTY_ERRORS:Record<string,string[]>={};

export function familyContactValues(initial:Row):ContactValues{
 return {first_name:String(initial.first_name??''),middle_name:String(initial.middle_name??''),
  paternal_surname:String(initial.paternal_surname??''),maternal_surname:String(initial.maternal_surname??''),
  curp:String(initial.curp??''),relationship:String(initial.relationship??''),phone:String(initial.phone??''),
  email:String(initial.email??''),student_id:String(initial.student_id??''),
  emergency:enabled(initial.emergency),pickup_authorized:enabled(initial.pickup_authorized)};
}
export function familyContactFullName(values:Pick<ContactValues,'first_name'|'middle_name'|'paternal_surname'|'maternal_surname'>):string{
 return [values.first_name,values.middle_name,values.paternal_surname,values.maternal_surname]
  .map(part=>part.trim().replace(/\s+/g,' ')).filter(Boolean).join(' ');
}
export function validateFamilyContact(values:ContactValues,creating=false):Partial<Record<EditableKey,string>>{
 const errors:Partial<Record<EditableKey,string>>={};
 if(creating&&!values.student_id)errors.student_id='Alumno selecciona un alumno.';
 for(const key of ['first_name','middle_name','paternal_surname','maternal_surname','relationship'] as const){
  if((key==='first_name'||key==='paternal_surname'||key==='relationship')&&!values[key].trim())
   errors[key]=labels[key]+' no puede estar vacío.';
  else if(values[key].trim().length>80&&key!=='relationship')
   errors[key]=labels[key]+' no puede superar los 80 caracteres.';
  else if(key==='relationship'&&values[key].trim().length>150)
   errors[key]=labels[key]+' no puede superar los 150 caracteres.';
 }
 if(!values.curp.trim())errors.curp='CURP es obligatoria.';
 else if(!parseFamilyCurp(values.curp))errors.curp='CURP ingresa una clave de 18 caracteres con fecha y dígito verificador válidos.';
 if(!values.phone.trim())errors.phone='Teléfono no puede estar vacío.';
 else if(!/^\+?[0-9 ()-]{7,30}$/.test(values.phone.trim())||values.phone.replace(/\D/g,'').length<7)
  errors.phone='Teléfono ingresa un número válido de al menos 7 dígitos (máximo 30 caracteres).';
 if(values.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
  errors.email='Correo electrónico ingresa una dirección válida.';
 return errors;
}

export default function EditFamilyContactForm({initial,students=[],studentName='',busy,error,fieldErrors=EMPTY_ERRORS,onCancel,onSubmit}:Props){
 const {ui}=useSchoolLocale();
 const creating=!initial.id;
 const [values,setValues]=useState<ContactValues>(()=>familyContactValues(initial));
 const [errors,setErrors]=useState<Partial<Record<EditableKey,string>>>({});
 const [dismissed,setDismissed]=useState<Partial<Record<EditableKey,boolean>>>({});
 useEffect(()=>setDismissed({}),[fieldErrors]);
 const original=familyContactValues(initial);
 const changed=(Object.keys(original) as (keyof ContactValues)[]).some(key=>{
  const a=original[key],b=values[key];
  return typeof a==='string'&&typeof b==='string'?a.trim()!==b.trim():a!==b;
 });
 const legacy=Boolean(initial.id&&!initial.curp);
 const calculatedName=familyContactFullName(values);
 const displayName=calculatedName||String(initial.name||'Nuevo contacto familiar').trim();
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
   title:'¿Descartar los cambios?',text:'Los datos capturados todavía no se han guardado.',
   icon:'warning',showCancelButton:true,confirmButtonText:'Descartar cambios',
   cancelButtonText:'Continuar editando',reverseButtons:true,focusCancel:true,
   buttonsStyling:false,customClass:{popup:'school-dialog',title:'school-dialog-title',
    confirmButton:'school-dialog-confirm',cancelButton:'school-dialog-cancel'}
  });
  if(result.isConfirmed)onCancel();
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const next=validateFamilyContact(values,creating);
  setErrors(next);
  const first=(Object.keys(next) as EditableKey[])[0];
  if(first){document.getElementById('family-edit-'+first)?.focus();return;}
  if(busy||!changed)return;
  onSubmit({...(creating?{student_id:values.student_id}:{}),first_name:values.first_name.trim(),
   middle_name:values.middle_name.trim()||null,paternal_surname:values.paternal_surname.trim(),
   maternal_surname:values.maternal_surname.trim()||null,curp:values.curp.trim().toUpperCase(),
   relationship:values.relationship.trim(),phone:values.phone.trim(),email:values.email.trim()||null,
   emergency:values.emergency,pickup_authorized:values.pickup_authorized});
 }
 function field(key:IdentityKey,placeholder:string,icon:typeof UserRound,help?:string){
  const Icon=icon,invalid=!!fieldError(key);
  const optional=['middle_name','maternal_surname','email'].includes(key);
  return <div className={'sc-family-edit-field'+(key==='curp'?' sc-family-edit-curp-field':'')} key={key}>
   <label htmlFor={'family-edit-'+key}>{ui(labels[key])}{!optional&&<span className="required" aria-hidden="true"> *</span>}{optional&&<span className="sc-family-edit-optional"> {ui('Opcional')}</span>}</label>
   <div className={'sc-family-edit-input-wrap'+(invalid?' is-invalid':'')}>
    <Icon size={18} aria-hidden="true"/>
    <input id={'family-edit-'+key} type={key==='email'?'email':key==='phone'?'tel':'text'}
     autoComplete={key==='first_name'?'given-name':key==='paternal_surname'?'family-name':key==='email'?'email':key==='phone'?'tel':'off'}
     inputMode={key==='phone'?'tel':undefined} maxLength={key==='curp'?18:undefined}
     value={values[key]} disabled={busy} placeholder={ui(placeholder)}
     aria-invalid={invalid} aria-describedby={invalid?'family-edit-'+key+'-error':help?'family-edit-'+key+'-help':undefined}
     onChange={event=>update(key,key==='curp'?event.target.value.toUpperCase():event.target.value)}/>
   </div>
   {invalid?<p className="sc-field-error" role="alert" id={'family-edit-'+key+'-error'}>{ui(fieldError(key))}</p>:
    help&&<small id={'family-edit-'+key+'-help'}>{ui(help)}</small>}
  </div>;
 }
 const chosenStudent=studentName||String(students.find(s=>String(s.id)===values.student_id)?.full_name||'Alumno sin identificar');
 return <>
  <header className="sc-family-edit-header">
   <div className="sc-family-edit-heading">
    <span className="sc-family-edit-eyebrow"><ContactRound size={15}/> {ui('CONTACTOS FAMILIARES / IDENTIDAD')}</span>
    <h2 id="dialog-title">{ui(creating?'Registrar contacto':'Editar contacto')}</h2>
    <p>{ui('Registra sus nombres y apellidos por separado, verifica la CURP y administra sus autorizaciones.')}</p>
   </div>
   <button type="button" className="sc-family-edit-close" disabled={busy} aria-label={ui('Cerrar formulario')} onClick={()=>void cancel()}><X size={20}/></button>
  </header>
  <div className="sc-family-edit-profile">
   <span className="sc-family-edit-avatar" aria-hidden="true">{initials||'?'}</span>
   <div className="sc-family-edit-profile-name"><strong>{displayName}</strong><span>{String(initial.relationship||'Contacto familiar')}</span></div>
   {creating?<div className="sc-family-edit-student-select"><label htmlFor="family-edit-student_id">{ui('Alumno')} <span className="required">*</span></label>
    <Combobox id="family-edit-student_id" label={ui('Alumno')} value={values.student_id} onChange={v=>update('student_id',v)}
     options={students.map(s=>({value:String(s.id),label:String(s.full_name||s.name||s.id)}))} searchable={students.length>7} invalid={!!fieldError('student_id')}/>
    {fieldError('student_id')&&<p className="sc-field-error" role="alert">{ui(fieldError('student_id'))}</p>}
   </div>:<div className="sc-family-edit-student"><UserRound size={16} aria-hidden="true"/><div><span>{ui('Alumno vinculado')}</span><strong>{chosenStudent}</strong></div></div>}
  </div>
  <form className="sc-family-edit-form" noValidate onSubmit={submit}>
   <div className="sc-family-edit-body">
    {legacy&&<div className="sc-family-edit-legacy" role="status"><AlertCircle size={18}/><span>{ui('Este registro es anterior a los campos separados. Conservamos el nombre original; completa la identidad y CURP antes de guardar.')}</span></div>}
    <section className="sc-family-edit-section" aria-labelledby="family-edit-identity-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><UsersRound size={19}/></span><div><h3 id="family-edit-identity-title">{ui('Identidad del familiar')}</h3><p>{ui('Captura los nombres y apellidos como aparecen en sus documentos.')}</p></div></div>
     <div className="sc-family-edit-fields">
      {field('first_name','Ej. María',UserRound)}
      {field('middle_name','Ej. Fernanda',UserRound)}
      {field('paternal_surname','Ej. Hernández',UserRound)}
      {field('maternal_surname','Ej. López',UserRound)}
      {field('curp','18 caracteres',IdCard,'La fecha de nacimiento y el sexo registrado se obtienen internamente de la CURP. No confirma su validez ante RENAPO.')}
     </div>
     <div className="sc-family-edit-name-preview" aria-live="polite">
      <span>{ui('Nombre completo generado')}</span>
      <strong>{calculatedName||ui('Completa los nombres y apellidos')}</strong>
      <small>{ui('Se construye automáticamente, omitiendo los campos opcionales vacíos.')}</small>
     </div>
    </section>
    <section className="sc-family-edit-section" aria-labelledby="family-edit-contact-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><Phone size={19}/></span><div><h3 id="family-edit-contact-title">{ui('Parentesco y medios de contacto')}</h3><p>{ui('Mantén estos datos vigentes para una comunicación oportuna.')}</p></div></div>
     <div className="sc-family-edit-fields">
      <div className="sc-family-edit-field">
       <label htmlFor="family-edit-relationship">{ui('Parentesco')} <span className="required" aria-hidden="true">*</span></label>
       <Combobox id="family-edit-relationship" label={ui('Parentesco')} value={values.relationship} onChange={value=>update('relationship',value)}
        options={relationshipChoices(values.relationship)} searchable placeholder={ui('Selecciona un parentesco')}
        disabled={busy} invalid={!!fieldError('relationship')}
        describedBy={fieldError('relationship')?'family-edit-relationship-error':undefined}/>
       {fieldError('relationship')&&<p id="family-edit-relationship-error" className="sc-field-error" role="alert">{ui(fieldError('relationship'))}</p>}
      </div>
      {field('phone','Ej. 55 1234 5678',Phone)}
      {field('email','correo@ejemplo.com',Mail)}
     </div>
    </section>
    <section className="sc-family-edit-section" aria-labelledby="family-edit-permissions-title">
     <div className="sc-family-edit-section-heading"><span className="sc-family-edit-section-icon"><ShieldCheck size={19}/></span><div><h3 id="family-edit-permissions-title">{ui('Permisos y autorizaciones')}</h3><p>{ui('Estas opciones afectan la atención de emergencias y la recogida del alumno.')}</p></div></div>
     <div className="sc-family-edit-permissions">
      <label className="sc-family-edit-permission"><span className="sc-family-edit-permission-icon is-emergency"><AlertCircle size={20}/></span>
       <span className="sc-family-edit-permission-copy"><strong>{ui('Contacto de emergencia')}</strong><small>{ui('La escuela podrá acudir a esta persona ante una emergencia.')}</small></span>
       <span className="sc-family-edit-toggle"><input type="checkbox" role="switch" aria-label={ui('Contacto de emergencia')} checked={values.emergency} disabled={busy} onChange={event=>update('emergency',event.target.checked)}/><span aria-hidden="true"/></span>
      </label>
      <label className="sc-family-edit-permission"><span className="sc-family-edit-permission-icon is-pickup"><ShieldCheck size={20}/></span>
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
     <button type="submit" className="primary" disabled={busy||!changed}>{busy?<LoaderCircle className="sc-family-edit-spinner" size={17}/>:<Save size={17}/>} {busy?ui('Guardando…'):ui(creating?'Registrar contacto':'Guardar cambios')}</button>
    </div>
   </footer>
  </form>
 </>;
}
