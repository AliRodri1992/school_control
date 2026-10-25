import type {ReactNode} from 'react';
import {CalendarDays,Clock3,ArrowUpRight} from 'lucide-react';

type Event = {id:string|number;title:string;starts_at:string;ends_at:string};
type Props = {events:Event[];locale:string;empty:ReactNode};

export default function DashboardUpcomingEvents({events,locale,empty}:Props){
 const language=locale==='en'?'en-US':'es-MX';
 const now=Date.now();
 const upcoming=events.filter(event=>{
  const end=Date.parse(event.ends_at);
  return Number.isFinite(end)&&end>=now&&Number.isFinite(Date.parse(event.starts_at));
 }).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)).slice(0,6);
 if(!upcoming.length)return <>{empty}</>;
 const day=(date:Date)=>new Intl.DateTimeFormat(language,{day:'2-digit'}).format(date);
 const month=(date:Date)=>new Intl.DateTimeFormat(language,{month:'short'}).format(date).replace('.','').toUpperCase();
 const weekday=(date:Date)=>new Intl.DateTimeFormat(language,{weekday:'long'}).format(date);
 const clock=(date:Date)=>new Intl.DateTimeFormat(language,{hour:'2-digit',minute:'2-digit'}).format(date);
 return <div className="sc-events-agenda" aria-label={locale==='en'?'Upcoming events':'Agenda de próximos eventos'}>
  <div className="sc-events-summary"><span className="sc-events-summary-icon"><CalendarDays size={15} aria-hidden="true"/></span>
   <span>{locale==='en'?'School calendar':'Agenda escolar'}</span>
   <strong>{upcoming.length} {locale==='en'?(upcoming.length===1?'event':'events'):(upcoming.length===1?'evento':'eventos')}</strong>
  </div>
  <ol className="sc-events-list">{upcoming.map((event,index)=>{
   const start=new Date(event.starts_at),end=new Date(event.ends_at);
   const allDay=start.getHours()===0&&start.getMinutes()===0&&
    end.getHours()===23&&end.getMinutes()>=59;
   const sameDay=start.toDateString()===end.toDateString();
   return <li className="sc-event-row" key={event.id}>
    <div className="sc-event-date" aria-label={start.toLocaleDateString(language,{dateStyle:'full'})}>
     <span>{month(start)}</span><strong>{day(start)}</strong>
    </div>
    <div className="sc-event-details">
     <div className="sc-event-eyebrow">{index===0?(locale==='en'?'NEXT EVENT':'PRÓXIMO EVENTO'):weekday(start)}</div>
     <strong className="sc-event-title">{event.title}</strong>
     <span className="sc-event-time"><Clock3 size={13} aria-hidden="true"/>
      {allDay?(locale==='en'?'All day':'Todo el día'):
       sameDay?`${clock(start)} – ${clock(end)}`:
       `${clock(start)} · ${end.toLocaleDateString(language,{day:'numeric',month:'short'})}`}
     </span>
    </div>
    <ArrowUpRight className="sc-event-accent" size={16} aria-hidden="true"/>
   </li>;
  })}</ol>
  {events.length>6&&<div className="sc-events-more">{locale==='en'?'Showing the next 6 events':'Mostrando los próximos 6 eventos'}</div>}
 </div>;
}
