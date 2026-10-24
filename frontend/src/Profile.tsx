import {useSchoolLocale} from './shared/i18n/LocaleContext';
import AccountSecurity from './AccountSecurity';
import {useEffect,useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';
export default function Profile({onChange,onSignedOut}:{onChange:(user:Row)=>void;onSignedOut:()=>void}) {
 const {ui}=useSchoolLocale();
 const [profile,setProfile]=useState<Row|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api('profile').then(setProfile).catch(e=>setError(e.message));},[]);
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError('');try{const result=await api('profile','PATCH',{name:form.get('name'),email_notifications:form.get('email_notifications')==='on'});setProfile(result);onChange(result);void notify('Perfil actualizado correctamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><div className="page-heading"><div><h1>{ui("Mi perfil")}</h1><p>{ui("Tu información y preferencias de comunicación.")}</p></div></div>{error&&<p className="error" role="alert">{error}</p>}{profile&&<form className="panel settings" onSubmit={save}><label>{ui("Nombre completo")}<input name="name" required defaultValue={profile.name}/></label><label>{ui("Correo de acceso")}<input readOnly value={profile.email}/></label><label><input type="checkbox" name="email_notifications" defaultChecked={profile.email_notifications}/> {ui("Recibir avisos por correo electrónico")}</label><p>{ui("Los avisos aparecen en el portal. El correo se enviará cuando la escuela tenga habilitado su servicio.")}</p><button className="primary" disabled={busy}>{ui("Guardar preferencias")}</button></form>}<AccountSecurity onSignedOut={onSignedOut}/><section className="panel settings"><h2>{ui("Ayuda")}</h2><p>{ui("Para actualizar tu correo, corregir el expediente o resolver problemas de acceso, contacta a la administración mediante Mensajes. Las tareas y entregas están en Aula virtual; las calificaciones trimestrales, en Calificaciones.")}</p></section></>;
}
