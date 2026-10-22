import {useState, type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';

export default function PasswordRecovery({schoolName, token, onClose}:{schoolName:string;token?:string;onClose:()=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields=Object.fromEntries(new FormData(event.currentTarget));
    if(token && fields.password!==fields.password_confirmation){setError('Las contraseñas no coinciden.');return;}
    setBusy(true);setError('');
    try {
      const result=await api('password_reset',token?'PATCH':'POST',token?{...fields,token}:fields);
      if(token){void notify(result.message);onClose();}else{setMessage(result.message);}
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="boot"><section className="panel settings" style={{width:'min(100%, 480px)',textAlign:'left'}}><span className="eyebrow">{schoolName}</span><h1>{token?'Nueva contraseña':'Recupera tu acceso'}</h1><p>{token?'El enlace vence en 15 minutos. Al guardar, se cerrarán todas tus sesiones.':'Te enviaremos un enlace al correo de tu cuenta.'}</p>{message?<p role="status">{message}</p>:<form onSubmit={submit}>{token?<><label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" required minLength={12} placeholder="Al menos 12 caracteres"/></label><label>Confirmar nueva contraseña<input name="password_confirmation" type="password" autoComplete="new-password" required minLength={12} placeholder="Repite tu nueva contraseña"/></label></>:<label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com"/></label>}{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Un momento…':token?'Guardar nueva contraseña':'Enviar enlace'}</button></form>}<button type="button" className="text-button" disabled={busy} onClick={onClose}>Volver al inicio de sesión</button></section></div>;
}
