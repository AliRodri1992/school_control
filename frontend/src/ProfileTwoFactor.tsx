import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,Copy,KeyRound,ShieldCheck,ShieldOff} from 'lucide-react';
import {api} from './api';
import {notify} from './notifications';
import {useSchoolLocale} from './shared/i18n/LocaleContext';

type Setup={secret:string;provisioning_uri:string};
export default function ProfileTwoFactor({onSignedOut}:{onSignedOut:()=>void}){
 const {ui}=useSchoolLocale();
 const [enabled,setEnabled]=useState<boolean|null>(null),[setup,setSetup]=useState<Setup|null>(null);
 const [codes,setCodes]=useState<string[]|null>(null);
 const [password,setPassword]=useState(''),[code,setCode]=useState(''),[error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  void api('profile/two_factor').then((data:{enabled:boolean})=>{if(active)setEnabled(data.enabled);})
   .catch((cause:Error)=>{if(active)setError(cause.message);});
  return()=>{active=false;};
 },[]);
 async function start(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try{
   const result:Setup=await api('profile/two_factor/setup','POST',{current_password:password});
   setSetup(result);setPassword('');
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 async function confirm(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try{
   const result:{enabled:boolean;recovery_codes:string[]}=await api('profile/two_factor/confirm','POST',{code});
   setEnabled(true);setSetup(null);setCode('');setCodes(result.recovery_codes);
   void notify(ui('Verificación en dos pasos activada.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 async function disable(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError('');
  try{
   await api('profile/two_factor','DELETE',{code,current_password:password});
   void notify(ui('Verificación en dos pasos desactivada.'));
   onSignedOut();
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 return <section className="sc-profile-card sc-profile-twofactor" aria-labelledby="profile-twofactor-title">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><ShieldCheck size={21} aria-hidden="true"/></div>
   <div><h2 id="profile-twofactor-title">{ui('Verificación en dos pasos')}</h2>
    <p>{ui('Agrega un código temporal de una aplicación autenticadora para iniciar sesión.')}</p></div>
  </header>
  <div className="sc-profile-twofactor-body">
   {enabled===null?<p role="status">{ui('Consultando seguridad…')}</p>:<div className="sc-profile-twofactor-state">
    {enabled?<CheckCircle2 size={18}/>:<ShieldOff size={18}/>}
    <strong>{ui(enabled?'Protección activada':'Protección no activada')}</strong>
   </div>}
   {codes&&<div className="sc-profile-recovery-codes">
    <h3>{ui('Códigos de recuperación — se muestran una sola vez')}</h3>
    <p>{ui('Guárdalos en un lugar seguro. Cada código permite un único inicio de sesión.')}</p>
    <div className="sc-profile-recovery-grid">{codes.map(value=><code key={value}>{value}</code>)}</div>
    <button type="button" className="secondary" onClick={()=>void navigator.clipboard?.writeText(codes.join('\n'))}>
     <Copy size={16}/>{ui('Copiar códigos')}
    </button>
    <button type="button" onClick={()=>setCodes(null)}>{ui('Ya guardé mis códigos')}</button>
   </div>}
   {enabled===false&&!setup&&<form className="sc-profile-twofactor-form" onSubmit={event=>void start(event)}>
    <div className="sc-profile-field"><label htmlFor="mfa-current-password">{ui('Contraseña actual')}</label>
     <input id="mfa-current-password" required autoComplete="current-password" type="password"
      value={password} onChange={event=>setPassword(event.target.value)}/></div>
    <button className="primary" type="submit" disabled={busy}><KeyRound size={16}/>{ui('Configurar autenticador')}</button>
   </form>}
   {enabled===false&&setup&&<form className="sc-profile-twofactor-form" onSubmit={event=>void confirm(event)}>
    <p>{ui('Agrega esta clave en tu aplicación de autenticación. Después escribe el código de seis dígitos.')}</p>
    <code className="sc-profile-totp-secret">{setup.secret}</code>
    <a href={setup.provisioning_uri} className="sc-profile-totp-link">{ui('Abrir aplicación de autenticación')}</a>
    <div className="sc-profile-field"><label htmlFor="mfa-confirm-code">{ui('Código de seis dígitos')}</label>
     <input id="mfa-confirm-code" required inputMode="numeric" pattern="[0-9]{6}"
      maxLength={6} autoComplete="one-time-code" value={code} onChange={event=>setCode(event.target.value)}/></div>
    <button className="primary" type="submit" disabled={busy}>{ui('Activar verificación en dos pasos')}</button>
   </form>}
   {enabled===true&&<form className="sc-profile-twofactor-form" onSubmit={event=>void disable(event)}>
    <p>{ui('Para desactivar esta protección confirma tu contraseña y un código del autenticador o de recuperación.')}</p>
    <div className="sc-profile-field"><label htmlFor="mfa-disable-password">{ui('Contraseña actual')}</label>
     <input id="mfa-disable-password" required autoComplete="current-password" type="password"
      value={password} onChange={event=>setPassword(event.target.value)}/></div>
    <div className="sc-profile-field"><label htmlFor="mfa-disable-code">{ui('Código de verificación')}</label>
     <input id="mfa-disable-code" required autoComplete="one-time-code" value={code}
      onChange={event=>setCode(event.target.value)}/></div>
    <button className="sc-profile-revoke-button" type="submit" disabled={busy}>
     <ShieldOff size={16}/>{ui('Desactivar verificación en dos pasos')}
    </button>
   </form>}
   {error&&<p role="alert" className="sc-profile-form-error">{error}</p>}
  </div>
 </section>;
}
