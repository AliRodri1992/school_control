import {useState} from 'react';
import {X} from 'lucide-react';

export type AuliMood='welcome'|'success'|'thinking'|'warning'|'error'|'help'|'celebration'|'explain';
export default function AuliGuide({title,text,mood='help',dismissible=false,compact=false}:{
 title:string;text:string;mood?:AuliMood;dismissible?:boolean;compact?:boolean;
}) {
 const [hidden,setHidden]=useState(false);
 if(hidden)return null;
 return <aside className={'sc-auli-guide'+(compact?' compact':'')} aria-label="Asistente escolar Auli">
  <img src={'/illustrations/auli-'+mood+'.svg'} alt={'Auli, el loro asistente escolar: '+mood} loading="lazy"/>
  <div className="sc-auli-guide-copy"><strong>{title}</strong><p>{text}</p></div>
  {dismissible&&<button type="button" aria-label="Ocultar consejo de Auli" onClick={()=>setHidden(true)}><X size={16}/></button>}
 </aside>;
}
