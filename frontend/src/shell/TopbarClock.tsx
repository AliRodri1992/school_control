import {useEffect,useState} from 'react';
import {CalendarClock} from 'lucide-react';
export default function TopbarClock({locale,timeZone}:{locale:string;timeZone:string}){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60_000);return()=>window.clearInterval(timer);},[]);
 const lang=locale==='es'?'es-MX':locale;
 const date=new Intl.DateTimeFormat(lang,{dateStyle:'medium',timeZone}).format(now);
 const time=new Intl.DateTimeFormat(lang,{hour:'2-digit',minute:'2-digit',timeZone}).format(now);
 return <div className="sc-clock" title={(locale==='en'?'Time zone: ':'Zona horaria: ')+timeZone}>
  <CalendarClock size={16} aria-hidden="true"/><time dateTime={now.toISOString()}>{date} · {time}</time></div>;
}
