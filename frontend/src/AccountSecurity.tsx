import {useState,type FormEvent} from 'react';
import {Eye,EyeOff,KeyRound,LockKeyhole,LogOut,ShieldCheck} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {api} from './api';
import {notify,confirmDanger} from './notifications';

export default function AccountSecurity({onSignedOut}:{onSignedOut:()=>void}){
 const {ui}=useSchoolLocale();
 const [busy,setBusy]=useState<'password'|'sessions'|null>(null);
 const [passwordError,setPasswordError]=useState(''),[sessionError,setSessionError]=useState('');
 const [showNewPasswords,setShowNewPasswords]=useState(false);

 async function submit(event:FormEvent<HTMLFormElement>,action:'password'|'sessions'){
  event.preventDefault();
  if(busy)return;
  if(action==='sessions'){
   const confirmed=await confirmDanger(
    ui('Cerrar todas las sesiones'),
    ui('Esta acción cerrará tu cuenta en todos los dispositivos. Tendrás que iniciar sesión de nuevo.'),
    ui('Sí, cerrar sesiones')
   );
   if(!confirmed)return;
  }
  const fields=Object.fromEntries(new FormData(event.currentTarget));
  if(action==='password'&&fields.password!==fields.password_confirmation){
   setPasswordError(ui('Las contraseñas no coinciden.'));return;
  }
  setBusy(action);setPasswordError('');setSessionError('');
  try{
   const result=await api(action==='password'?'profile/password':'profile/sessions',
    action==='password'?'PATCH':'DELETE',fields);
   void notify(result.message);
   onSignedOut();
  }catch(cause){
   if(action==='password')setPasswordError((cause as Error).message);
   else setSessionError((cause as Error).message);
  }finally{setBusy(null);}
 }
 return <>
  <section className="sc-profile-card sc-profile-password">
   <header className="sc-profile-card-heading">
    <div className="sc-profile-heading-icon"><ShieldCheck size={21} aria-hidden="true"/></div>
    <div><h2>{ui('Seguridad de tu cuenta')}</h2><p>{ui('Mantén tu contraseña protegida y actualizada.')}</p></div>
   </header>
   <form onSubmit={event=>void submit(event,'password')} onChange={()=>setPasswordError('')}>
    <div className="sc-profile-security-info"><LockKeyhole size={16} aria-hidden="true"/>
     <p>{ui('Por seguridad, al cambiar la contraseña se cerrarán todas tus sesiones.')}</p>
    </div>
    <div className="sc-profile-security-fields">
     <div className="sc-profile-field">
      <label htmlFor="sc-current-password">{ui('Contraseña actual')}</label>
      <input id="sc-current-password" name="current_password" type="password"
       autoComplete="current-password" required placeholder={ui('Ingresa tu contraseña actual')}/>
     </div>
     <div className="sc-profile-field">
      <label htmlFor="sc-new-password">{ui('Nueva contraseña')}</label>
      <div className="sc-profile-password-wrap">
       <input id="sc-new-password" name="password" type={showNewPasswords?'text':'password'}
        autoComplete="new-password" minLength={12} required placeholder={ui('Mínimo 12 caracteres')}/>
       <button type="button" aria-label={ui(showNewPasswords?'Ocultar contraseñas':'Mostrar contraseñas')}
        aria-pressed={showNewPasswords} onClick={()=>setShowNewPasswords(value=>!value)}>
        {showNewPasswords?<EyeOff size={17}/>:<Eye size={17}/>}
       </button>
      </div>
     </div>
     <div className="sc-profile-field">
      <label htmlFor="sc-confirm-password">{ui('Confirmar nueva contraseña')}</label>
      <input id="sc-confirm-password" name="password_confirmation"
       type={showNewPasswords?'text':'password'} autoComplete="new-password"
       minLength={12} required placeholder={ui('Repite tu nueva contraseña')}/>
     </div>
    </div>
    {passwordError&&<p className="sc-profile-form-error" role="alert">{passwordError}</p>}
    <button type="submit" className="primary sc-profile-security-submit" disabled={busy!==null}>
     <KeyRound size={17} aria-hidden="true"/>{ui(busy==='password'?'Actualizando…':'Actualizar contraseña y cerrar sesiones')}
    </button>
   </form>
  </section>
  <section className="sc-profile-card sc-profile-sessions">
   <header className="sc-profile-card-heading">
    <div className="sc-profile-heading-icon is-amber"><LogOut size={20} aria-hidden="true"/></div>
    <div><h2>{ui('Sesiones y dispositivos')}</h2><p>{ui('Protege tu cuenta si usaste un equipo compartido.')}</p></div>
   </header>
   <p className="sc-profile-sessions-description">{ui('Cierra el acceso a tu cuenta desde todos los dispositivos, incluido el actual.')}</p>
   <form onSubmit={event=>void submit(event,'sessions')} onChange={()=>setSessionError('')}>
    <div className="sc-profile-field">
     <label htmlFor="sc-session-password">{ui('Confirma tu contraseña actual')}</label>
     <input id="sc-session-password" name="current_password" type="password"
      autoComplete="current-password" required placeholder={ui('Contraseña actual')}/>
    </div>
    {sessionError&&<p className="sc-profile-form-error" role="alert">{sessionError}</p>}
    <button type="submit" className="sc-profile-revoke-button" disabled={busy!==null}>
     <LogOut size={17} aria-hidden="true"/>{ui(busy==='sessions'?'Cerrando sesiones…':'Cerrar todas mis sesiones')}
    </button>
   </form>
  </section>
 </>;
}
