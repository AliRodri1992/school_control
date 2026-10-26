import {useEffect,useRef,useState,type ChangeEvent,type FormEvent} from 'react';
import {ArrowRight,BadgeCheck,BellRing,BookOpen,Building2,CalendarDays,Camera,ChevronRight,LockKeyhole,Mail,Phone,Save,ShieldCheck,Trash2,UserRound,UsersRound} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {userInitials} from './shell/userInitials';
import AccountSecurity from './AccountSecurity';
import ProfileEmailChange from './ProfileEmailChange';
import ProfileNotificationSettings from './ProfileNotificationSettings';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';

type ProfileRecord={
 name:string;email:string;role:string;email_notifications:boolean;
 phone_e164?:string|null;avatar_url?:string|null;institution_name?:string|null;
 account_created_at?:string;account_status?:string;
 assigned_context?:{title:string;count:number};
}&Row;
const roles:Record<string,string>={
 admin:'Administración',teacher:'Docente',guardian:'Tutor o familiar',student:'Alumno'
};
const allowedAvatarTypes=['image/jpeg','image/png','image/webp'];
const maxAvatarBytes=2*1024*1024;

export default function Profile({onChange,onSignedOut,onNavigate}:{
 onChange:(user:Row)=>void;onSignedOut:()=>void;onNavigate?:(page:string)=>void
}){
 const {ui,locale}=useSchoolLocale();
 const [profile,setProfile]=useState<ProfileRecord|null>(null);
 const [name,setName]=useState(''),[emailNotices,setEmailNotices]=useState(false),[phone,setPhone]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[avatarBusy,setAvatarBusy]=useState(false);
 const [reloadKey,setReloadKey]=useState(0),[avatarVersion,setAvatarVersion]=useState(0);
 const [error,setError]=useState(''),[avatarError,setAvatarError]=useState('');
 const avatarInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError('');
  void api('profile').then((result:ProfileRecord)=>{
   if(!active)return;
   setProfile(result);setName(result.name||'');setEmailNotices(Boolean(result.email_notifications));
   setPhone(result.phone_e164||'');setAvatarError('');
  }).catch((cause:Error)=>{if(active)setError(cause.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[reloadKey]);
 const phoneChanged=profile!==null&&phone.trim()!==(profile.phone_e164||'');
 const dirty=profile!==null&&(name!==profile.name||emailNotices!==Boolean(profile.email_notifications)||phoneChanged);
 function discard(){
  if(!profile)return;
  setName(profile.name);setEmailNotices(Boolean(profile.email_notifications));
  setPhone(profile.phone_e164||'');setError('');
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const cleanName=name.trim();
  if(!cleanName){setError(ui('Escribe tu nombre completo.'));return;}
  if(phone.trim()&&!/^\+[1-9]\d{1,14}$/.test(phone.trim())){
   setError(ui('Introduce un teléfono internacional válido, por ejemplo +525512345678.'));return;
  }
  if(!profile||busy||!dirty)return;
  setBusy(true);setError('');
  try{
   const updates:Record<string,unknown>={name:cleanName,email_notifications:emailNotices};
   if(phoneChanged)updates.phone_e164=phone.trim();
   const result:ProfileRecord=await api('profile','PATCH',updates);
   setProfile(result);setName(result.name);setPhone(result.phone_e164||'');
   setEmailNotices(Boolean(result.email_notifications));
   onChange(result);
   void notify(ui('Perfil actualizado correctamente.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 async function uploadAvatar(event:ChangeEvent<HTMLInputElement>){
  const file=event.currentTarget.files?.[0];event.currentTarget.value='';
  if(!file)return;
  if(!allowedAvatarTypes.includes(file.type)||file.size<1||file.size>maxAvatarBytes){
   setAvatarError(ui('Selecciona una foto PNG, JPG o WebP de hasta 2 MB.'));return;
  }
  const upload=new FormData();upload.set('avatar',file);
  setAvatarBusy(true);setAvatarError('');
  try{
   const updated:ProfileRecord=await api('profile/avatar','POST',upload);
   setProfile(updated);setAvatarVersion(version=>version+1);onChange(updated);
   void notify(ui('Fotografía de perfil actualizada.'));
  }catch(cause){setAvatarError((cause as Error).message);}
  finally{setAvatarBusy(false);}
 }
 async function removeAvatar(){
  setAvatarBusy(true);setAvatarError('');
  try{
   const updated:ProfileRecord=await api('profile/avatar','DELETE');
   setProfile(updated);setAvatarVersion(version=>version+1);onChange(updated);
   void notify(ui('Fotografía de perfil eliminada.'));
  }catch(cause){setAvatarError((cause as Error).message);}
  finally{setAvatarBusy(false);}
 }
 function avatar(){
  return profile?.avatar_url?
   <img src={profile.avatar_url+(avatarVersion?'?v='+avatarVersion:'')} alt={ui('Fotografía de perfil')}/>:userInitials(profile?.name||'');
 }
 return <section className="sc-profile sc-profile-expanded" aria-label={ui('Mi perfil')}>
  <div className="sc-profile-page-heading">
   <div>
    <span className="sc-profile-eyebrow">{ui('MI CUENTA')} / {ui('PERFIL PERSONAL')}</span>
    <h1>{ui('Mi perfil')}</h1>
    <p>{ui('Gestiona tus datos de contacto, tu identidad y la seguridad de tu cuenta escolar.')}</p>
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
   <header className="sc-profile-identity sc-profile-identity-expanded">
    <div className="sc-profile-identity-details">
     <div className="sc-profile-avatar-holder">
      <span className={'sc-profile-avatar'+(profile.avatar_url?' has-photo':'')} aria-label={ui('Avatar de tu cuenta')}>{avatar()}</span>
      <button type="button" className="sc-profile-camera-button" disabled={avatarBusy}
       onClick={()=>avatarInput.current?.click()} aria-label={ui('Cambiar fotografía de perfil')}>
       <Camera size={17} aria-hidden="true"/>
      </button>
      {profile.avatar_url&&<button type="button" className="sc-profile-delete-button" disabled={avatarBusy}
       onClick={()=>void removeAvatar()} aria-label={ui('Eliminar fotografía de perfil')} title={ui('Eliminar foto')}>
       <Trash2 size={16} aria-hidden="true"/>
      </button>}
      <input ref={avatarInput} className="sc-profile-hidden-file" type="file" accept="image/png,image/jpeg,image/webp"
       aria-label={ui('Seleccionar fotografía de perfil')} onChange={event=>void uploadAvatar(event)}/>
     </div>
     <div className="sc-profile-person">
      <span className="sc-profile-identity-eyebrow">{ui('TU IDENTIDAD ESCOLAR')}</span>
      <h2>{profile.name}</h2>
      <p><Mail size={15} aria-hidden="true"/>{profile.email}</p>
      <span className="sc-profile-role"><UsersRound size={14} aria-hidden="true"/>{ui(roles[profile.role]||'Miembro de la comunidad')}</span>
     </div>
    </div>
    <div className="sc-profile-identity-decoration" aria-hidden="true">
     <div className="sc-profile-identity-orbit"><ShieldCheck size={49} strokeWidth={1.35}/></div>
     <span>{ui('Tu identidad, protegida en School Control')}</span>
    </div>
    <div className="sc-profile-avatar-actions">
     <button type="button" className="sc-profile-avatar-change" disabled={avatarBusy}
      onClick={()=>avatarInput.current?.click()}><Camera size={15}/>{ui(avatarBusy?'Procesando fotografía…':'Cambiar foto')}</button>
     {profile.avatar_url&&<button type="button" className="sc-profile-avatar-remove" disabled={avatarBusy}
      onClick={()=>void removeAvatar()}><Trash2 size={15}/>{ui('Eliminar foto')}</button>}
     <small>{ui('PNG, JPG o WebP · Máximo 2 MB')}</small>
     {avatarError&&<span role="alert">{avatarError}</span>}
    </div>
   </header>
   <div className="sc-profile-columns">
    <div className="sc-profile-primary-column">
     <form className="sc-profile-card sc-profile-edit" onSubmit={event=>void save(event)}>
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
          value={name} onChange={event=>{setName(event.target.value);setError('');}}
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
        <small>{ui('Los cambios de correo requieren una verificación de seguridad.')}</small>
       </div>
       <div className="sc-profile-field">
        <label htmlFor="sc-profile-phone">{ui('Teléfono de contacto')}</label>
        <div className="sc-profile-input-wrap">
         <Phone size={18} aria-hidden="true"/>
         <input id="sc-profile-phone" name="phone_e164" type="tel" autoComplete="tel"
          value={phone} onChange={event=>{setPhone(event.target.value);setError('');}}
          placeholder="+525512345678" maxLength={16}/>
        </div>
        <small>{ui('Usa el formato internacional E.164 con prefijo + y código del país. Es opcional.')}</small>
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
         onChange={event=>{setEmailNotices(event.target.checked);setError('');}}/>
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
     <section className="sc-profile-card sc-profile-account-info">
      <header className="sc-profile-card-heading">
       <div className="sc-profile-heading-icon"><Building2 size={20} aria-hidden="true"/></div>
       <div><h2>{ui('Mi cuenta escolar')}</h2><p>{ui('Información institucional vinculada a tu acceso.')}</p></div>
      </header>
      <dl className="sc-profile-account-facts">
       <div><dt><Building2 size={16}/>{ui('Institución')}</dt><dd>{profile.institution_name||ui('Institución escolar')}</dd></div>
       <div><dt><BadgeCheck size={16}/>{ui('Estado de cuenta')}</dt><dd className="sc-profile-active-status">{ui(profile.account_status==='inactive'?'Inactiva':'Activa')}</dd></div>
       <div><dt><CalendarDays size={16}/>{ui('Cuenta creada')}</dt><dd>{profile.account_created_at?new Date(profile.account_created_at).toLocaleDateString(locale==='en'?'en-US':'es-MX',{dateStyle:'long'}):'—'}</dd></div>
       {profile.assigned_context&&<div><dt><BookOpen size={16}/>{ui(profile.assigned_context.title)}</dt><dd>{profile.assigned_context.count}</dd></div>}
      </dl>
      <p className="sc-profile-info-footnote">{ui('Los datos institucionales se administran desde los módulos correspondientes.')}</p>
     </section>
     <ProfileNotificationSettings/>
     <aside className="sc-profile-help">
      <span className="sc-profile-help-icon"><ChevronRight size={20} aria-hidden="true"/></span>
      <div>
       <h2>{ui('Privacidad y ayuda de tu cuenta')}</h2>
       <p>{ui('Consulta cómo protegemos tu información y solicita cambios a tu expediente a través de Mensajes.')}</p>
       <div className="sc-profile-help-links">
        <span className="sc-profile-privacy-note">{ui('La institución escolar es responsable de informarte sobre el uso de tus datos personales.')}</span>
        {onNavigate&&<button type="button" onClick={()=>onNavigate('messages')}>{ui('Ir a Mensajes')}<ArrowRight size={15}/></button>}
       </div>
      </div>
     </aside>
    </div>
    <div className="sc-profile-security-column">
     <AccountSecurity onSignedOut={onSignedOut}/>
     <ProfileEmailChange currentEmail={profile.email} onSignedOut={onSignedOut}/>
    </div>
   </div>
  </>}
 </section>;
}
