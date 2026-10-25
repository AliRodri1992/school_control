import {useEffect,useState} from 'react';
import {version} from '../../package.json';

type Health='checking'|'online'|'unavailable';
type Props={locale:string;onNavigate:(page:string)=>void};

const copy={
 es:{support:'Soporte',privacy:'Aviso de privacidad',terms:'Términos de uso',rights:'Todos los derechos reservados.',
  online:'Servidor disponible',unavailable:'Estado no disponible',checking:'Comprobando servidor',version:'Versión'},
 en:{support:'Support',privacy:'Privacy notice',terms:'Terms of use',rights:'All rights reserved.',
  online:'Server available',unavailable:'Status unavailable',checking:'Checking server',version:'Version'}
} as const;

/** Shared authenticated footer, rendered only within the portal main column. */
export function PortalFooter({locale,onNavigate}:Props){
 const labels=locale==='en'?copy.en:copy.es;
 const [health,setHealth]=useState<Health>('checking');
 useEffect(()=>{
  if(typeof fetch!=='function'){setHealth('unavailable');return;}
  const controller=new AbortController();
  fetch('/up',{method:'GET',signal:controller.signal,cache:'no-store'})
   .then(response=>{if(!controller.signal.aborted)setHealth(response.ok?'online':'unavailable');})
   .catch(()=>{if(!controller.signal.aborted)setHealth('unavailable');});
  return()=>controller.abort();
 },[]);
 return <footer className="sc-portal-footer" aria-label={locale==='en'?'Portal footer':'Pie del portal'}>
   <div className="sc-portal-footer-copy">© {new Date().getFullYear()} School Control. {labels.rights}</div>
   <nav className="sc-portal-footer-links" aria-label={locale==='en'?'Footer links':'Enlaces del pie de página'}>
    <button type="button" onClick={()=>onNavigate('help')}>{labels.support}</button>
    <span className="sc-portal-footer-separator" aria-hidden="true"/>
    <button type="button" onClick={()=>onNavigate('privacy')}>{labels.privacy}</button>
    <span className="sc-portal-footer-separator" aria-hidden="true"/>
    <button type="button" onClick={()=>onNavigate('terms')}>{labels.terms}</button>
   </nav>
   <div className="sc-portal-footer-meta">
    <span className={'sc-portal-footer-health sc-portal-footer-health-'+health}
      role="status" aria-label={health==='online'?labels.online:health==='checking'?labels.checking:labels.unavailable}>
     <span className="sc-portal-footer-dot" aria-hidden="true"/>
     {health==='online'?labels.online:health==='checking'?labels.checking:labels.unavailable}
    </span>
    <span className="sc-portal-footer-separator" aria-hidden="true"/>
    <span className="sc-portal-footer-version" title={labels.version+' '+version}>v{version}</span>
   </div>
 </footer>;
}
