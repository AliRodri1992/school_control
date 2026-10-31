import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,CalendarDays,CheckCircle2,ClipboardList,FileDown,GraduationCap,Info,Plus,Search,Save,ShieldCheck,Users,X} from 'lucide-react';
import SchoolCyclesOverview from './SchoolCyclesOverview';
import type {Row} from '../../modules';
import {api} from '../../api';
import {confirmDanger,notify} from '../../notifications';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import TableAction from '../../shared/components/TableAction';
import TableEmptyState from '../../shared/components/TableEmptyState';
import CycleForm from './CycleForm';

export function windowState(from?:string,to?:string,today=new Date().toISOString().slice(0,10)):'upcoming'|'open'|'closed'|'unknown'{
 if(!from||!to)return 'unknown';
 if(today<from)return 'upcoming';
 if(today>to)return 'closed';
 return 'open';
}
export function schoolYearStats(items:Row[],today:string){
 return {total:items.length,admissions:items.filter(x=>windowState(x.admissions_open_on,x.admissions_close_on,today)==='open').length,
 reenrollments:items.filter(x=>windowState(x.reenrollment_open_on,x.reenrollment_close_on,today)==='open').length,
 upcoming:items.filter(x=>windowState(x.admissions_open_on,x.admissions_close_on,today)==='upcoming'||windowState(x.reenrollment_open_on,x.reenrollment_close_on,today)==='upcoming').length};
}
const statusOptions=[{value:'draft',label:'En preparación'},{value:'active',label:'Activo'},
 {value:'closing',label:'En cierre'},{value:'closed',label:'Cerrado'},{value:'archived',label:'Archivado'}];
export const eventKinds=[{value:'suspension',label:'Suspensión de clases'},{value:'holiday',label:'Día festivo'},
 {value:'cte',label:'Consejo Técnico Escolar'},{value:'vacation',label:'Vacaciones / receso'},
 {value:'evaluation',label:'Periodo de evaluación'},{value:'report_delivery',label:'Entrega de boletas'},
 {value:'administrative',label:'Actividad administrativa'},{value:'exam',label:'Examen'},
 {value:'meeting',label:'Reunión'},{value:'activity',label:'Actividad escolar'}];
const sourceOptions=[{value:'manual',label:'Captura manual'},{value:'sep',label:'SEP federal'},
 {value:'state',label:'Autoridad estatal'},{value:'school',label:'Plantel'}];
const datePart=(value:unknown)=>String(value||'').slice(0,10);
const localDatetime=(value:unknown)=>String(value||'').slice(0,16);
const nextDay=(date:string)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
const previousDay=(date:string)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);};
export function eventDatePayload(data:{allDay:boolean;start:string;end:string}){
 if(!data.start||!data.end)throw new Error('Selecciona las fechas de inicio y fin del evento.');
 if(data.start>data.end)throw new Error('La fecha final debe ser igual o posterior al inicio.');
 return data.allDay?{starts_at:data.start+'T00:00:00',ends_at:nextDay(data.end)+'T00:00:00'}:
  {starts_at:data.start,ends_at:data.end};
}
type Props={items:Row[];events?:Row[];onSave:(data:Row,existing?:Row|null)=>Promise<void>;
 canCreate:boolean;canEdit:boolean;canDelete?:boolean;canPdf?:boolean;canManageEvents?:boolean;onRefresh?:()=>Promise<void>;error?:string};
function CycleEventForm({cycleId,existing,onClose,onSaved}:{cycleId:number;existing?:Row|null;onClose:()=>void;onSaved:()=>Promise<void>}){
 const {ui}=useSchoolLocale();
 const [kind,setKind]=useState(String(existing?.kind||'suspension'));
 const [title,setTitle]=useState(String(existing?.title||''));
 const [description,setDescription]=useState(String(existing?.description||''));
 const [source,setSource]=useState(String(existing?.source_type||'manual'));
 const [sourceUrl,setSourceUrl]=useState(String(existing?.source_url||''));
 const [sourceReference,setSourceReference]=useState(String(existing?.source_reference||''));
 const [official,setOfficial]=useState(Boolean(existing?.official));
 const [allDay,setAllDay]=useState(existing?.all_day!==false);
 const [start,setStart]=useState(existing?.all_day!==false?datePart(existing?.starts_at):localDatetime(existing?.starts_at));
 const [end,setEnd]=useState(existing?.all_day!==false?(existing?.ends_at?previousDay(datePart(existing.ends_at)):''):localDatetime(existing?.ends_at));
 const [error,setError]=useState(''),[saving,setSaving]=useState(false);
 async function submit(event:FormEvent){
  event.preventDefault();if(saving)return;
  if(!title.trim()){setError('Título del evento no puede estar vacío.');return;}
  try{
   const dates=eventDatePayload({allDay,start,end});
   setSaving(true);setError('');
   await api(existing?.id?'calendar_events/'+existing.id:'calendar_events',existing?.id?'PATCH':'POST',{
    academic_year_id:cycleId,title:title.trim(),kind,description:description.trim()||null,all_day:allDay,
    official,source_type:source,source_url:sourceUrl.trim()||null,source_reference:sourceReference.trim()||null,...dates});
   await onSaved();void notify(existing?'Evento actualizado correctamente.':'Evento registrado correctamente.');onClose();
  }catch(cause){setError((cause as Error).message);}finally{setSaving(false);}
 }
 return <form className="sc-cycle-event-form" onSubmit={e=>void submit(e)} noValidate>
  <header><div><strong>{ui(existing?'Editar evento':'Registrar fecha o evento')}</strong><p>{ui('Captura fechas oficiales o internas. Esta opción no importa información de la SEP.')}</p></div>
   <button type="button" className="secondary" aria-label={ui('Cerrar formulario de evento')} onClick={onClose}><X size={16}/></button></header>
  <div className="sc-cycle-event-fields">
   <label className="sc-cycle-event-wide">{ui('Título del evento')}<input value={title} maxLength={200} onChange={e=>setTitle(e.target.value)} placeholder="Consejo Técnico Escolar"/></label>
   <label>{ui('Tipo de evento')}<Combobox label={ui('Tipo de evento')} value={kind} onChange={setKind} options={eventKinds.map(x=>({...x,label:ui(x.label)}))} searchable={false}/></label>
   <label>{ui('Origen')}<Combobox label={ui('Origen')} value={source} onChange={setSource} options={sourceOptions.map(x=>({...x,label:ui(x.label)}))} searchable={false}/></label>
   <label className="sc-cycle-event-check"><input type="checkbox" checked={allDay} onChange={e=>{setAllDay(e.target.checked);setStart('');setEnd('');}}/>{ui('Evento de día completo')}</label>
   <label className="sc-cycle-event-check"><input type="checkbox" checked={official} onChange={e=>setOfficial(e.target.checked)}/>{ui('Fecha oficial verificada')}</label>
   <label>{ui('Inicio')}<input type={allDay?'date':'datetime-local'} value={start} onChange={e=>setStart(e.target.value)}/></label>
   <label>{ui(allDay?'Último día incluido':'Fin')}<input type={allDay?'date':'datetime-local'} value={end} onChange={e=>setEnd(e.target.value)}/></label>
   <label>{ui('Referencia de la fuente')}<input value={sourceReference} maxLength={255} onChange={e=>setSourceReference(e.target.value)}/></label>
   <label>{ui('URL de la fuente')}<input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://..."/></label>
   <label className="sc-cycle-event-wide">{ui('Observaciones')}<textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)}/></label>
  </div>
  {error&&<p role="alert" className="sc-cycle-form-error">{error}</p>}
  <footer><button type="button" className="secondary" disabled={saving} onClick={onClose}>{ui('Cancelar')}</button>
   <button type="submit" className="primary" disabled={saving}><Save size={16}/>{saving?ui('Guardando…'):ui('Guardar evento')}</button></footer>
 </form>;
}
export default function SchoolCycles({items,events=[],onSave,canCreate,canEdit,canDelete=false,canPdf=false,canManageEvents=false,onRefresh,error}:Props){
 const {ui,locale}=useSchoolLocale();
 const [editor,setEditor]=useState<Row|null|false>(false),[selectedId,setSelectedId]=useState<string|null>(null);
 const [detailTab,setDetailTab]=useState<'overview'|'calendar'>('overview'),[eventEditor,setEventEditor]=useState<Row|null|false>(false);
 const [lifecycle,setLifecycle]=useState<Row|null>(null);
 const [eventQuery,setEventQuery]=useState(''),[operationError,setOperationError]=useState(''),[working,setWorking]=useState(false);
 const selected=items.find(x=>String(x.id)===selectedId);
 useEffect(()=>{
  if(!selectedId){setLifecycle(null);return;}
  let alive=true;
  setLifecycle(null);
  void api('academic_years/'+selectedId).then(record=>{if(alive)setLifecycle(record.lifecycle||null);})
   .catch(()=>{if(alive)setLifecycle(null);});
  return()=>{alive=false;};
 },[selectedId,items]);
 const format=(date?:string)=>date?new Date(datePart(date)+'T12:00:00').toLocaleDateString(locale.startsWith('en')?'en-US':'es-MX',{day:'numeric',month:'short',year:'numeric'}):ui('Sin configurar');
 const statusLabel=(value?:string)=>ui(statusOptions.find(s=>s.value===(value||'draft'))?.label||'Sin estado');
 const linkedEvents=events.filter(x=>String(x.academic_year_id)===selectedId)
  .filter(x=>[x.title,x.kind,x.source_reference].some(value=>String(value||'').toLocaleLowerCase().includes(eventQuery.toLocaleLowerCase())))
  .sort((a,b)=>String(a.starts_at).localeCompare(String(b.starts_at)));
 async function removeCycle(item:Row){
  if(working)return;
  const accepted=await confirmDanger(ui('¿Eliminar ciclo escolar '+item.name+'?'),
   ui('Solo es posible eliminarlo si no tiene grupos, inscripciones, evaluaciones o eventos relacionados. Esta acción no se puede deshacer.'),ui('Eliminar ciclo'));
  if(!accepted)return;
  setWorking(true);setOperationError('');
  try{await api('academic_years/'+item.id,'DELETE');await onRefresh?.();void notify('Ciclo escolar eliminado.');if(selectedId===String(item.id))setSelectedId(null);}
  catch(cause){setOperationError((cause as Error).message);void notify((cause as Error).message,'error');}
  finally{setWorking(false);}
 }
 async function removeEvent(item:Row){
  if(working)return;
  const accepted=await confirmDanger(ui('¿Eliminar evento?'),String(item.title)+' · '+format(item.starts_at),ui('Eliminar evento'));
  if(!accepted)return;
  setWorking(true);setOperationError('');
  try{await api('calendar_events/'+item.id,'DELETE');await onRefresh?.();void notify('Evento eliminado correctamente.');}
  catch(cause){setOperationError((cause as Error).message);void notify((cause as Error).message,'error');}
  finally{setWorking(false);}
 }
 const pdfLink=(item:Row)=>'/api/academic_years/'+item.id+'/pdf';
 if(editor!==false)return <CycleForm key={editor?.id||'new'} initial={editor||undefined} onCancel={()=>setEditor(false)}
   onSave={async values=>{await onSave(values,editor||null);setEditor(false);}}/>;
 const summary=(label:string,value?:string)=><div className="sc-cycle-info-pair"><span>{ui(label)}</span><strong>{value||'—'}</strong></div>;
 if(selected)return <section className="sc-cycles sc-cycle-detail">
  <button type="button" className="sc-cycle-form-back" onClick={()=>{setSelectedId(null);setEventEditor(false);setOperationError('');}}><ArrowLeft size={17}/>{ui('Volver al listado')}</button>
  <header className="sc-cycle-detail-hero"><div><span>{ui('EXPEDIENTE DEL CICLO ESCOLAR')}</span>
   <h2>{selected.name}</h2><p>{format(selected.starts_on)} — {format(selected.ends_on)} · {statusLabel(selected.status)}</p></div>
   <div className="sc-cycle-detail-actions">{canPdf&&<a className="secondary sc-cycle-action-link" href={pdfLink(selected)}><FileDown size={17}/>{ui('Generar PDF')}</a>}
    {canEdit&&!['closed','archived'].includes(String(selected.status))&&<button className="primary" type="button" onClick={()=>setEditor(selected)}>{ui('Editar ciclo')}</button>}</div></header>
  <div className="sc-cycle-detail-tabs" role="tablist" aria-label={ui('Información del ciclo')}>
   <button type="button" role="tab" aria-selected={detailTab==='overview'} className={detailTab==='overview'?'active':''} onClick={()=>setDetailTab('overview')}><ClipboardList size={17}/>{ui('Resumen y evaluaciones')}</button>
   <button type="button" role="tab" aria-selected={detailTab==='calendar'} className={detailTab==='calendar'?'active':''} onClick={()=>setDetailTab('calendar')}><CalendarDays size={17}/>{ui('Calendario y eventos')} <span>{events.filter(x=>String(x.academic_year_id)===selectedId).length}</span></button>
  </div>
  {operationError&&<p className="sc-cycle-form-general-error" role="alert">{operationError}</p>}
  {detailTab==='overview'?<div className="sc-cycle-detail-grid">
    <article className="sc-cycle-detail-panel"><h3><GraduationCap size={19}/>{ui('Datos generales')}</h3>
     <div className="sc-cycle-detail-facts">{summary('Inicio de clases',format(selected.starts_on))}{summary('Fin de clases',format(selected.ends_on))}
      {summary('Días lectivos previstos',selected.planned_school_days?String(selected.planned_school_days):undefined)}
      {summary('Estado automático',statusLabel(selected.status))}{summary('Cierre administrativo',format(selected.administrative_closes_on))}
      {summary('Archivo histórico',format(selected.archive_on))}</div></article>
    <article className="sc-cycle-detail-panel sc-cycle-detail-wide sc-cycle-lifecycle">
     <h3><ShieldCheck size={19}/>{ui('Ciclo de vida y verificaciones')}</h3>
     <p>{ui('El estatus avanza automáticamente. Las inscripciones del siguiente ciclo pueden abrir durante su preparación.')}</p>
     {lifecycle?<div><div className="sc-cycle-detail-facts">
       {summary('Estado actual',statusLabel(lifecycle.status))}
       {summary('Siguiente estado',lifecycle.next_status?statusLabel(lifecycle.next_status):'Estado final')}
       {summary('Fecha prevista de transición',format(lifecycle.due_on))}</div>
      <div className="sc-cycle-lifecycle-checks">{(lifecycle.critical||[]).map((check:Row)=><div key={check.key} className="sc-cycle-lifecycle-check">
       <CheckCircle2 size={16} color={check.ok?'#15803d':check.blocking?'#b45309':'#64748b'}/>
       <span>{check.label}</span><strong>{check.ok?'Cumplido':check.blocking?'Bloqueante':'Advertencia'}</strong>
      </div>)}</div>
      {!!lifecycle.transitions?.length&&<div className="sc-cycle-lifecycle-history"><h4>{ui('Historial de transiciones')}</h4>
       {lifecycle.transitions.map((transition:Row,index:number)=><p key={index}><strong>{statusLabel(transition.from_status)} → {statusLabel(transition.to_status)}</strong>
        {' · '+format(transition.occurred_at)} · {transition.reason}</p>)}</div>}
     </div>:<p>{ui('Consultando verificaciones del ciclo…')}</p>}
    </article>
    <article className="sc-cycle-detail-panel"><h3><Users size={19}/>{ui('Convocatorias')}</h3>
     <div className="sc-cycle-detail-facts">{summary('Nuevo ingreso',format(selected.admissions_open_on)+' – '+format(selected.admissions_close_on))}
      {summary('Reinscripciones',format(selected.reenrollment_open_on)+' – '+format(selected.reenrollment_close_on))}</div></article>
    <article className="sc-cycle-detail-panel sc-cycle-detail-wide"><h3><ClipboardList size={19}/>{ui('Evaluación trimestral')}</h3>
     <div className="sc-cycle-trimester-grid">{(['first','second','third'] as const).map((term,index)=><section key={term} className="sc-cycle-trimester">
      <h4>{ui(['Primer','Segundo','Tercer'][index]+' trimestre')}</h4>
      {summary('Periodo',format(selected[term+'_term_starts_on'])+' – '+format(selected[term+'_term_ends_on']))}
      {summary('Captura',format(selected[term+'_term_capture_opens_on'])+' – '+format(selected[term+'_term_capture_closes_on']))}
      {summary('Revisión',format(selected[term+'_term_review_on']))}
      {summary('Entrega de boletas',format(selected[term+'_term_reports_on']))}
     </section>)}</div></article>
    <article className="sc-cycle-detail-panel sc-cycle-detail-wide"><h3><ShieldCheck size={19}/>{ui('Procedencia y observaciones')}</h3>
     <div className="sc-cycle-detail-facts">{summary('Origen',sourceOptions.find(x=>x.value===selected.calendar_source)?.label||'Captura manual')}
      {summary('Referencia',selected.calendar_source_reference)}
      {summary('Publicación',format(selected.calendar_published_on))}</div>
     {selected.calendar_source_url&&<p className="sc-cycle-source-link"><a target="_blank" rel="noopener noreferrer" href={String(selected.calendar_source_url)}>{ui('Consultar fuente del calendario')}</a></p>}
     {selected.notes&&<p className="sc-cycle-detail-notes">{selected.notes}</p>}</article>
    {canDelete&&!['closed','archived'].includes(String(selected.status))&&<div className="sc-cycle-delete-zone"><Info size={17}/><span>{ui('Los ciclos con información académica vinculada no pueden eliminarse.')}</span>
      <button type="button" className="secondary" disabled={working} onClick={()=>void removeCycle(selected)}>{ui('Eliminar ciclo')}</button></div>}
   </div>:<div className="sc-cycle-detail-panel sc-cycle-events-panel">
    <div className="sc-cycle-events-heading"><div><h3>{ui('Fechas y eventos del calendario')}</h3><p>{ui('Registra suspensiones, vacaciones, sesiones de CTE y actividades. Sin importador automático.')}</p></div>
     {canManageEvents&&!['closed','archived'].includes(String(selected.status))&&<button type="button" className="primary" onClick={()=>setEventEditor(null)}><Plus size={17}/>{ui('Registrar evento')}</button>}</div>
    <div className="sc-cycle-events-note"><Info size={17}/>{ui('Los eventos oficiales deben capturarse conforme a las publicaciones vigentes de las autoridades educativas.')}</div>
    {eventEditor!==false&&canManageEvents&&!['closed','archived'].includes(String(selected.status))&&<CycleEventForm key={eventEditor?.id||'new-event'} cycleId={Number(selected.id)}
       existing={eventEditor||undefined} onClose={()=>setEventEditor(false)} onSaved={async()=>{await onRefresh?.();}}/>}
    <label className="sc-cycles-search"><Search size={17}/><input aria-label={ui('Buscar evento del calendario')}
     placeholder={ui('Buscar por fecha, concepto o fuente…')} value={eventQuery} onChange={e=>setEventQuery(e.target.value)}/></label>
    {linkedEvents.length?<div className="sc-cycle-table-wrap"><table className="sc-cycle-table"><thead><tr>
     <th>{ui('Fecha')}</th><th>{ui('Evento')}</th><th>{ui('Tipo')}</th><th>{ui('Procedencia')}</th><th>{ui('Acciones')}</th>
    </tr></thead><tbody>{linkedEvents.map(event=><tr key={event.id}>
     <td>{format(event.starts_at)}{datePart(event.ends_at)&&event.all_day&&nextDay(datePart(event.starts_at))!==datePart(event.ends_at)?' – '+format(previousDay(datePart(event.ends_at))):''}</td>
     <td><strong>{event.title}</strong>{event.description&&<small>{event.description}</small>}</td>
     <td>{ui(eventKinds.find(k=>k.value===event.kind)?.label||event.kind)}</td>
     <td><span className="sc-cycle-source-tag">{ui(sourceOptions.find(s=>s.value===event.source_type)?.label||'Manual')}</span>{event.official&&<small>{ui('Oficial')}</small>}</td>
     <td className="sc-cycle-row-actions">{canManageEvents&&!['closed','archived'].includes(String(selected.status))&&<><TableAction kind="edit" ariaLabel={ui('Editar '+event.title)} onClick={()=>setEventEditor(event)}/>
      <TableAction kind="delete" ariaLabel={ui('Eliminar '+event.title)} disabled={working} onClick={()=>void removeEvent(event)}/></>}</td>
    </tr>)}</tbody></table></div>:<TableEmptyState mode={eventQuery?'filtered':'empty'} canCreate={canManageEvents}/>}
   </div>}
 </section>;
 return <SchoolCyclesOverview items={items} events={events} error={error} working={working}
  canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canPdf={canPdf}
  onCreate={()=>setEditor(null)} onEdit={year=>setEditor(year)}
  onView={(year,tab='overview')=>{setSelectedId(String(year.id));setDetailTab(tab);setOperationError('');}}
  onDelete={year=>void removeCycle(year)} pdfLink={pdfLink}/>;
}
