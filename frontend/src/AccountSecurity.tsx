import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';

export default function AccountSecurity({onSignedOut}:{onSignedOut:()=>void}) {
 const {ui}=useSchoolLocale();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>, changePassword:boolean) {
    event.preventDefault();
    const fields=Object.fromEntries(new FormData(event.currentTarget));
    if(changePassword&&fields.password!==fields.password_confirmation){setError(ui('Las contraseñas no coinciden.'));return;}
    setBusy(true);setError('');
    try {
      const result=await api(changePassword?'profile/password':'profile/sessions',changePassword?'PATCH':'DELETE',fields);
      void notify(result.message);onSignedOut();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="panel settings"><h2>{ui("Seguridad de tu cuenta")}</h2><p>{ui("Estas acciones cierran todas tus sesiones, incluida la actual. Necesitarás iniciar sesión de nuevo.")}</p>{error&&<p className="error" role="alert">{error}</p>}<form onSubmit={event=>submit(event,true)}><h3>{ui("Cambiar contraseña")}</h3><label>{ui("Contraseña actual")}<input name="current_password" type="password" autoComplete="current-password" required/></label><label>{ui("Nueva contraseña")}<input name="password" type="password" autoComplete="new-password" minLength={12} required placeholder={ui("Al menos 12 caracteres")}/></label><label>{ui("Confirmar nueva contraseña")}<input name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required/></label><button className="primary" disabled={busy}>{ui("Actualizar contraseña y cerrar sesiones")}</button></form><form onSubmit={event=>submit(event,false)}><h3>{ui("Cerrar sesiones en todos los dispositivos")}</h3><label>{ui("Confirma tu contraseña actual")}<input name="current_password" type="password" autoComplete="current-password" required/></label><button className="secondary" disabled={busy}>{ui("Cerrar todas mis sesiones")}</button></form></section>;
}
