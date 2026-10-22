import {useEffect,useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';
export default function Profile({onChange}:{onChange:(user:Row)=>void}) {
 const [profile,setProfile]=useState<Row|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api('profile').then(setProfile).catch(e=>setError(e.message));},[]);
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError('');try{const result=await api('profile','PATCH',{name:form.get('name'),email_notifications:form.get('email_notifications')==='on'});setProfile(result);onChange(result);void notify('Perfil actualizado correctamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><div className="page-heading"><div><h1>Mi perfil</h1><p>Tu información y preferencias de comunicación.</p></div></div>{error&&<p className="error" role="alert">{error}</p>}{profile&&<form className="panel settings" onSubmit={save}><label>Nombre completo<input name="name" required defaultValue={profile.name}/></label><label>Correo de acceso<input readOnly value={profile.email}/></label><label><input type="checkbox" name="email_notifications" defaultChecked={profile.email_notifications}/> Recibir avisos por correo electrónico</label><p>Los avisos aparecen en el portal. El correo se enviará cuando la escuela tenga habilitado su servicio.</p><button className="primary" disabled={busy}>Guardar preferencias</button></form>}<section className="panel settings"><h2>Ayuda</h2><p>Para actualizar tu correo, corregir el expediente o resolver problemas de acceso, contacta a la administración mediante Mensajes. Las tareas y entregas están en Aula virtual; las calificaciones trimestrales, en Calificaciones.</p></section></>;
}
