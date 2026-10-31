import {useSchoolLocale} from './shared/i18n/LocaleContext';
import Combobox from './shared/components/Combobox';
import TableAction from './shared/components/TableAction';
import {useState, type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';

export default function GradeRequests({grade,onChanged,canCreate=true}:{grade:Row;canCreate?:boolean;onChanged:()=>Promise<void>}) {
 const {ui}=useSchoolLocale();
  const [decisions,setDecisions]=useState<Record<number,string>>({});
  const [requests,setRequests]=useState<Row[]|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const endpoint=`grades/${grade.id}/change_requests`;
  async function open(){
    setBusy(true);setError('');
    try{setRequests(await api(endpoint));}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function submit(event:FormEvent<HTMLFormElement>,request?:Row){
    event.preventDefault();
    if(request&&!decisions[request.id]){setError('Resolución no puede estar vacía.');return;}
    const form=event.currentTarget;
    const fields=Object.fromEntries(new FormData(form));
    setBusy(true);setError('');
    try{
      await api(request?`${endpoint}/${request.id}/resolve`:endpoint,'POST',request?fields:{...fields,lock_version:String(grade.lock_version)});
      setRequests(await api(endpoint));await onChanged();form.reset();if(request)setDecisions(previous=>({...previous,[request.id]:''}));
      void notify(request?'Solicitud resuelta correctamente.':'Solicitud enviada correctamente.');
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <>
    <TableAction kind="requests" ariaLabel="Solicitudes de corrección" tooltip="Solicitudes" disabled={busy} onClick={open}/>
    {requests===null&&error&&<p role="alert" className="error">{error}</p>}
    {requests!==null&&<div className="overlay"><section className="dialog sc-grade-request-dialog" role="dialog" aria-modal="true" aria-label={ui("Solicitudes de corrección")}>
      <header><div><span className="sc-grade-request-eyebrow">SEGUIMIENTO ACADÉMICO</span><h2>{ui("Solicitudes de corrección")}</h2></div><button disabled={busy} aria-label={ui("Cerrar solicitudes")} onClick={()=>setRequests(null)}>×</button></header>
      <p>{grade.student_name} · {grade.subject_name} · Trimestre {grade.term}</p>
      <p>{ui("La nota publicada permanece vigente hasta que otra persona de administración apruebe el cambio. El motivo es interno.")}</p>
      {error&&<p role="alert" className="error">{error}</p>}
      <div className="sc-grade-request-list">{requests.map(request=><article className="sc-grade-request-card" key={request.id}>
        <h3>{request.previous_score} → {request.score} · {({pending:'Pendiente',approved:'Aprobada',rejected:'Rechazada'} as Record<string,string>)[request.status]}</h3>
        <p>{request.requester_name} · {new Date(request.created_at).toLocaleString('es-MX')}</p>
        <p>Motivo: {request.reason}</p>
        <p>Retroalimentación anterior: {request.previous_feedback||'Sin retroalimentación'}</p>
        <p>Retroalimentación propuesta: {request.feedback||'Sin retroalimentación'}</p>
        {request.resolver_name&&<p>{request.resolver_name}: {request.resolution_reason}</p>}
        {request.can_resolve&&<form className="sc-grade-request-resolution" onSubmit={event=>submit(event,request)}>
          <div className="sc-form-dropdown"><label>{ui("Resolución")}</label><Combobox label={'Resolución de solicitud '+request.id}
  value={decisions[request.id]||''} onChange={value=>setDecisions(previous=>({...previous,[request.id]:value}))}
  placeholder={ui("Selecciona una resolución")} options={[{value:'approved',label:ui("Aprobar")},{value:'rejected',label:ui("Rechazar")}]}/>
  <input type="hidden" name="decision" value={decisions[request.id]||''}/></div>
          <label>{ui("Motivo de resolución")}<textarea name="resolution_reason" required maxLength={2000}/></label>
          <button className="primary" disabled={busy}>{ui("Guardar resolución")}</button>
        </form>}
      </article>)}</div>
      {requests.length===0&&<div className="sc-grade-request-empty"><strong>{ui("Sin solicitudes de corrección")}</strong><p>{ui("Cuando se solicite ajustar una calificación, el seguimiento aparecerá aquí.")}</p></div>}
      {canCreate&&!requests.some(request=>request.status==='pending')&&<form className="sc-grade-request-form" onSubmit={event=>submit(event)}>
        <h3>{ui("Nueva solicitud")}</h3>
        <label>{ui("Calificación propuesta")}<input name="score" type="number" min={0} max={10} step="0.01" required defaultValue={grade.score}/></label>
        <label>{ui("Retroalimentación propuesta")}<textarea name="feedback" defaultValue={grade.feedback||''}/></label>
        <label>{ui("Motivo de solicitud")}<textarea name="reason" required maxLength={2000}/></label>
        <button className="primary" disabled={busy}>{ui("Enviar solicitud")}</button>
      </form>}
    </section></div>}
  </>;
}
