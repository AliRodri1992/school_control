import {useEffect,useRef,useState,type FormEvent} from 'react';
import {CheckCircle2,KeyRound,MailCheck,Send,ShieldCheck} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {api} from './api';
import {notify} from './notifications';

/** Email is updated only after proof of possession of the new address. */
export default function ProfileEmailChange({currentEmail,onSignedOut}:{
 currentEmail:string;onSignedOut:()=>void
}){
 const {ui}=useSchoolLocale();
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [loading,setLoading]=useState(false),[confirming,setConfirming]=useState(false);
 const [requested,setRequested]=useState(false),[error,setError]=useState('');
 const attempted=useRef(false);
 useEffect(()=>{
  const token=new URLSearchParams(window.location.search).get('verify_email');
  if(!token||attempted.current)return;
  attempted.current=true;setConfirming(true);
  // Remove the secret from the address bar before it can leak into screenshots or referrals.
  const url=new URL(window.location.href);
  url.searchParams.delete('verify_email');
  window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);
  void api('profile/email_change/confirm','POST',{token}).then((result:{message:string})=>{
   void notify(result.message);onSignedOut();
  }).catch((cause:Error)=>setError(cause.message))
   .finally(()=>setConfirming(false));
 },[onSignedOut]);
 async function request(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading||confirming)return;
  setError('');setLoading(true);
  try{
   await api('profile/email_change','POST',{email:email.trim().toLowerCase(),current_password:password});
   setRequested(true);setPassword('');
   void notify(ui('Enlace de verificación enviado al nuevo correo.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setLoading(false);}
 }
 return <section className="sc-profile-card sc-profile-email-change" aria-labelledby="sc-profile-email-change-heading">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><MailCheck size={20} aria-hidden="true"/></div>
   <div><h2 id="sc-profile-email-change-heading">{ui('Cambiar correo de acceso')}</h2>
    <p>{ui('Confirma la nueva dirección antes de cambiar tus credenciales.')}</p></div>
  </header>
  <div className="sc-profile-email-current">
   <MailCheck size={17} aria-hidden="true"/><span>{ui('Correo actual')}: <strong>{currentEmail}</strong></span>
  </div>
  {requested?<div className="sc-profile-email-requested" role="status">
   <CheckCircle2 size={22} aria-hidden="true"/>
   <div><strong>{ui('Revisa tu nuevo correo')}</strong>
    <p>{ui('Enviamos un enlace de verificación que caduca en 15 minutos. El correo actual continuará activo hasta verificarlo.')}</p>
    <button type="button" onClick={()=>setRequested(false)}>{ui('Solicitar otro enlace')}</button>
   </div>
  </div>:<form onSubmit={event=>void request(event)} className="sc-profile-email-form">
   <div className="sc-profile-field">
    <label htmlFor="sc-new-account-email">{ui('Nuevo correo electrónico')}</label>
    <input id="sc-new-account-email" type="email" name="email" autoComplete="email"
     placeholder="nuevo@escuela.edu.mx" required value={email}
     onChange={event=>setEmail(event.target.value)}/>
   </div>
   <div className="sc-profile-field">
    <label htmlFor="sc-email-change-password">{ui('Confirma tu contraseña actual')}</label>
    <input id="sc-email-change-password" type="password" name="current_password" autoComplete="current-password"
     required value={password} onChange={event=>setPassword(event.target.value)}
     placeholder={ui('Contraseña actual')}/>
   </div>
   <p className="sc-profile-email-warning"><ShieldCheck size={16} aria-hidden="true"/>
    {ui('Después de verificar el nuevo correo, se cerrarán todas tus sesiones por seguridad.')}</p>
   <button className="primary sc-profile-security-submit" type="submit"
    disabled={loading||confirming||email.trim().toLowerCase()===currentEmail.toLowerCase()}>
    {confirming?<KeyRound size={17}/>:<Send size={17}/>}
    {ui(confirming?'Verificando correo…':loading?'Enviando…':'Enviar enlace de verificación')}
   </button>
  </form>}
  {error&&<p className="sc-profile-form-error" role="alert">{error}</p>}
 </section>;
}
