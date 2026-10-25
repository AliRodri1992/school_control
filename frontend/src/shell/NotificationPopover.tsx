import {useState} from 'react';
import {ArrowRight,Bell,BellOff,BookOpenCheck,CalendarDays,CheckCheck,ClipboardCheck,FileText,GraduationCap,Mail,MessageSquare,ShieldCheck,X} from 'lucide-react';

export type NotificationPreview={
 id:number|string;title:string;page?:string|null;created_at?:string|null;read_at?:string|null;
};
type Props={
 locale:string;items:NotificationPreview[];unread:number;loading?:boolean;busy?:boolean;
 error?:string;onRead:(item:NotificationPreview)=>void;onReadAll:()=>void;onClose:()=>void;onViewAll:()=>void;
};
const copy={
 es:{title:'Notificaciones',subtitle:'Novedades de tu comunidad escolar',all:'Todas',unread:'Sin leer',pending:'pendientes',caughtUp:'Todo al día',markAll:'Marcar todas como leídas',close:'Cerrar notificaciones',emptyAll:'No tienes notificaciones recientes',emptyUnread:'Ya revisaste todas tus notificaciones',emptyHint:'Las novedades de tu escuela aparecerán aquí.',allLink:'Ir al centro de notificaciones',loading:'Cargando notificaciones',new:'Nueva',read:'Leída',open:'Abrir notificación'},
 en:{title:'Notifications',subtitle:'Updates from your school community',all:'All',unread:'Unread',pending:'unread',caughtUp:'All caught up',markAll:'Mark all as read',close:'Close notifications',emptyAll:'No recent notifications',emptyUnread:'You are all caught up',emptyHint:'School updates will appear here.',allLink:'Open notification center',loading:'Loading notifications',new:'New',read:'Read',open:'Open notification'}
};
function symbol(page?:string|null){
 switch(page){
 case 'grades':case 'students':case 'enrollments':return GraduationCap;
 case 'attendances':case 'admissions':return ClipboardCheck;
 case 'calendar_events':case 'schedule':return CalendarDays;
 case 'messages':return Mail;
 case 'announcements':return MessageSquare;
 case 'classroom':return BookOpenCheck;
 case 'documents':return FileText;
 default:return ShieldCheck;
 }
}
export function notificationTime(value:string|null|undefined,locale:string,now=Date.now()){
 if(!value)return '';
 const timestamp=Date.parse(value);
 if(!Number.isFinite(timestamp))return '';
 const language=locale==='en'?'en':locale==='ko'?'ko':'es';
 const minutes=Math.max(0,Math.floor((now-timestamp)/60000));
 const relative=new Intl.RelativeTimeFormat(language,{numeric:'auto',style:'short'});
 if(minutes<60)return relative.format(-Math.max(1,minutes),'minute');
 if(minutes<1440)return relative.format(-Math.floor(minutes/60),'hour');
 if(minutes<10080)return relative.format(-Math.floor(minutes/1440),'day');
 return new Intl.DateTimeFormat(language,{day:'numeric',month:'short'}).format(timestamp);
}
/** Notifications are a separate read-only flyout, with explicit read actions. */
export default function NotificationPopover({locale,items,unread,loading=false,busy=false,error='',onRead,onReadAll,onClose,onViewAll}:Props){
 const [filter,setFilter]=useState<'all'|'unread'>('all');
 const labels=locale==='en'?copy.en:copy.es;
 const filtered=(filter==='unread'?items.filter(item=>!item.read_at):items).slice(0,6);
 return <section className="sc-flyout sc-notification-panel" aria-label={labels.title}>
  <header className="sc-np-header">
   <div className="sc-np-heading">
    <span className="sc-np-header-icon" aria-hidden="true"><Bell size={20}/></span>
    <div className="sc-np-heading-copy"><strong>{labels.title}</strong><small>{labels.subtitle}</small></div>
   </div>
   <button type="button" className="sc-np-close" aria-label={labels.close} onClick={onClose}><X size={18}/></button>
  </header>
  <div className="sc-np-toolbar">
   <span className="sc-np-status">
    <span className={'sc-np-status-dot'+(unread?' has-unread':'')}/>
    {unread>0?<><strong>{unread}</strong> {labels.pending}</>:labels.caughtUp}
   </span>
   {unread>0&&<button type="button" className="sc-np-mark-all" disabled={busy} onClick={onReadAll}><CheckCheck size={15}/>{labels.markAll}</button>}
  </div>
  <div className="sc-np-tabs" role="tablist" aria-label={labels.title}>
   <button type="button" role="tab" aria-selected={filter==='all'} className={'sc-np-tab'+(filter==='all'?' is-active':'')} onClick={()=>setFilter('all')}>{labels.all}<span>{items.length}</span></button>
   <button type="button" role="tab" aria-selected={filter==='unread'} className={'sc-np-tab'+(filter==='unread'?' is-active':'')} onClick={()=>setFilter('unread')}>{labels.unread}<span>{unread}</span></button>
  </div>
  <div className="sc-np-scroll" role="tabpanel" aria-live="polite">
   {error&&<p className="sc-np-error" role="alert">{error}</p>}
   {loading?<div className="sc-np-empty" role="status"><Bell size={23}/><strong>{labels.loading}</strong></div>:
    filtered.length?filtered.map(item=>{
     const Icon=symbol(item.page);
     const unseen=!item.read_at;
     const date=notificationTime(item.created_at,locale);
     return <button key={item.id} type="button" disabled={busy}
      className={'sc-np-item'+(unseen?' is-unread':'')} onClick={()=>onRead(item)}
      aria-label={labels.open+': '+item.title}>
      <span className="sc-np-item-icon" aria-hidden="true"><Icon size={19}/></span>
      <span className="sc-np-item-main">
       <span className="sc-np-item-title">{item.title}</span>
       <span className="sc-np-item-meta">{date&&<time dateTime={item.created_at||undefined}>{date}</time>}<span>{unseen?labels.new:labels.read}</span></span>
      </span>
      {unseen&&<span className="sc-np-unread-dot" aria-hidden="true"/>}
     </button>;
    }):<div className="sc-np-empty"><span className="sc-np-empty-icon"><BellOff size={24}/></span><strong>{filter==='unread'?labels.emptyUnread:labels.emptyAll}</strong><p>{labels.emptyHint}</p></div>}
  </div>
  <footer className="sc-np-footer">
   <button type="button" onClick={onViewAll}>{labels.allLink}<ArrowRight size={17}/></button>
  </footer>
 </section>;
}
