import {useState,type FormEvent} from 'react';
import Swal from 'sweetalert2';
import {AlertCircle,Building2,Check,Globe2,House,Info,MapPin,MapPinned,Navigation,Save,ShieldCheck} from 'lucide-react';
import type {Row} from '../../modules';
import Combobox from '../../shared/components/Combobox';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

const COUNTRY_OPTIONS=[
 {value:'MX',label:'México'}, {value:'US',label:'Estados Unidos'},
 {value:'CA',label:'Canadá'}, {value:'GT',label:'Guatemala'},
 {value:'BZ',label:'Belice'}, {value:'SV',label:'El Salvador'},
 {value:'HN',label:'Honduras'}, {value:'NI',label:'Nicaragua'},
 {value:'CR',label:'Costa Rica'}, {value:'PA',label:'Panamá'},
 {value:'CO',label:'Colombia'}, {value:'VE',label:'Venezuela'},
 {value:'EC',label:'Ecuador'}, {value:'PE',label:'Perú'},
 {value:'BO',label:'Bolivia'}, {value:'CL',label:'Chile'},
 {value:'AR',label:'Argentina'}, {value:'UY',label:'Uruguay'},
 {value:'BR',label:'Brasil'}, {value:'CU',label:'Cuba'},
 {value:'ES',label:'España'}, {value:'FR',label:'Francia'},
 {value:'DE',label:'Alemania'}, {value:'GB',label:'Reino Unido'}
];
const PURPOSE_OPTIONS=[
 {value:'home',label:'Domicilio particular'},
 {value:'fiscal',label:'Domicilio fiscal'},
 {value:'other',label:'Otro domicilio'}
];
type StringKey='country_code'|'purpose'|'line1'|'line2'|'neighborhood'|'locality'|'region'|'postal_code';
type AddressValues=Record<StringKey,string>&{primary:boolean};
const LABELS:Record<StringKey,string>={
 country_code:'País',purpose:'Tipo de domicilio',line1:'Calle y número',
 line2:'Interior o referencia',neighborhood:'Colonia o barrio',locality:'Municipio o alcaldía',
 region:'Estado o región',postal_code:'Código postal'
};
const bool=(value:unknown)=>value===true||value===1||value==='true'||value==='1';
export function studentAddressValues(initial:Row):AddressValues{
 return {
  country_code:String(initial.country_code||'MX').toUpperCase(),purpose:String(initial.purpose||'home'),
  line1:String(initial.line1||''),line2:String(initial.line2||''),neighborhood:String(initial.neighborhood||''),
  locality:String(initial.locality||''),region:String(initial.region||''),postal_code:String(initial.postal_code||''),
  primary:bool(initial.primary)
 };
}
export function validateStudentAddress(values:AddressValues):Partial<Record<StringKey,string>>{
 const issues:Partial<Record<StringKey,string>>={};
 if(!/^[A-Z]{2}$/.test(values.country_code))issues.country_code='País selecciona un código de país válido.';
 if(!PURPOSE_OPTIONS.some(option=>option.value===values.purpose))
  issues.purpose='Tipo de domicilio selecciona una opción válida.';
 if(!values.line1.trim())issues.line1='Calle y número es obligatorio.';
 for(const key of ['line1','line2','neighborhood','locality','region'] as const){
  if(values[key].trim().length>255)issues[key]=LABELS[key]+' no puede superar los 255 caracteres.';
 }
 const postal=values.postal_code.trim();
 if(postal&&values.country_code==='MX'&&!/^\d{5}$/.test(postal))
  issues.postal_code='Código postal debe contener 5 dígitos para México.';
 else if(postal&&(postal.length>15||!/^[\p{L}\p{N} -]+$/u.test(postal)))
  issues.postal_code='Código postal introduce un formato válido de hasta 15 caracteres.';
 return issues;
}
export function studentAddressPayload(values:AddressValues):Row{
 return {
  country_code:values.country_code.toUpperCase(),purpose:values.purpose,
  line1:values.line1.trim(),line2:values.line2.trim()||null,
  neighborhood:values.neighborhood.trim()||null,locality:values.locality.trim()||null,
  region:values.region.trim()||null,postal_code:values.postal_code.trim()||null,
  primary:values.primary
 };
}
export default function StudentAddressForm({initial,studentName,busy,error,fieldErrors={},onSubmit,onCancel}:{
 initial:Row;studentName:string;busy:boolean;error:string;fieldErrors?:Record<string,string[]>;
 onSubmit:(values:Row)=>void;onCancel:()=>void;
}){
 const {ui}=useSchoolLocale();
 const [values,setValues]=useState<AddressValues>(()=>studentAddressValues(initial));
 const [validation,setValidation]=useState<Partial<Record<StringKey,string>>>({});
 const [touched,setTouched]=useState<Partial<Record<StringKey,boolean>>>({});
 const original=studentAddressValues(initial);
 const dirty=(Object.keys(original) as (keyof AddressValues)[]).some(key=>{
  const a=original[key],b=values[key];
  return typeof a==='string'&&typeof b==='string'?a.trim()!==b.trim():a!==b;
 });
 const countryOptions=COUNTRY_OPTIONS.some(item=>item.value===values.country_code)?COUNTRY_OPTIONS:
  [...COUNTRY_OPTIONS,{value:values.country_code,label:values.country_code}];
 const update=(key:StringKey,value:string)=>{
  setValues(current=>({...current,[key]:value}));
  setTouched(current=>({...current,[key]:true}));
  setValidation(current=>({...current,[key]:undefined}));
 };
 const issue=(key:StringKey)=>validation[key]||
  (!touched[key]&&fieldErrors[key]?.length?LABELS[key]+' '+fieldErrors[key][0]:undefined);
 function field(key:StringKey,placeholder:string,Icon:typeof MapPin,optional=true,help?:string){
  const message=issue(key);
  return <div className={'sc-student-address-field'+(message?' has-error':'')} key={key}>
   <label htmlFor={'student-address-'+key}>{ui(LABELS[key])}
    {optional?<span className="sc-student-address-optional">{ui('Opcional')}</span>:
     <span className="required" aria-hidden="true"> *</span>}</label>
   <div className="sc-student-address-input"><Icon size={17} aria-hidden="true"/>
    <input id={'student-address-'+key} value={values[key]} disabled={busy}
     autoComplete={key==='line1'?'street-address':key==='postal_code'?'postal-code':
      key==='locality'?'address-level2':key==='region'?'address-level1':'off'}
     inputMode={key==='postal_code'&&values.country_code==='MX'?'numeric':undefined}
     maxLength={255} placeholder={ui(placeholder)} aria-invalid={Boolean(message)}
     aria-describedby={message?'student-address-'+key+'-error':help?'student-address-'+key+'-help':undefined}
     onChange={event=>update(key,event.target.value)}/></div>
   {message?<p className="sc-student-address-error" id={'student-address-'+key+'-error'} role="alert">{ui(message)}</p>:
    help?<small className="sc-student-address-help" id={'student-address-'+key+'-help'}>{ui(help)}</small>:null}
  </div>;
 }
 async function cancel(){
  if(busy)return;
  if(!dirty){onCancel();return;}
  const response=await Swal.fire({
   title:'¿Descartar los cambios?',
   text:'Los cambios de esta dirección todavía no se han guardado.',
   icon:'warning',showCancelButton:true,confirmButtonText:'Descartar cambios',
   cancelButtonText:'Seguir editando',reverseButtons:true,focusCancel:true,buttonsStyling:false,
   customClass:{popup:'school-dialog',title:'school-dialog-title',
    confirmButton:'school-dialog-confirm',cancelButton:'school-dialog-cancel'}
  });
  if(response.isConfirmed)onCancel();
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  const errors=validateStudentAddress(values);
  setValidation(errors);
  const first=(Object.keys(errors) as StringKey[])[0];
  if(first){document.getElementById('student-address-'+first)?.focus();return;}
  onSubmit(studentAddressPayload(values));
 }
 const previewParts=[values.line1,values.line2,values.neighborhood,values.locality,
  values.region,values.postal_code].map(part=>part.trim()).filter(Boolean);
 return <form noValidate className="sc-student-address-form" onSubmit={submit}>
  <div className="sc-student-address-intro"><div className="sc-student-address-intro-icon"><MapPinned size={24}/></div>
   <div><h4>{ui('Ubicación del alumno')}</h4><p>{ui('Mantén actualizado el domicilio de ')+studentName+ui(' para el expediente y la comunicación escolar.')}</p></div>
   <span className="sc-student-address-intro-tag">{ui(initial.id?'Actualización':'Nuevo registro')}</span></div>
  <div className="sc-student-address-layout"><div className="sc-student-address-fields">
   <section className="sc-student-address-panel" aria-labelledby="student-address-type-heading">
    <header><span className="sc-student-address-section-icon"><Globe2 size={20}/></span>
     <div><h4 id="student-address-type-heading">{ui('Identificación del domicilio')}</h4>
      <p>{ui('Selecciona el país y el uso de esta dirección dentro del expediente.')}</p></div></header>
    <div className="sc-student-address-grid">
     <div className="sc-student-address-field"><label htmlFor="student-address-country_code">{ui('País')} <span className="required">*</span></label>
      <Combobox id="student-address-country_code" label={ui('País')} value={values.country_code}
       options={countryOptions} searchable disabled={busy} invalid={Boolean(issue('country_code'))}
       describedBy={issue('country_code')?'student-address-country_code-error':undefined}
       onChange={value=>update('country_code',value)}/>
      {issue('country_code')&&<p id="student-address-country_code-error" className="sc-student-address-error" role="alert">{ui(issue('country_code')!)}</p>}</div>
     <div className="sc-student-address-field"><label htmlFor="student-address-purpose">{ui('Tipo de domicilio')} <span className="required">*</span></label>
      <Combobox id="student-address-purpose" label={ui('Tipo de domicilio')} value={values.purpose}
       options={PURPOSE_OPTIONS.map(option=>({...option,label:ui(option.label)}))}
       searchable={false} disabled={busy} invalid={Boolean(issue('purpose'))}
       describedBy={issue('purpose')?'student-address-purpose-error':undefined}
       onChange={value=>update('purpose',value)}/>
      {issue('purpose')&&<p id="student-address-purpose-error" className="sc-student-address-error" role="alert">{ui(issue('purpose')!)}</p>}</div>
    </div>
   </section>
   <section className="sc-student-address-panel" aria-labelledby="student-address-location-heading">
    <header><span className="sc-student-address-section-icon"><House size={20}/></span>
     <div><h4 id="student-address-location-heading">{ui('Dirección y referencias')}</h4>
      <p>{ui('Registra los datos tal como se utilizan para localizar el domicilio.')}</p></div></header>
    <div className="sc-student-address-grid">
     <div className="is-wide">{field('line1','Ej. Avenida Hidalgo 125, exterior 3',MapPin,false)}</div>
     <div className="is-wide">{field('line2','Ej. Interior B, edificio 2 o referencia de acceso',Navigation,true)}</div>
     {field('neighborhood','Ej. Centro',Building2,true)}
     {field('locality','Ej. Cuautitlán Izcalli',MapPinned,true)}
     {field('region','Ej. Estado de México',MapPin,true)}
     {field('postal_code','Ej. 54700',Navigation,true,
      'Para México utiliza los cinco dígitos del código postal.')}
    </div>
   </section>
   <section className="sc-student-address-panel sc-student-address-preference" aria-labelledby="student-address-preference-heading">
    <header><span className="sc-student-address-section-icon"><ShieldCheck size={20}/></span>
     <div><h4 id="student-address-preference-heading">{ui('Preferencia del expediente')}</h4>
      <p>{ui('Define si esta dirección debe mostrarse como la principal.')}</p></div></header>
    <label className="sc-student-address-primary">
     <span className="sc-student-address-primary-icon"><House size={19}/></span>
     <span className="sc-student-address-primary-copy"><strong>{ui('Domicilio principal')}</strong>
      <small>{ui('Al activarlo, este domicilio reemplazará al principal del mismo tipo.')}</small></span>
     <span className="sc-student-address-switch"><input type="checkbox" role="switch"
      aria-label={ui('Domicilio principal')} checked={values.primary} disabled={busy}
      onChange={event=>setValues(current=>({...current,primary:event.target.checked}))}/>
      <span aria-hidden="true"/></span></label>
   </section>
  </div>
  <aside className="sc-student-address-preview" aria-label={ui('Vista previa de la dirección')}>
   <div className="sc-student-address-preview-top"><span><MapPinned size={18}/></span>
    <span className="sc-student-address-preview-kicker">{ui('VISTA PREVIA')}</span></div>
   <h4>{ui('Así se verá en el expediente')}</h4>
   <div className="sc-student-address-preview-map" aria-hidden="true">
    <div className="sc-student-address-preview-road road-one"/><div className="sc-student-address-preview-road road-two"/>
    <span><MapPin size={28}/></span></div>
   <div className="sc-student-address-preview-copy"><strong>{previewParts[0]||ui('Calle y número pendientes')}</strong>
    <p>{previewParts.length>1?previewParts.slice(1).join(' · '):ui('Completa las referencias para identificar mejor el domicilio.')}</p></div>
   <div className="sc-student-address-preview-meta"><span><Globe2 size={15}/>{countryOptions.find(c=>c.value===values.country_code)?.label||'—'}</span>
    <span><House size={15}/>{ui(PURPOSE_OPTIONS.find(p=>p.value===values.purpose)?.label||'Sin clasificar')}</span>
    {values.primary&&<span className="is-primary"><Check size={14}/>{ui('Principal')}</span>}</div>
   <div className="sc-student-address-preview-note"><Info size={16}/><p>{ui('Esta vista es orientativa; no verifica ni geolocaliza la dirección.')}</p></div>
  </aside></div>
  {error&&<div className="sc-student-address-general-error" role="alert"><AlertCircle size={18}/><p>{error}</p></div>}
  <footer className="sc-student-address-actions"><span><Info size={16}/>{ui('Los campos marcados con * son obligatorios.')}</span>
   <div><button type="button" className="secondary" disabled={busy} onClick={()=>void cancel()}>{ui('Cancelar')}</button>
    <button type="submit" className="primary" disabled={busy}><Save size={17}/>{busy?ui('Guardando…'):ui(initial.id?'Guardar cambios':'Registrar dirección')}</button></div>
  </footer>
 </form>;
}
