import {FileText,HelpCircle,ShieldCheck} from 'lucide-react';
import {useInterfaceLocale} from '../../shared/i18n/LocaleContext';

type Page='privacy'|'terms';
export function LegalInformation({kind,onHelp}:{kind:Page;onHelp:()=>void}){
 const {locale}=useInterfaceLocale(),en=locale==='en';
 const privacy=kind==='privacy';
 const title=privacy?(en?'Privacy notice':'Aviso de privacidad'):(en?'Terms of use':'Términos de uso');
 return <section className="sc-legal-information" aria-label={title}>
  <header className="sc-legal-information-header">
   <span className="sc-legal-information-icon">{privacy?<ShieldCheck size={23}/>:<FileText size={23}/>}</span>
   <div>
    <h1>{title}</h1>
    <p>{en?'Institutional legal documentation':'Documentación legal institucional'}</p>
   </div>
  </header>
  <div className="sc-legal-information-card">
   <h2>{en?'Document not yet published':'Documento aún no publicado'}</h2>
   <p>{privacy?
    (en?'The school has not published an official privacy notice in School Control. Please ask the institution for its current privacy notice.':
      'La institución todavía no ha publicado un aviso de privacidad oficial en School Control. Solicita a la escuela su aviso de privacidad vigente.'):
    (en?'The institution has not published official terms of use in School Control. Ask the system administrator for the applicable terms.':
      'La institución todavía no ha publicado términos de uso oficiales en School Control. Solicita al administrador del sistema los términos aplicables.')}
   </p>
   <button type="button" className="sc-legal-help" onClick={onHelp}>
    <HelpCircle size={17}/>{en?'Open help center':'Ir al centro de ayuda'}
   </button>
  </div>
 </section>;
}
export default LegalInformation;
