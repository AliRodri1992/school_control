import {useSchoolLocale} from '../i18n/LocaleContext';
import {useState} from 'react';
import {AlertTriangle,BookOpenCheck,CheckCircle2,Lightbulb,ShieldAlert,Sparkles,X} from 'lucide-react';

export type AuliMood='welcome'|'success'|'thinking'|'warning'|'error'|'help'|'celebration'|'explain';

const moodDetails={
 welcome:{label:'TE DAMOS LA BIENVENIDA',icon:Sparkles},
 success:{label:'TODO EN ORDEN',icon:CheckCircle2},
 thinking:{label:'INFORMACIÓN DEL SISTEMA',icon:Lightbulb},
 warning:{label:'ATENCIÓN',icon:ShieldAlert},
 error:{label:'NECESITA ATENCIÓN',icon:AlertTriangle},
 help:{label:'CONSEJO DE AULI',icon:Lightbulb},
 celebration:{label:'¡BUEN TRABAJO!',icon:Sparkles},
 explain:{label:'APRENDE CON AULI',icon:BookOpenCheck}
} as const;

export default function AuliGuide({title,text,mood='help',dismissible=false,compact=false}:{
 title:string;text:string;mood?:AuliMood;dismissible?:boolean;compact?:boolean;
}) {
 const {ui,locale}=useSchoolLocale();
 const [hidden,setHidden]=useState(false);
 if(hidden)return null;
 const {label,icon:Icon}=moodDetails[mood];
 return <aside className={'sc-auli-guide mood-'+mood+(compact?' compact':'')} aria-label={locale==='en'?'Auli school assistant':'Asistente escolar Auli'}>
  <div className="sc-auli-guide-mascot">
   <img src={'/illustrations/auli-'+mood+'.svg'} alt={(locale==='en'?'Auli, the school parrot assistant: ':'Auli, el loro asistente escolar: ')+mood} loading="lazy"/>
  </div>
  <div className="sc-auli-guide-copy">
   <span className="sc-auli-guide-eyebrow"><Icon size={14} strokeWidth={2.2} aria-hidden="true"/>{ui(label)}</span>
   <strong>{ui(title)}</strong>
   <p>{ui(text)}</p>
  </div>
  {dismissible&&<button type="button" aria-label={ui('Ocultar consejo de Auli')} onClick={()=>setHidden(true)}><X size={16}/></button>}
 </aside>;
}
