import {useEffect,useState} from 'react';
import {Laptop2,LockKeyhole,MonitorSmartphone,ShieldCheck,Trash2} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {api} from './api';
import {notify} from './notifications';
type Device={id:number;name:string;created_at:string;last_seen_at:string;current:boolean};

export default function ProfileDevices({onSignedOut}:{onSignedOut:()=>void}){
 const {ui,locale}=useSchoolLocale();
 const [devices,setDevices]=useState<Device[]>([]),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[password,setPassword]=useState(''),[selected,setSelected]=useState<number|null>(null);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  void api('profile/devices').then((data:{devices:Device[]})=>{
   if(active)setDevices(data.devices);
  }).catch((cause:Error)=>{if(active)setError(cause.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 async function revoke(){
  if(selected===null||!password||busy)return;
  setBusy(true);setError('');
  try{
   const result=await api('profile/devices/'+selected,'DELETE',{current_password:password});
   if(result.signed_out){onSignedOut();return;}
   setDevices(current=>current.filter(item=>item.id!==selected));
   setSelected(null);setPassword('');
   void notify(ui('La sesión del dispositivo se cerró.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 return <section className="sc-profile-card sc-profile-devices" aria-labelledby="sc-profile-devices-heading">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><MonitorSmartphone size={21} aria-hidden="true"/></div>
   <div><h2 id="sc-profile-devices-heading">{ui('Dispositivos con sesión iniciada')}</h2>
    <p>{ui('Consulta y cierra accesos individuales, sin afectar a otros usuarios.')}</p></div>
  </header>
  {loading?<p className="sc-profile-notice-loading" role="status">{ui('Consultando tus sesiones…')}</p>:<>
   <div className="sc-profile-device-list">
    {devices.map(device=><div className="sc-profile-device" key={device.id}>
     <span className="sc-profile-device-icon"><Laptop2 size={20}/></span>
     <div><strong>{device.name}</strong>
      <small>{ui('Última actividad')}: {new Date(device.last_seen_at).toLocaleString(locale==='en'?'en-US':'es-MX')}</small>
      {device.current&&<span className="sc-profile-device-current"><ShieldCheck size={13}/>{ui('Sesión actual')}</span>}
     </div>
     <button type="button" aria-label={ui('Cerrar sesión en')+' '+device.name}
      onClick={()=>{setSelected(device.id);setError('');setPassword('');}}>
      <Trash2 size={17}/></button>
    </div>)}
    {!devices.length&&<p className="sc-profile-notice-loading">{ui('No hay sesiones activas registradas.')}</p>}
   </div>
   {selected!==null&&<form className="sc-profile-device-confirm" onSubmit={event=>{event.preventDefault();void revoke();}}>
    <label htmlFor="sc-device-password">{ui('Confirma tu contraseña para cerrar esta sesión')}</label>
    <input id="sc-device-password" type="password" required autoComplete="current-password"
     value={password} onChange={event=>setPassword(event.target.value)}/>
    <div><button type="button" className="secondary" onClick={()=>{setSelected(null);setPassword('');}}>{ui('Cancelar')}</button>
     <button type="submit" className="primary" disabled={busy}>{ui(busy?'Cerrando sesión…':'Confirmar cierre')}</button></div>
   </form>}
   {error&&<p role="alert" className="sc-profile-form-error">{error}</p>}
   <p className="sc-profile-devices-foot"><LockKeyhole size={15}/>{ui('Si no reconoces un acceso, cambia tu contraseña y cierra todas tus sesiones.')}</p>
  </>}
 </section>;
}
