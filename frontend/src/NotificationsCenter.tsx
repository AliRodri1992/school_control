import {useEffect,useState} from 'react';
import {Bell,CheckCheck,Clock3,Inbox,Search,RefreshCw,ArrowUpRight} from 'lucide-react';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {notificationTime,symbol,notificationTypeLabel} from './shell/NotificationPopover';
import {displayNotificationTitle} from './shared/displayPreferences';
import {api} from './api';
import type {Row} from './modules';

type Filter='all'|'unread'|'read';
export default function Notifications({navigate}:{navigate:(page:string)=>void}) {
 const {ui,locale}=useSchoolLocale();
 const [loaded,setLoaded]=useState(false);
 const [fetchFailed,setFetchFailed]=useState(false);
 const [items,setItems]=useState<Row[]>([]);
 const [unread,setUnread]=useState(0);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [filter,setFilter]=useState<Filter>('all');
 const [search,setSearch]=useState('');
 const english=locale==='en';
 async function refresh(){
  try {
   const result=await api('notifications');
   setItems(Array.isArray(result.items)?result.items:[]);
   setUnread(Number(result.unread_count)||0);
   setFetchFailed(false);
   setError('');
  }catch(e){
   setFetchFailed(true);
   setError((e as Error).message);
  }finally{setLoaded(true);}
 }
 useEffect(()=>{void refresh();},[]);
 async function open(item:Row){
  if(busy)return;
  setBusy(true);setError('');
  try{
   if(!item.read_at)await api(`notifications/${item.id}/read`,'POST');
   await refresh();
   if(item.page)navigate(String(item.page));
  }catch(e){setError((e as Error).message);}
  finally{setBusy(false);}
 }
 async function markAll(){
  if(busy||!unread)return;
  setBusy(true);setError('');
  try{
   await api('notifications/read_all','POST');
   await refresh();
  }catch(e){setError((e as Error).message);}
  finally{setBusy(false);}
 }
 const countRead=items.filter(item=>Boolean(item.read_at)).length;
 const visible=items.filter(item=>{
  if(filter==='unread'&&item.read_at)return false;
  if(filter==='read'&&!item.read_at)return false;
  return String(item.title||'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
 }).sort((a,b)=>Date.parse(String(b.created_at||''))-Date.parse(String(a.created_at||'')));
 return <section className="sc-nc-page" aria-label={ui('Centro de notificaciones')}>
  <header className="sc-nc-hero">
   <div className="sc-nc-hero-heading">
    <span className="sc-nc-hero-icon"><Bell size={24} aria-hidden="true"/></span>
    <div><span className="sc-nc-eyebrow">{english?'COMMUNICATION CENTER':'COMUNICACIÓN ESCOLAR'}</span>
     <h1>{ui('Centro de notificaciones')}</h1>
     <p>{english?'Stay informed about your school activity.':'Mantente al tanto de la actividad de tu comunidad escolar.'}</p>
    </div>
   </div>
   <div className="sc-nc-hero-count"><strong>{unread}</strong><span>{english?'Unread notifications':'Notificaciones sin leer'}</span></div>
  </header>
  <div className="sc-nc-surface">
   <div className="sc-nc-toolbar">
    <div className="sc-nc-tabs" role="group" aria-label={english?'Filter notifications':'Filtrar notificaciones'}>
     {([['all',english?'Todas':'Todas',items.length],['unread',english?'Unread':'Sin leer',unread],['read',english?'Read':'Leídas',countRead]] as const).map(([key,label,count])=>
      <button type="button" key={key} className={'sc-nc-tab'+(filter===key?' is-active':'')}
       aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}<span>{count}</span></button>)}
    </div>
    <button className="sc-nc-mark-all" type="button" disabled={!unread||busy} onClick={()=>void markAll()}>
     <CheckCheck size={16} aria-hidden="true"/>{english?'Mark all as read':'Marcar todas como leídas'}</button>
   </div>
   <div className="sc-nc-search-row">
    <label className="sc-nc-search"><Search size={17} aria-hidden="true"/>
     <span className="sr-only">{english?'Search notifications':'Buscar notificaciones'}</span>
     <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
      placeholder={english?'Search notifications...':'Buscar notificaciones...'}/></label>
    <button type="button" className="sc-nc-refresh" disabled={busy} onClick={()=>void refresh()}
     aria-label={english?'Refresh notifications':'Actualizar notificaciones'}><RefreshCw size={17} aria-hidden="true"/></button>
   </div>
   {error&&<p role="alert" className="sc-nc-error">{error}</p>}
   {!loaded?<div className="sc-nc-empty" role="status"><RefreshCw size={25}/><strong>{english?'Loading notifications...':'Cargando notificaciones...'}</strong></div>:
    visible.length?<div className="sc-nc-list" aria-label={english?'Notifications':'Notificaciones'}>{visible.map(item=>{
     const Icon=symbol(item.page);
     const isUnread=!item.read_at;
     return <button type="button" key={item.id} disabled={busy} onClick={()=>void open(item)}
      className={'sc-nc-item'+(isUnread?' is-unread':'')}>
      <span className="sc-nc-item-icon"><Icon size={20} aria-hidden="true"/></span>
      <span className="sc-nc-item-copy"><span className="sc-nc-item-title">{displayNotificationTitle(String(item.title),locale)}</span>
       <span className="sc-nc-item-meta">{item.notification_type&&<span className="sc-notification-kind">{notificationTypeLabel(String(item.notification_type),locale)}</span>}<Clock3 size={13} aria-hidden="true"/>
        <time dateTime={item.created_at||undefined}>{notificationTime(item.created_at,locale)}</time>
        <span className="sc-nc-item-state">{isUnread?(english?'New':'Nueva'):(english?'Read':'Leída')}</span>
       </span></span>
      {isUnread&&<span className="sc-nc-item-dot" aria-hidden="true"/>}
      <ArrowUpRight size={17} className="sc-nc-item-arrow" aria-hidden="true"/>
     </button>;
    })}</div>:
    <div className="sc-nc-empty">
     <span className="sc-nc-empty-icon">{fetchFailed?<RefreshCw size={27}/>:filter==='unread'?<CheckCheck size={27}/>:<Inbox size={27}/>}</span>
     <strong>{fetchFailed?(english?'Could not load notifications':'No se pudieron cargar las notificaciones'):
      search?(english?'No matching notifications':'No encontramos coincidencias'):
      filter==='unread'?(english?'You are all caught up':'Estás al día con tus notificaciones'):
      filter==='read'?(english?'No read notifications yet':'Aún no tienes notificaciones leídas'):
      english?'No notifications yet':'Todavía no tienes notificaciones'}</strong>
     <p>{english?'School updates will appear here when available.':'Aquí aparecerán las novedades de tu escuela.'}</p>
    </div>}
   <footer className="sc-nc-footer"><span>{visible.length} {english?'notifications shown':'notificaciones mostradas'}</span>
    <span>{english?'School Control · Notification center':'School Control · Centro de notificaciones'}</span></footer>
  </div>
 </section>;
}
