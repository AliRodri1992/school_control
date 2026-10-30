import {useEffect,useState,type FormEvent} from 'react';
import {Globe2,Phone,ShieldCheck} from 'lucide-react';
import Combobox from '../../shared/components/Combobox';
import type {Row} from '../../modules';

export const PHONE_COUNTRIES=[
 {value:'MX',label:'🇲🇽 México (+52)',dial:'+52'},
 {value:'US',label:'🇺🇸 Estados Unidos (+1)',dial:'+1'},
 {value:'CA',label:'🇨🇦 Canadá (+1)',dial:'+1'},
 {value:'ES',label:'🇪🇸 España (+34)',dial:'+34'},
 {value:'CO',label:'🇨🇴 Colombia (+57)',dial:'+57'},
 {value:'AR',label:'🇦🇷 Argentina (+54)',dial:'+54'},
 {value:'GT',label:'🇬🇹 Guatemala (+502)',dial:'+502'},
 {value:'PE',label:'🇵🇪 Perú (+51)',dial:'+51'}
] as const;
const knownPrefix=(number:string)=>[...PHONE_COUNTRIES].sort((a,b)=>b.dial.length-a.dial.length).find(country=>number.startsWith(country.dial));
export function formatInternationalPhone(country:string,local:string):string{
 const digits=local.replace(/\D/g,'');
 const prefix=PHONE_COUNTRIES.find(item=>item.value===country)?.dial||'';
 return prefix+digits;
}
export default function StudentPhoneForm({initial,onSubmit,onCancel,busy,error,fieldErrors={}}:{
 initial:Row;onSubmit:(values:Row)=>void;onCancel:()=>void;busy:boolean;error:string;fieldErrors?:Record<string,string[]>;
}){
 const original=String(initial.number_e164||'');
 const inferred=PHONE_COUNTRIES.find(x=>x.value===initial.country_code)||knownPrefix(original)||PHONE_COUNTRIES[0];
 const [country,setCountry]=useState<string>(inferred.value);
 const [local,setLocal]=useState(original.startsWith(inferred.dial)?original.slice(inferred.dial.length):original.replace(/^\+/,''));
 const [purpose,setPurpose]=useState(String(initial.purpose||'mobile'));
 const [extension,setExtension]=useState(String(initial.extension||''));
 const [primary,setPrimary]=useState(String(initial.primary??false)==='true');
 const [validation,setValidation]=useState('');
 useEffect(()=>{if(fieldErrors.number_e164?.length)setValidation('Teléfono '+fieldErrors.number_e164[0]);},[fieldErrors.number_e164]);
 const dial=PHONE_COUNTRIES.find(x=>x.value===country)?.dial||'+52';
 function submit(event:FormEvent){
  event.preventDefault();
  const normalized=formatInternationalPhone(country,local);
  if(!/^\+[1-9]\d{6,14}$/.test(normalized)){setValidation('Teléfono introduce un número internacional válido, entre 7 y 15 dígitos incluyendo el prefijo.');return;}
  setValidation('');
  onSubmit({number_e164:normalized,country_code:country,purpose,extension:extension.trim()||null,primary});
 }
 return <form noValidate onSubmit={submit} className="sc-dossier-form">
  <div className="sc-dossier-form-section"><span><Globe2 size={18}/></span><div><h3>Información de contacto</h3><p>Selecciona el país y escribe el número local. El código internacional se añadirá automáticamente.</p></div></div>
  <div className="sc-dossier-phone-grid">
   <div className="sc-record-field"><label>País y código telefónico</label>
    <Combobox label="País y código telefónico" searchable options={PHONE_COUNTRIES.map(({value,label})=>({value,label}))} value={country} onChange={setCountry}/>
   </div>
   <div className="sc-record-field"><label htmlFor="student-local-phone">Número telefónico <span className="required">*</span></label>
    <div className={'sc-dossier-phone-number'+(validation?' is-invalid':'')}><span aria-hidden="true">{dial}</span>
     <input id="student-local-phone" inputMode="tel" type="tel" autoComplete="tel-national" value={local}
      aria-invalid={!!validation} aria-describedby={validation?'student-phone-error':'student-phone-help'}
      placeholder="Número sin código de país" onChange={e=>{setLocal(e.target.value);setValidation('');}}/></div>
    {validation?<p className="sc-field-error" id="student-phone-error" role="alert">{validation}</p>:
     <small id="student-phone-help">Se guardará como {formatInternationalPhone(country,local)||dial}</small>}
   </div>
  </div>
  <div className="sc-dossier-phone-grid"><div className="sc-record-field"><label>Tipo de teléfono</label><Combobox searchable={false} label="Tipo de teléfono" value={purpose} onChange={setPurpose}
   options={[{value:'mobile',label:'Celular'},{value:'home',label:'Domicilio'},{value:'work',label:'Trabajo'},{value:'emergency',label:'Emergencia'}]}/></div>
   <div className="sc-record-field"><label htmlFor="student-phone-extension">Extensión (opcional)</label><input id="student-phone-extension" value={extension} onChange={e=>setExtension(e.target.value)} placeholder="Ej. 102"/></div></div>
  <label className="sc-dossier-check"><input type="checkbox" checked={primary} onChange={e=>setPrimary(e.target.checked)}/><ShieldCheck size={19}/><span><strong>Teléfono principal</strong><small>Se utilizará como número principal de este tipo en el expediente.</small></span></label>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancelar</button><button type="submit" className="primary" disabled={busy}><Phone size={16}/>{busy?'Guardando…':initial.id?'Guardar cambios':'Registrar teléfono'}</button></div>
 </form>;
}
