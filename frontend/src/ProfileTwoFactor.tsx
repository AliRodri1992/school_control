import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,Copy,KeyRound,LockKeyhole,ShieldCheck,ShieldPlus} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {api} from './api';
import {notify} from './notifications';
type Setup={secret:string;provisioning_uri:string};
export default function ProfileTwoFactor({onSignedOut}:{onSignedOut:()=>void}){
 const {ui}=useSchoolLocale();
 const [enabled,setEnabled]=useState(false),[loaded,setLoaded]=useState(false);
 const [setup,setSetup]=useState<Setup|null>(null),[codes,setCodes]=useState<string[]|null>(null);
 const [password,setPassword]=useState(''),[code,setCode]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  void api('profile/two_factor').then((data:{enabled:boolean})=>{
   if(active){setEnabled(data.enabled);setLoaded(true);}
  }).catch((e:Error)=>{if(active){setError(e.message);setLoaded(true);}});
  return()=>{active=false;};
 },[]);
 async function perform(action:'setup'|'confirm'|'disable',event:FormEvent){
  event.preventDefault();if(busy)return;
  setError('');setBusy(true);
  try{
   if(action==='setup'){
    const result=await api('profile/two_factor/setup','POST',{current_password:password});
    setSetup(result);setPassword('');
   }else if(action==='confirm'){
    const result=await api('profile/two_factor/confirm','POST',{code});
    setCodes(result.recovery_codes);setSetup(null);setEnabled(true);setCode('');
    void notify(ui('Verificación en dos pasos activada.'));
   }else{
    const result=await api('profile/two_factor','DELETE',{current_password:password,code});
    void notify(result.message);onSignedOut();
   }
  }catch(e){setError((e as Error).message);}
  finally{setBusy(false);}
 }
 async function copy(text:string){
  try{await navigator.clipboard.writeText(text);void notify(ui('Copiado al portapapeles.'));}
  catch{setError(ui('No fue posible copiar; selecciona el texto manualmente.'));}
 }
 return <section className="sc-profile-card sc-profile-two-factor" aria-labelledby="sc-profile-two-factor-heading">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><ShieldPlus size={21} aria-hidden="true"/></div>
   <div><h2 id="sc-profile-two-factor-heading">{ui('Verificación en dos pasos')}</h2>
    <p>{ui('Protege tu inicio de sesión con una aplicación autenticadora y códigos de recuperación.')}</p></div>
  </header>
  <div className="sc-profile-mfa-body">
   {loaded&&<div className={'sc-profile-mfa-status'+(enabled?' is-enabled':'')}>
    <ShieldCheck size={17}/>{ui(enabled?'Protección adicional activa':'Protección adicional desactivada')}
   </div>}
   {codes?<div className="sc-profile-mfa-recovery" role="status">
    <strong>{ui('Guarda estos códigos de recuperación')}</strong>
    <p>{ui('Cada código funciona una sola vez. Guárdalos fuera del dispositivo; no volverán a mostrarse.')}</p>
    <div className="sc-profile-recovery-grid">{codes.map(value=><code key={value}>{value}</code>)}</div>
    <button type="button" className="secondary" onClick={()=>void copy(codes.join('\n'))}>
     <Copy size={16}/>{ui('Copiar códigos')}</button>
    <button type="button" className="sc-profile-mfa-finish" onClick={()=>setCodes(null)}>{ui('Ya guardé mis códigos')}</button>
   </div>:setup?<form className="sc-profile-mfa-form" onSubmit={event=>void perform('confirm',event)}>
    <p>{ui('Agrega esta clave a tu aplicación autenticadora (Google Authenticator, Microsoft Authenticator u otra compatible).')}</p>
    <div className="sc-profile-secret"><code>{setup.secret}</code>
     <button type="button" aria-label={ui('Copiar clave secreta')} onClick={()=>void copy(setup.secret)}><Copy size={16}/></button>
    </div>
    <label htmlFor="sc-mfa-code">{ui('Código de seis dígitos')}</label>
    <input id="sc-mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
     maxLength={6} value={code} onChange={event=>setCode(event.target.value)} required/>
    <button type="submit" className="primary" disabled={busy}>{ui('Confirmar y activar')}</button>
   </form>:enabled?<form className="sc-profile-mfa-form" onSubmit={event=>void perform('disable',event)}>
    <p>{ui('Para desactivar este segundo factor, confirma tu contraseña y un código válido o de recuperación.')}</p>
    <label htmlFor="sc-mfa-disable-password">{ui('Contraseña actual')}</label>
    <input id="sc-mfa-disable-password" type="password" autoComplete="current-password" required
     value={password} onChange={event=>setPassword(event.target.value)}/>
    <label htmlFor="sc-mfa-disable-code">{ui('Código de autenticación')}</label>
    <input id="sc-mfa-disable-code" autoComplete="one-time-code" required
     value={code} onChange={event=>setCode(event.target.value)}/>
    <button type="submit" className="sc-profile-revoke-button" disabled={busy}>
     <LockKeyhole size={16}/>{ui('Desactivar verificación en dos pasos')}</button>
   </form>:<form className="sc-profile-mfa-form" onSubmit={event=>void perform('setup',event)}>
    <p>{ui('Necesitarás una aplicación autenticadora. Confirma tu contraseña para iniciar la configuración.')}</p>
    <label htmlFor="sc-mfa-start-password">{ui('Contraseña actual')}</label>
    <input id="sc-mfa-start-password" type="password" autoComplete="current-password" required
     value={password} onChange={event=>setPassword(event.target.value)}/>
    <button type="submit" className="primary" disabled={!loaded||busy}><KeyRound size={17}/>{ui('Configurar segundo factor')}</button>
   </form>}
   {error&&<p className="sc-profile-form-error" role="alert">{error}</p>}
  </div>
 </section>;
}
