import {useEffect,useState} from 'react';
import {ArrowLeft,BookOpenCheck,CalendarDays,ClipboardList,FileText,History,ShieldCheck,Users} from 'lucide-react';
import {api} from '../../api';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

type Readiness={status:string;missing_for_submission:string[];missing_for_formalization:string[]};
type Event={action:string;created_at:string};
type Props={admission:Row;student?:Row;onClose:()=>void;onContinue?:()=>void;onOpenStudent?:()=>void;
 onDocuments?:()=>void;onApprove?:()=>void;onCorrections?:()=>void;onReject?:()=>void;onFormalize?:()=>void;onCancel?:()=>void};
const phases=['draft','submitted','correction_requested','approved','enrolled'];
const labels:Record<string,string>={draft:'Borrador',submitted:'En revisión',correction_requested:'Correcciones solicitadas',
 approved:'Solicitud aprobada',rejected:'Solicitud rechazada',cancelled:'Cancelada',enrolled:'Inscripción formalizada'};
export default function AdmissionDetail({admission,student,onClose,onContinue,onOpenStudent,onDocuments,
 onApprove,onCorrections,onReject,onFormalize,onCancel}:Props){
 const {ui}=useSchoolLocale();
 const [readiness,setReadiness]=useState<Readiness|null>(null),[history,setHistory]=useState<Event[]>([]),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  void Promise.all([api('admissions/'+admission.id+'/readiness'),api('admissions/'+admission.id+'/history')])
   .then(([ready,events]:[Readiness,Event[]])=>{if(alive){setReadiness(ready);setHistory(events);}})
   .catch((cause:Error)=>{if(alive)setError(cause.message);});
  return()=>{alive=false;};
 },[admission.id]);
 const status=admission.enrollment_id?'enrolled':String(admission.status);
 const canEdit=['draft','correction_requested'].includes(admission.status);
 return <section className="sc-admission-file" aria-label={ui('Seguimiento de solicitud')}>
  <header className="sc-admission-file-hero"><button type="button" className="sc-record-back" onClick={onClose}><ArrowLeft size={16}/>{ui('Volver a solicitudes')}</button>
   <span className="eyebrow">{ui('ADMISIONES / SEGUIMIENTO')}</span><h1>{admission.student_name||student?.full_name||ui('Solicitud de ingreso')}</h1>
   <div className="sc-admission-file-sub"><span>{admission.folio||ui('Borrador sin folio')}</span><span>{admission.year_name}</span>
    <strong>{ui(labels[status]||status)}</strong></div></header>
  <div className="sc-admission-file-flow" aria-label={ui('Etapas del proceso')}>
   {phases.map((name,i)=><div key={name} aria-current={status===name?'step':undefined} className={phases.indexOf(status)>i?'is-done':''}>
    <span>{i+1}</span><small>{ui(labels[name])}</small></div>)}
  </div>
  <div className="sc-admission-file-grid">
   <article className="sc-admission-file-card"><div className="sc-admission-file-card-heading"><Users size={21}/><div><h2>{ui('Datos del aspirante')}</h2>
    <p>{ui('Identidad y solicitud vinculadas a la misma persona.')}</p></div></div>
    <dl><div><dt>{ui('Nombre completo')}</dt><dd>{student?.full_name||admission.student_name}</dd></div>
     <div><dt>{ui('CURP')}</dt><dd>{student?.curp||ui('Sin registrar')}</dd></div>
     <div><dt>{ui('Grado solicitado')}</dt><dd>{admission.grade_level}°</dd></div></dl>
    {onOpenStudent&&<button className="secondary" type="button" onClick={onOpenStudent}><BookOpenCheck size={16}/>{ui('Consultar expediente completo')}</button>}
   </article>
   <article className="sc-admission-file-card"><div className="sc-admission-file-card-heading"><ClipboardList size={21}/><div><h2>{ui('Requisitos de la solicitud')}</h2>
    <p>{ui('El servidor comprueba estos requisitos antes del envío y la matrícula.')}</p></div></div>
    {readiness?readiness.missing_for_submission.length?<ul className="sc-admission-file-missing">{readiness.missing_for_submission.map(name=><li key={name}>{name}</li>)}</ul>:
     <p className="sc-admission-file-ready"><ShieldCheck size={17}/>{ui('Expediente listo para enviar.')}</p>:<p>{ui('Consultando requisitos…')}</p>}
    {status==='approved'&&readiness?.missing_for_formalization.length?<>
      <h3>{ui('Pendiente para formalizar')}</h3><ul className="sc-admission-file-missing">{readiness.missing_for_formalization.map(name=><li key={name}>{name}</li>)}</ul></>:null}
    {onDocuments&&<button className="secondary" type="button" onClick={onDocuments}><FileText size={16}/>{ui('Ver documentos')}</button>}
   </article>
  </div>
  {admission.reason&&<div className="sc-admission-file-reason" role="status"><strong>{ui('Observaciones de la escuela')}</strong><p>{admission.reason}</p></div>}
  <article className="sc-admission-file-card"><div className="sc-admission-file-card-heading"><History size={20}/><div>
   <h2>{ui('Historial del trámite')}</h2><p>{ui('Registro de acciones y resoluciones institucionales.')}</p></div></div>
   <ol className="sc-admission-history">{history.map((event,i)=><li key={event.action+i}><CalendarDays size={15}/>
    <span>{ui(event.action.replace('admission.','').replaceAll('_',' '))}</span>
    <time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></li>)}
    {!history.length&&<li>{ui('Todavía no hay movimientos registrados.')}</li>}</ol></article>
  {error&&<p role="alert" className="sc-applicant-error">{error}</p>}
  <footer className="sc-admission-file-actions">
   {canEdit&&onContinue&&<button className="primary" type="button" onClick={onContinue}>{ui('Continuar expediente')}</button>}
   {canEdit&&onCancel&&<button className="secondary" type="button" onClick={onCancel}>{ui('Cancelar solicitud')}</button>}
   {status==='submitted'&&onApprove&&<button className="primary" type="button" onClick={onApprove}>{ui('Aprobar solicitud')}</button>}
   {status==='submitted'&&onCorrections&&<button className="secondary" type="button" onClick={onCorrections}>{ui('Solicitar correcciones')}</button>}
   {status==='submitted'&&onReject&&<button className="secondary" type="button" onClick={onReject}>{ui('Rechazar solicitud')}</button>}
   {status==='approved'&&onFormalize&&<button className="primary" type="button" onClick={onFormalize}>{ui('Formalizar inscripción')}</button>}
  </footer>
 </section>;
}
