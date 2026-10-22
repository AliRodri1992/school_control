import {useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';

export default function AccountSecurity({onSignedOut}:{onSignedOut:()=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>, changePassword:boolean) {
    event.preventDefault();
    const fields=Object.fromEntries(new FormData(event.currentTarget));
    if(changePassword&&fields.password!==fields.password_confirmation){setError('Las contraseñas no coinciden.');return;}
    setBusy(true);setError('');
    try {
      const result=await api(changePassword?'profile/password':'profile/sessions',changePassword?'PATCH':'DELETE',fields);
      void notify(result.message);onSignedOut();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="panel settings"><h2>Seguridad de tu cuenta</h2><p>Estas acciones cierran todas tus sesiones, incluida la actual. Necesitarás iniciar sesión de nuevo.</p>{error&&<p className="error" role="alert">{error}</p>}<form onSubmit={event=>submit(event,true)}><h3>Cambiar contraseña</h3><label>Contraseña actual<input name="current_password" type="password" autoComplete="current-password" required/></label><label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={12} required placeholder="Al menos 12 caracteres"/></label><label>Confirmar nueva contraseña<input name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required/></label><button className="primary" disabled={busy}>Actualizar contraseña y cerrar sesiones</button></form><form onSubmit={event=>submit(event,false)}><h3>Cerrar sesiones en todos los dispositivos</h3><label>Confirma tu contraseña actual<input name="current_password" type="password" autoComplete="current-password" required/></label><button className="secondary" disabled={busy}>Cerrar todas mis sesiones</button></form></section>;
}
