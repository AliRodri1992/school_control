import {useEffect,useState} from 'react';
import {Laptop2,RefreshCw,ShieldAlert,Smartphone} from 'lucide-react';
import {api} from './api';
import {confirmDanger,notify} from './notifications';
import {useSchoolLocale} from './shared/i18n/LocaleContext';

type Device={id:number;name:string;current:boolean;last_seen_at:string;created_at:string};
export default function ProfileDevices({onSignedOut}:{onSignedOut:()=>void}){
 const {ui}=useSchoolLocale();
 const [devices,setDevices]=useState<Device[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null);
 const [error,setError]=useState(''),[password,setPassword]=useState('');
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let active=true;setLoading(true);setError('');
  void api('profile/devices').then((data:{devices:Device[]})=>{if(active)setDevices(data.devices);})
   .catch((e:Error)=>{if(active)setError(e.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[refresh]);
 async function revoke(device:Device){
  if(!password||busy!==null)return;
  const confirmed=await confirmDanger(ui('Cerrar sesión del dispositivo'),
   ui('Se solicitará nuevamente iniciar sesión en ese dispositivo.'),ui('Cerrar sesión'));
  if(!confirmed)return;
  setBusy(device.id);setError('');
  try{
   const result=await api('profile/devices/'+device.id,'DELETE',{current_password:password});
   setPassword('');setDevices(previous=>previous.filter(entry=>entry.id!==device.id));
   void notify(ui(result.message));
   if(result.signed_out)onSignedOut();
  }catch(e){setError((e as Error).message);}
  finally{setBusy(null);}
 }
 return <section className="sc-profile-card sc-profile-devices" aria-labelledby="profile-devices-title">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><Laptop2 size={21} aria-hidden="true"/></div>
   <div><h2 id="profile-devices-title">{ui('Dispositivos con sesión activa')}</h2>
    <p>{ui('Revisa y cierra accesos que ya no utilices.')}</p></div>
  </header>
  {loading?<p role="status" className="sc-profile-devices-loading">{ui('Consultando sesiones…')}</p>:
   <div className="sc-profile-devices-body">
    <button className="sc-profile-devices-refresh" type="button" onClick={()=>setRefresh(value=>value+1)}>
     <RefreshCw size={15}/>{ui('Actualizar dispositivos')}
    </button>
    {devices.length===0&&!error&&<p className="sc-profile-devices-empty">{ui('No se encontraron otras sesiones abiertas.')}</p>}
    <div className="sc-profile-devices-list">
     {devices.map(device=><div className="sc-profile-device" key={device.id}>
      <div className="sc-profile-device-icon">{/iPhone|Android/.test(device.name)?<Smartphone size={20}/>:<Laptop2 size={20}/>}</div>
      <div className="sc-profile-device-details"><strong>{device.name}</strong>
       <small>{ui('Último acceso registrado')}: {new Date(device.last_seen_at).toLocaleString()}</small>
       {device.current&&<span>{ui('Dispositivo actual')}</span>}
      </div>
      <button type="button" disabled={busy!==null||!password} onClick={()=>void revoke(device)}>
       {ui('Cerrar sesión')}
      </button>
     </div>)}
    </div>
    <div className="sc-profile-field sc-profile-devices-password">
     <label htmlFor="sc-profile-revoke-password">{ui('Contraseña para cerrar un dispositivo')}</label>
     <input type="password" id="sc-profile-revoke-password" autoComplete="current-password"
      placeholder={ui('Contraseña actual')} value={password}
      onChange={event=>setPassword(event.target.value)}/>
    </div>
    {error&&<p className="sc-profile-form-error" role="alert">{error}</p>}
    <p className="sc-profile-devices-hint"><ShieldAlert size={15}/>{ui('Si no reconoces un dispositivo, cambia tu contraseña y cierra todas las sesiones.')}</p>
   </div>}
 </section>;
}
