import {useEffect,useState,type FormEvent} from 'react';
import {BellRing,ChevronRight,LockKeyhole,Mail,Save,ShieldCheck,UserRound,UsersRound} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {userInitials} from './shell/userInitials';
import AccountSecurity from './AccountSecurity';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';

type ProfileRecord={name:string;email:string;role:string;email_notifications:boolean}&Row;
const roles:Record<string,string>={
 admin:'Administración',teacher:'Docente',guardian:'Tutor o familiar',student:'Alumno'
};

/** Personal account settings: never offers edits to login email or role. */
export default function Profile({onChange,onSignedOut}:{onChange:(user:Row)=>void;onSignedOut:()=>void}){
 const {ui}=useSchoolLocale();
 const [profile,setProfile]=useState<ProfileRecord|null>(null);
 const [name,setName]=useState(''),[emailNotices,setEmailNotices]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [reloadKey,setReloadKey]=useState(0);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  setLoading(true);setError('');
  void api('profile').then((result:ProfileRecord)=>{
   if(!active)return;
   setProfile(result);setName(result.name||'');setEmailNotices(Boolean(result.email_notifications));
   setError('');
  }).catch((cause:Error)=>{if(active)setError(cause.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[reloadKey]);
 const dirty=profile!==null&&(name!==profile.name||emailNotices!==Boolean(profile.email_notifications));
 function discard(){
  if(!profile)return;
  setName(profile.name);setEmailNotices(Boolean(profile.email_notifications));
  setError('');
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const cleanName=name.trim();
  if(!cleanName){setError(ui('Escribe tu nombre completo.'));return;}
  if(!profile||busy||!dirty)return;
  setBusy(true);setError('');
  try{
   const result:ProfileRecord=await api('profile','PATCH',{name:cleanName,email_notifications:emailNotices});
   setProfile(result);setName(result.name);setEmailNotices(Boolean(result.email_notifications));
   onChange(result);
   void notify(ui('Perfil actualizado correctamente.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 function changeName(value:string){setName(value);setError('');}
 function changeNotices(checked:boolean){setEmailNotices(checked);setError('');}
 return <section className="sc-profile" aria-label={ui('Mi perfil')}>
  <div className="sc-profile-page-heading">
   <div>
    <span className="sc-profile-eyebrow">{ui('MI CUENTA')} / {ui('PERFIL PERSONAL')}</span>
    <h1>{ui('Mi perfil')}</h1>
    <p>{ui('Consulta tu identidad escolar, actualiza tus datos y protege el acceso a tu cuenta.')}</p>
   </div>
   <span className="sc-profile-header-badge"><ShieldCheck size={16} aria-hidden="true"/>{ui('Cuenta personal')}</span>
  </div>
  {loading?<div className="sc-profile-loading" role="status">
   <span className="sc-profile-loading-avatar" aria-hidden="true"/>
   <div><strong>{ui('Cargando tu perfil…')}</strong><p>{ui('Estamos consultando los datos de tu cuenta.')}</p></div>
  </div>:!profile?<div className="sc-profile-load-error" role="alert">
   <LockKeyhole size={22} aria-hidden="true"/>
   <div><strong>{ui('No fue posible cargar tu perfil.')}</strong><p>{error}</p></div>
   <button type="button" className="secondary" onClick={()=>setReloadKey(value=>value+1)}>{ui('Reintentar')}</button>
  </div>:<>
   <header className="sc-profile-identity">
    <div className="sc-profile-identity-details">
     <span className="sc-profile-avatar" aria-hidden="true">{userInitials(profile.name)}</span>
     <div className="sc-profile-person">
      <span className="sc-profile-identity-eyebrow">{ui('TU IDENTIDAD ESCOLAR')}</span>
      <h2>{profile.name}</h2>
      <p><Mail size={15} aria-hidden="true"/>{profile.email}</p>
      <span className="sc-profile-role"><UsersRound size={14} aria-hidden="true"/>{ui(roles[profile.role]||'Miembro de la comunidad')}</span>
     </div>
    </div>
    <div className="sc-profile-identity-decoration" aria-hidden="true">
     <div className="sc-profile-identity-orbit"><ShieldCheck size={49} strokeWidth={1.35}/></div>
     <span>{ui('Un espacio seguro para tu comunidad escolar')}</span>
    </div>
   </header>
   <div className="sc-profile-columns">
    <div className="sc-profile-primary-column">
     <form className="sc-profile-card sc-profile-edit" onSubmit={save}>
      <header className="sc-profile-card-heading">
       <div className="sc-profile-heading-icon"><UserRound size={21} aria-hidden="true"/></div>
       <div><h2>{ui('Información personal')}</h2><p>{ui('Estos datos te identifican dentro de School Control.')}</p></div>
      </header>
      <div className="sc-profile-fields">
       <div className="sc-profile-field">
        <label htmlFor="sc-profile-name">{ui('Nombre completo')} <span aria-hidden="true">*</span></label>
        <div className="sc-profile-input-wrap">
         <UserRound size={18} aria-hidden="true"/>
         <input id="sc-profile-name" name="name" autoComplete="name" required maxLength={120}
          value={name} onChange={event=>changeName(event.target.value)}
          aria-invalid={Boolean(error&&name.trim().length===0)}
          placeholder={ui('Escribe tu nombre completo')}/>
        </div>
        <small>{ui('Se mostrará en tu perfil y en las secciones donde participes.')}</small>
       </div>
       <div className="sc-profile-field">
        <label htmlFor="sc-profile-email">{ui('Correo de acceso')}</label>
        <div className="sc-profile-input-wrap is-readonly">
         <Mail size={18} aria-hidden="true"/>
         <input id="sc-profile-email" name="email" type="email" value={profile.email}
          readOnly aria-readonly="true" autoComplete="email"/>
         <LockKeyhole size={16} aria-hidden="true"/>
        </div>
        <small>{ui('Por seguridad, solicita el cambio de correo a la administración escolar.')}</small>
       </div>
      </div>
      <div className="sc-profile-notification-option">
       <div className="sc-profile-option-icon"><BellRing size={20} aria-hidden="true"/></div>
       <div className="sc-profile-option-copy">
        <strong id="sc-profile-emails-label">{ui('Avisos por correo electrónico')}</strong>
        <p id="sc-profile-emails-hint">{ui('Recibe novedades escolares cuando la institución habilite el envío de correos.')}</p>
       </div>
       <label className="sc-profile-switch">
        <input type="checkbox" name="email_notifications" role="switch" checked={emailNotices}
         aria-labelledby="sc-profile-emails-label" aria-describedby="sc-profile-emails-hint"
         onChange={event=>changeNotices(event.target.checked)}/>
        <span aria-hidden="true"/>
       </label>
      </div>
      {error&&<p className="sc-profile-form-error" role="alert">{error}</p>}
      <footer className="sc-profile-form-actions">
       <button type="button" className="sc-profile-discard" onClick={discard} disabled={!dirty||busy}>{ui('Descartar cambios')}</button>
       <button type="submit" className="primary sc-profile-save" disabled={!dirty||busy}>
        <Save size={17} aria-hidden="true"/>{ui(busy?'Guardando…':'Guardar cambios')}
       </button>
      </footer>
     </form>
     <aside className="sc-profile-help">
      <span className="sc-profile-help-icon"><ChevronRight size={20} aria-hidden="true"/></span>
      <div>
       <h2>{ui('¿Necesitas actualizar otros datos?')}</h2>
       <p>{ui('Para corregir tu correo de acceso o un expediente escolar, contacta a la administración a través de Mensajes.')}</p>
      </div>
     </aside>
    </div>
    <div className="sc-profile-security-column">
     <AccountSecurity onSignedOut={onSignedOut}/>
    </div>
   </div>
  </>}
 </section>;
}
