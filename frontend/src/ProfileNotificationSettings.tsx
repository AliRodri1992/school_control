import {useEffect,useState} from 'react';
import {Bell,BookOpen,CalendarDays,ClipboardCheck,Save,ShieldCheck} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {api} from './api';
import {notify} from './notifications';

type Category='notification_school'|'notification_grades'|'notification_attendance'|'notification_events';
type Settings=Record<Category,boolean>&Record<string,unknown>;
const categories=[
 {key:'notification_school',label:'Comunicados escolares',help:'Información y actividad institucional relevante.',icon:Bell},
 {key:'notification_grades',label:'Calificaciones',help:'Publicación y actualizaciones de evaluaciones.',icon:BookOpen},
 {key:'notification_attendance',label:'Asistencia',help:'Cambios de asistencia y seguimiento.',icon:ClipboardCheck},
 {key:'notification_events',label:'Calendario y eventos',help:'Actividades y novedades del calendario.',icon:CalendarDays}
] as const;

export default function ProfileNotificationSettings(){
 const {ui}=useSchoolLocale();
 const [initial,setInitial]=useState<Settings|null>(null),[settings,setSettings]=useState<Settings|null>(null);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError('');
  void api('preferences').then((data:Settings)=>{
   if(!active)return;
   const next=Object.fromEntries(categories.map(item=>[item.key,data[item.key]!==false])) as Settings;
   setInitial(next);setSettings(next);
  }).catch((e:Error)=>{if(active)setError(e.message);})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[retry]);
 const dirty=Boolean(initial&&settings&&categories.some(item=>initial[item.key]!==settings[item.key]));
 async function save(){
  if(!settings||!dirty||saving)return;
  setSaving(true);setError('');
  try{
   const fields=Object.fromEntries(categories.map(item=>[item.key,settings[item.key]]));
   const updated=await api('preferences','PATCH',fields);
   const next=Object.fromEntries(categories.map(item=>[item.key,updated[item.key]!==false])) as Settings;
   setInitial(next);setSettings(next);
   void notify(ui('Preferencias de notificaciones actualizadas.'));
  }catch(e){setError((e as Error).message);}
  finally{setSaving(false);}
 }
 return <section className="sc-profile-card sc-profile-notification-card" aria-labelledby="sc-profile-notices-title">
  <header className="sc-profile-card-heading">
   <div className="sc-profile-heading-icon"><Bell size={21} aria-hidden="true"/></div>
   <div><h2 id="sc-profile-notices-title">{ui('Mis notificaciones')}</h2>
    <p>{ui('Elige qué avisos deseas recibir sobre tu actividad escolar.')}</p></div>
  </header>
  {loading?<p role="status" className="sc-profile-notice-loading">{ui('Cargando tus avisos…')}</p>:
   !settings?<div className="sc-profile-notice-loading" role="alert">
    <p>{error||ui('No pudimos cargar estas preferencias.')}</p>
    <button type="button" className="secondary" onClick={()=>setRetry(value=>value+1)}>{ui('Reintentar')}</button>
   </div>:<>
    <div className="sc-profile-notification-list">
     {categories.map(({key,label,help,icon:Icon})=><div className="sc-profile-notification-item" key={key}>
      <span className="sc-profile-notification-icon"><Icon size={17} aria-hidden="true"/></span>
      <div className="sc-profile-notification-copy"><strong id={'profile-category-'+key}>{ui(label)}</strong><p>{ui(help)}</p></div>
      <label className="sc-profile-switch">
       <input type="checkbox" role="switch" checked={Boolean(settings[key])} disabled={saving}
        aria-labelledby={'profile-category-'+key}
        onChange={event=>setSettings(prev=>prev?{...prev,[key]:event.target.checked}:prev)}/>
       <span aria-hidden="true"/>
      </label>
     </div>)}
    </div>
    {error&&<p className="sc-profile-form-error" role="alert">{error}</p>}
    <footer className="sc-profile-form-actions">
     <small className="sc-profile-notice-hint"><ShieldCheck size={15} aria-hidden="true"/>{ui('Estos ajustes están vinculados a tu cuenta.')}</small>
     <button className="primary sc-profile-save" type="button" onClick={()=>void save()} disabled={!dirty||saving}>
      <Save size={16} aria-hidden="true"/>{ui(saving?'Guardando…':'Guardar avisos')}
     </button>
    </footer>
   </>}
 </section>;
}
