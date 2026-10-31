import {useEffect,useMemo,useRef,useState} from 'react';
import {
 ArrowRight,BookOpenCheck,CalendarCheck2,CalendarClock,CalendarDays,CalendarRange,
 Check,ChevronRight,ClipboardList,FileDown,FilterX,GraduationCap,Info,
 MoreHorizontal,Pencil,Plus,Search,ShieldCheck,Sparkles,Trash2,UsersRound,X
} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import TableAction from '../../shared/components/TableAction';
import TableEmptyState from '../../shared/components/TableEmptyState';

type DetailTab='overview'|'calendar';
type Props={
 items:Row[];events:Row[];
 canCreate:boolean;canEdit:boolean;canDelete:boolean;canPdf:boolean;error?:string;working:boolean;
 onCreate:()=>void;onEdit:(year:Row)=>void;onView:(year:Row,tab?:DetailTab)=>void;
 onDelete:(year:Row)=>void;pdfLink:(year:Row)=>string;
};
const terms=['first','second','third'] as const;
const statusOptions=[
 {value:'draft',label:'En preparación'}, {value:'active',label:'Activo'},
 {value:'closing',label:'En cierre'}, {value:'closed',label:'Cerrado'},
 {value:'archived',label:'Archivado'}
];
const sourceOptions=[
 {value:'manual',label:'Captura manual'}, {value:'sep',label:'SEP federal'},
 {value:'state',label:'Autoridad estatal'}, {value:'school',label:'Plantel'}
];
const kindLabels:Record<string,string>={
 cte:'Consejo Técnico Escolar',suspension:'Suspensión de clases',holiday:'Día festivo',
 vacation:'Vacaciones / receso',evaluation:'Periodo de evaluación',
 report_delivery:'Entrega de boletas',exam:'Examen',meeting:'Reunión',
 activity:'Actividad escolar',administrative:'Actividad administrativa'
};
const datePart=(value:unknown)=>String(value??'').slice(0,10);
const formDate=(value:string|undefined,locale:string)=>value?
 new Date(datePart(value)+'T12:00:00').toLocaleDateString(locale.startsWith('en')?'en-US':'es-MX',
  {day:'numeric',month:'short',year:'numeric'}):'—';
const eventDate=(record:Row)=>datePart(record.starts_at);
const dateState=(from:unknown,to:unknown,today:string)=>{
 if(!from||!to)return 'unknown';
 if(today<datePart(from))return 'upcoming';
 if(today>datePart(to))return 'closed';
 return 'open';
};

export function cycleProgress(year:Row,eventCount:number){
 const checks=[
  Boolean(year.starts_on&&year.ends_on),
  terms.every(term=>Boolean(year[term+'_term_starts_on']&&year[term+'_term_ends_on'])),
  Boolean(year.admissions_open_on&&year.admissions_close_on&&year.reenrollment_open_on&&year.reenrollment_close_on),
  Number(year.planned_school_days)>0,
  eventCount>0
 ];
 return {completed:checks.filter(Boolean).length,total:checks.length,percentage:Math.round(checks.filter(Boolean).length/checks.length*100),
  missing:[
   'Fechas de clases','Tres trimestres','Convocatorias','Días lectivos','Eventos del calendario'
  ].filter((_,index)=>!checks[index])};
}
export function selectCurrentCycle(items:Row[],today:string){
 return [...items].filter(year=>['active','closing'].includes(String(year.status||'active'))&&
  dateState(year.starts_on,year.ends_on,today)==='open')
  .sort((a,b)=>String(b.starts_on||'').localeCompare(String(a.starts_on||'')))[0];
}
export function upcomingYearEvents(items:Row[],yearId:unknown,today:string){
 return items.filter(item=>String(item.academic_year_id)===String(yearId)&&eventDate(item)>=today)
  .sort((a,b)=>String(a.starts_at).localeCompare(String(b.starts_at)));
}
export function filterCycles(items:Row[],filters:{query:string;status:string;source:string;readiness:string;order:string},events:Row[]){
 const counts=new Map<string,number>();
 events.forEach(event=>counts.set(String(event.academic_year_id),(counts.get(String(event.academic_year_id))||0)+1));
 const needle=filters.query.trim().toLocaleLowerCase();
 return items.filter(year=>{
  if(filters.status&&String(year.status||'active')!==filters.status)return false;
  if(filters.source&&String(year.calendar_source||'manual')!==filters.source)return false;
  if(needle&&!String(year.name||'').toLocaleLowerCase().includes(needle))return false;
  const readiness=cycleProgress(year,counts.get(String(year.id))||0);
  return !filters.readiness||(filters.readiness==='complete'?readiness.completed===readiness.total:
   readiness.completed<readiness.total);
 }).sort((a,b)=>filters.order==='oldest'?
  String(a.starts_on||'').localeCompare(String(b.starts_on||'')):
  filters.order==='name'?String(a.name||'').localeCompare(String(b.name||'')):
  String(b.starts_on||'').localeCompare(String(a.starts_on||'')));
}

function CyclePreview({year,events,today,locale,onClose,onView,onEdit,canEdit,canPdf,pdfLink}:{
 year:Row;events:Row[];today:string;locale:string;onClose:()=>void;
 onView:(year:Row,tab?:DetailTab)=>void;onEdit:(year:Row)=>void;canEdit:boolean;canPdf:boolean;
 pdfLink:(year:Row)=>string;
}){
 const {ui}=useSchoolLocale(),closeRef=useRef<HTMLButtonElement>(null);
 const related=events.filter(e=>String(e.academic_year_id)===String(year.id));
 const progress=cycleProgress(year,related.length);
 const upcoming=upcomingYearEvents(events,year.id,today).slice(0,3);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  closeRef.current?.focus();
  function onKey(event:KeyboardEvent){if(event.key==='Escape')onClose();}
  window.addEventListener('keydown',onKey);
  return()=>{window.removeEventListener('keydown',onKey);previous?.focus();};
 },[onClose]);
 return <div className="sc-cycle-preview-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <aside role="dialog" aria-modal="true" aria-labelledby="sc-cycle-preview-title" className="sc-cycle-preview">
   <header className="sc-cycle-preview-head"><div><span>{ui('VISTA RÁPIDA')}</span><h2 id="sc-cycle-preview-title">{year.name}</h2>
    <p>{formDate(year.starts_on,locale)} – {formDate(year.ends_on,locale)}</p></div>
    <button ref={closeRef} type="button" className="sc-cycle-preview-close" onClick={onClose} aria-label={ui('Cerrar vista rápida')}><X size={20}/></button></header>
   <div className="sc-cycle-preview-content">
    <div className="sc-cycle-preview-summary"><span className={'sc-cycle-status status-'+String(year.status||'active')}>
      {ui(statusOptions.find(opt=>opt.value===String(year.status||'active'))?.label||'Activo')}</span>
     <span>{year.planned_school_days?year.planned_school_days+' '+ui('días lectivos'):ui('Días lectivos pendientes')}</span></div>
    <section className="sc-cycle-preview-block"><h3>{ui('Preparación del ciclo')}</h3>
     <div className="sc-cycle-preview-score"><strong>{progress.percentage}%</strong><span>{progress.completed} {ui('de')} {progress.total} {ui('apartados')}</span></div>
     <div className="sc-cycle-progress" role="progressbar" aria-label={ui('Configuración del ciclo')} aria-valuenow={progress.percentage} aria-valuemin={0} aria-valuemax={100}>
      <span style={{width:progress.percentage+'%'}}/></div>
     {progress.missing.length?<div className="sc-cycle-preview-missing"><strong>{ui('Por configurar')}</strong>
      {progress.missing.map(missing=><p key={missing}><Info size={14}/>{ui(missing)}</p>)}</div>:<p className="sc-cycle-preview-ready"><Check size={16}/>{ui('Todos los apartados básicos tienen datos registrados.')}</p>}
    </section>
    <section className="sc-cycle-preview-block"><h3>{ui('Periodos de evaluación')}</h3>
     {terms.map((term,index)=><div className="sc-cycle-preview-term" key={term}><span>{index+1}</span>
      <div><strong>{ui(['Primer trimestre','Segundo trimestre','Tercer trimestre'][index])}</strong>
       <small>{formDate(year[term+'_term_starts_on'],locale)} — {formDate(year[term+'_term_ends_on'],locale)}</small></div>
      {year[term+'_term_starts_on']&&year[term+'_term_ends_on']?<Check size={16}/>:<Info size={16}/>}</div>)}
    </section>
    <section className="sc-cycle-preview-block"><h3>{ui('Próximas fechas')}</h3>
     {upcoming.length?upcoming.map(ev=><div className="sc-cycle-preview-event" key={ev.id}><CalendarDays size={17}/><div>
       <strong>{ev.title}</strong><small>{formDate(ev.starts_at,locale)} · {ui(kindLabels[String(ev.kind)]||'Actividad')}</small>
      </div></div>):<p className="sc-cycle-preview-empty">{ui('No hay eventos próximos registrados para este ciclo.')}</p>}
    </section>
   </div>
   <footer className="sc-cycle-preview-footer">
    <button className="primary" type="button" onClick={()=>onView(year)}><ClipboardList size={16}/>{ui('Ver expediente completo')}</button>
    <button className="secondary" type="button" onClick={()=>onView(year,'calendar')}><CalendarDays size={16}/>{ui('Calendario escolar')}</button>
    <div className="sc-cycle-preview-extra">
     {canEdit&&<button className="secondary" type="button" onClick={()=>onEdit(year)}><Pencil size={15}/>{ui('Editar')}</button>}
     {canPdf&&<a className="secondary sc-cycle-action-link" href={pdfLink(year)}><FileDown size={15}/>{ui('Generar PDF')}</a>}
    </div>
   </footer>
  </aside>
 </div>;
}

export default function SchoolCyclesOverview({items,events,canCreate,canEdit,canDelete,canPdf,error,working,onCreate,onEdit,onView,onDelete,pdfLink}:Props){
 const {ui,locale}=useSchoolLocale();
 const [query,setQuery]=useState(''),[status,setStatus]=useState(''),[source,setSource]=useState('');
 const [readiness,setReadiness]=useState(''),[order,setOrder]=useState('newest');
 const [page,setPage]=useState(0),[pageSize,setPageSize]=useState('10'),[previewId,setPreviewId]=useState<string|null>(null);
 const today=new Date().toLocaleDateString('en-CA');
 const ownedEvents=useMemo(()=>events.filter(event=>items.some(year=>String(year.id)===String(event.academic_year_id))),[events,items]);
 const current=selectCurrentCycle(items,today);
 const totalEvents=ownedEvents.length;
 const admissionsOpen=items.filter(year=>dateState(year.admissions_open_on,year.admissions_close_on,today)==='open').length;
 const upcoming= current?upcomingYearEvents(ownedEvents,current.id,today):[];
 const cycleEvents=current?ownedEvents.filter(e=>String(e.academic_year_id)===String(current.id)):[];
 const activeProgress=current?cycleProgress(current,cycleEvents.length):null;
 const rows=useMemo(()=>filterCycles(items,{query,status,source,readiness,order},ownedEvents),
  [items,query,status,source,readiness,order,ownedEvents]);
 const visible=rows.slice(page*Number(pageSize),(page+1)*Number(pageSize));
 const preview=items.find(year=>String(year.id)===previewId);
 useEffect(()=>setPage(0),[query,status,source,readiness,order,pageSize]);
 const statusName=(year:Row)=>ui(statusOptions.find(opt=>opt.value===String(year.status||'active'))?.label||'Activo');
 const openFull=(year:Row,tab:DetailTab='overview')=>{setPreviewId(null);onView(year,tab);};
 const edit=(year:Row)=>{setPreviewId(null);onEdit(year);};
 const onReset=()=>{setQuery('');setStatus('');setSource('');setReadiness('');setOrder('newest');};
 const hasFilters=Boolean(query||status||source||readiness||order!=='newest');
 return <section className="sc-cycles sc-cycles-overview" aria-label={ui('Ciclos escolares')}>
  <header className="sc-cycles-home-hero">
   <div className="sc-cycles-home-hero-copy">
    <div className="sc-cycle-eyebrow"><span/><span>{ui('ADMINISTRACIÓN ACADÉMICA')}</span></div>
    <h1>{ui('Ciclos escolares')}</h1>
    <p>{ui('Organiza el calendario institucional, los periodos de evaluación y las convocatorias desde un mismo lugar.')}</p>
    <div className="sc-cycle-home-hero-actions">
     {canCreate&&<button type="button" className="primary sc-cycle-create" onClick={onCreate}><Plus size={18}/>{ui('Registrar ciclo escolar')}</button>}
     {current&&<button className="sc-cycle-home-quiet-action" type="button" onClick={()=>openFull(current,'calendar')}><CalendarDays size={16}/>{ui('Ver calendario vigente')}<ArrowRight size={15}/></button>}
    </div>
   </div>
   <div className="sc-cycle-home-art" aria-hidden="true">
    <div className="sc-cycle-art-ring"/>
    <div className="sc-cycle-art-card"><div className="sc-cycle-art-card-top"><span/><span/><span/></div>
     <CalendarDays size={53} strokeWidth={1.35}/>
     <div className="sc-cycle-art-lines"><i/><i/><i/></div></div>
    <div className="sc-cycle-art-spark"><Sparkles size={22}/></div>
    <div className="sc-cycle-art-check"><Check size={23}/></div>
   </div>
  </header>
  <div className="sc-cycle-home-metrics">
   {[
    {title:'Ciclos registrados',value:items.length,description:'Historial académico',icon:BookOpenCheck,tone:'indigo'},
    {title:'Ciclo en curso',value:current?.name||'—',description:current?'Vigencia actual':'Sin ciclo vigente',icon:GraduationCap,tone:'emerald'},
    {title:'Inscripciones abiertas',value:admissionsOpen,description:'Ventanas de nuevo ingreso',icon:UsersRound,tone:'amber'},
    {title:'Eventos escolares',value:totalEvents,description:'Fechas capturadas',icon:CalendarCheck2,tone:'sky'}
   ].map(metric=>{const Icon=metric.icon;return <article className={'sc-cycle-home-metric tone-'+metric.tone} key={metric.title}>
     <div className="sc-cycle-home-metric-icon"><Icon size={20} strokeWidth={1.8}/></div>
     <span>{ui(metric.title)}</span>
     <strong>{metric.value}</strong>
     <small>{ui(metric.description)}</small>
    </article>;})}
  </div>
  {current?<section className="sc-cycle-featured" aria-label={ui('Ciclo escolar vigente')}>
    <div className="sc-cycle-featured-main">
     <div className="sc-cycle-featured-heading"><span className="sc-cycle-featured-mark"><GraduationCap size={17}/></span>
      <span>{ui('CICLO ESCOLAR VIGENTE')}</span><span className="sc-cycle-featured-live"><span/>{ui('En curso')}</span></div>
     <h2>{current.name}</h2>
     <p className="sc-cycle-featured-dates"><CalendarRange size={17}/>{formDate(current.starts_on,locale)} <span>—</span> {formDate(current.ends_on,locale)}</p>
     <div className="sc-cycle-featured-meta">
      <span><BookOpenCheck size={15}/>{terms.filter(t=>current[t+'_term_starts_on']&&current[t+'_term_ends_on']).length}/3 {ui('trimestres')}</span>
      <span><CalendarDays size={15}/>{cycleEvents.length} {ui('eventos')}</span>
      <span><ShieldCheck size={15}/>{current.planned_school_days?current.planned_school_days+' '+ui('días previstos'):ui('Días por definir')}</span>
     </div>
     <div className="sc-cycle-featured-actions">
      <button className="primary" type="button" onClick={()=>openFull(current)}>{ui('Ver expediente')}<ArrowRight size={17}/></button>
      <button className="secondary" type="button" onClick={()=>openFull(current,'calendar')}><CalendarDays size={16}/>{ui('Calendario')}</button>
      {canEdit&&<button className="sc-cycle-featured-link" type="button" onClick={()=>edit(current)}><Pencil size={15}/>{ui('Editar')}</button>}
     </div>
    </div>
    <div className="sc-cycle-featured-aside">
     <div className="sc-cycle-featured-aside-head"><span>{ui('ESTADO DE CONFIGURACIÓN')}</span><strong>{activeProgress?.percentage}%</strong></div>
     <div className="sc-cycle-progress" role="progressbar" aria-label={ui('Configuración del ciclo vigente')}
      aria-valuenow={activeProgress?.percentage||0} aria-valuemin={0} aria-valuemax={100}>
      <span style={{width:(activeProgress?.percentage||0)+'%'}}/></div>
     <p>{activeProgress?.missing.length?ui('Pendientes: ')+activeProgress.missing.slice(0,2).map(x=>ui(x)).join(', '):ui('Apartados básicos completos')}</p>
     <div className="sc-cycle-featured-divider"/>
     <div className="sc-cycle-featured-next"><CalendarClock size={17}/><strong>{ui('Próxima fecha registrada')}</strong></div>
     {upcoming.length?<div className="sc-cycle-featured-event"><span>{formDate(upcoming[0].starts_at,locale)}</span>
       <strong>{upcoming[0].title}</strong><small>{ui(kindLabels[String(upcoming[0].kind)]||'Evento escolar')}</small></div>:
      <p className="sc-cycle-featured-none">{ui('No hay próximos eventos registrados.')}</p>}
    </div>
   </section>:<section className="sc-cycle-featured sc-cycle-featured-empty">
    <div className="sc-cycle-featured-main">
     <div className="sc-cycle-featured-heading"><span className="sc-cycle-featured-mark"><GraduationCap size={17}/></span>
      <span>{ui('CENTRO DE PLANEACIÓN ACADÉMICA')}</span></div>
     <h2>{ui('Sin ciclo vigente')}</h2>
     <p>{ui('El ciclo activo debe tener una vigencia que incluya la fecha actual. Puedes consultar los ciclos históricos o preparar el siguiente.')}</p>
     {canCreate&&<button className="primary" type="button" onClick={onCreate}><Plus size={17}/>{ui('Registrar ciclo escolar')}</button>}
    </div>
    <div className="sc-cycle-featured-aside"><CalendarClock size={27}/><strong>{ui('Planifica con anticipación')}</strong>
     <p>{ui('Registra trimestres, fechas lectivas y eventos para habilitar el seguimiento académico.')}</p></div>
   </section>}
  <section className="sc-cycles-workspace sc-cycle-home-workspace">
   <div className="sc-cycles-heading sc-cycle-home-list-heading"><div><div className="sc-cycle-section-eyebrow">{ui('GESTIÓN E HISTORIAL')}</div>
    <h2>{ui('Todos los ciclos escolares')}</h2><p>{ui('Consulta su configuración, revisa las convocatorias y accede a cada expediente.')}</p></div>
    <span className="sc-cycle-home-total">{rows.length} {ui('resultados')}</span>
   </div>
   <div className="sc-cycle-home-filterbar" role="search" aria-label={ui('Filtros de ciclos escolares')}>
    <label className="sc-cycles-search"><Search size={17}/><input type="search"
     aria-label={ui('Buscar ciclo escolar')} placeholder={ui('Buscar ciclo escolar…')}
     value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="sc-cycle-filter"><span>{ui('Estado')}</span>
     <Combobox label={ui('Filtrar por estado')} value={status} onChange={setStatus} searchable={false}
      options={statusOptions.map(x=>({...x,label:ui(x.label)}))} placeholder={ui('Todos los estados')}/></div>
    <div className="sc-cycle-filter"><span>{ui('Origen')}</span>
     <Combobox label={ui('Filtrar por origen')} value={source} onChange={setSource} searchable={false}
      options={sourceOptions.map(x=>({...x,label:ui(x.label)}))} placeholder={ui('Todos los orígenes')}/></div>
    <div className="sc-cycle-filter"><span>{ui('Configuración')}</span>
     <Combobox label={ui('Filtrar por configuración')} value={readiness} onChange={setReadiness} searchable={false}
      options={[{value:'complete',label:ui('Completa')},{value:'pending',label:ui('Por completar')}]} placeholder={ui('Todos')}/></div>
   </div>
   <div className="sc-cycle-home-tablemeta">
    <div className="sc-cycle-home-meta-left"><span>{rows.length} {ui('ciclos encontrados')}</span>
     {hasFilters&&<button className="sc-cycle-reset" type="button" onClick={onReset}><FilterX size={15}/>{ui('Limpiar filtros')}</button>}</div>
    <div className="sc-cycle-home-sort"><span>{ui('Ordenar')}</span><Combobox label={ui('Orden de ciclos')} value={order} onChange={setOrder} searchable={false}
     options={[{value:'newest',label:ui('Más recientes')},{value:'oldest',label:ui('Más antiguos')},{value:'name',label:ui('Por nombre')}]} /></div>
   </div>
   {error?<TableEmptyState mode="error" description={error}/>:
    rows.length?<div className="sc-cycle-table-wrap sc-cycle-home-table-wrap"><table className="sc-cycle-table sc-cycle-home-table"><thead><tr>
      <th>{ui('Ciclo escolar')}</th><th>{ui('Vigencia')}</th><th>{ui('Estado')}</th>
      <th>{ui('Evaluaciones')}</th><th>{ui('Convocatorias')}</th><th>{ui('Calendario')}</th><th>{ui('Acciones')}</th>
     </tr></thead><tbody>{visible.map(year=>{
      const related=ownedEvents.filter(ev=>String(ev.academic_year_id)===String(year.id));
      const progress=cycleProgress(year,related.length);
      const termCount=terms.filter(t=>year[t+'_term_starts_on']&&year[t+'_term_ends_on']).length;
      const admissionState=dateState(year.admissions_open_on,year.admissions_close_on,today);
      const reenrollState=dateState(year.reenrollment_open_on,year.reenrollment_close_on,today);
      const future=upcomingYearEvents(ownedEvents,year.id,today);
      return <tr key={year.id}>
       <td className="sc-cycle-name-cell"><button type="button" className="sc-cycle-name-button"
        onClick={()=>setPreviewId(String(year.id))} aria-label={ui('Vista rápida del ciclo ')+year.name}>
        <span className="sc-cycle-name-icon"><CalendarDays size={19}/></span><span>
         <strong>{year.name}</strong><small>{year.planned_school_days?year.planned_school_days+' '+ui('días lectivos'):ui('Días lectivos sin registrar')}</small>
        </span><ChevronRight className="sc-cycle-name-arrow" size={15}/></button></td>
       <td className="sc-cycle-period-cell"><strong>{formDate(year.starts_on,locale)}</strong>
        <small>{ui('al')} {formDate(year.ends_on,locale)}</small></td>
       <td><span className={'sc-cycle-status status-'+String(year.status||'active')}>{statusName(year)}</span></td>
       <td><div className="sc-cycle-term-cell"><div className="sc-cycle-term-bars" aria-label={termCount+' '+ui('de 3 trimestres configurados')}>
        {terms.map(t=><span key={t} className={year[t+'_term_starts_on']&&year[t+'_term_ends_on']?'is-ready':''}/>)}</div>
        <strong>{termCount}/3 {ui('trimestres')}</strong>
        <small className={progress.completed<progress.total?'is-pending':''}>{progress.completed===progress.total?ui('Configuración básica completa'):ui('Pendiente de configuración')}</small></div></td>
       <td><div className="sc-cycle-window-states">
        <span><i className={'sc-cycle-state-dot state-'+admissionState}/>{ui('Ingreso')}: {ui(admissionState==='open'?'Abierta':admissionState==='upcoming'?'Próxima':admissionState==='closed'?'Cerrada':'Sin fechas')}</span>
        <span><i className={'sc-cycle-state-dot state-'+reenrollState}/>{ui('Reinscripción')}: {ui(reenrollState==='open'?'Abierta':reenrollState==='upcoming'?'Próxima':reenrollState==='closed'?'Cerrada':'Sin fechas')}</span>
       </div></td>
       <td><div className="sc-cycle-calendar-cell"><strong><CalendarDays size={15}/>{related.length} {ui('eventos')}</strong>
        <small>{future.length?ui('Próximo: ')+formDate(future[0].starts_at,locale):ui('Sin eventos próximos')}</small></div></td>
       <td><div className="sc-cycle-home-row-actions">
        <TableAction kind="view" ariaLabel={ui('Ver expediente de ')+year.name} onClick={()=>openFull(year)}/>
        {canEdit&&<TableAction kind="edit" ariaLabel={ui('Editar ciclo ')+year.name} onClick={()=>edit(year)}/>}
        {(canPdf||canDelete)&&<details className="sc-cycle-row-more">
         <summary aria-label={ui('Más acciones de ')+year.name} title={ui('Más acciones')}><MoreHorizontal size={19}/></summary>
         <div className="sc-cycle-row-menu">
          {canPdf&&<a href={pdfLink(year)}><FileDown size={16}/>{ui('Generar PDF')}</a>}
          {canDelete&&<button type="button" className="danger" disabled={working} onClick={()=>onDelete(year)}><Trash2 size={16}/>{ui('Eliminar ciclo')}</button>}
         </div></details>}</div></td>
      </tr>;
     })}</tbody></table></div>:
    <div className="sc-cycle-home-empty"><div className="sc-cycle-home-empty-icon"><CalendarDays size={27}/></div>
      <h3>{ui(hasFilters?'Sin resultados':'Todavía no hay ciclos escolares')}</h3>
      <p>{ui(hasFilters?'Prueba con otros filtros para encontrar un ciclo.':'Registra el primer ciclo para organizar fechas, periodos de evaluación y convocatorias.')}</p>
      {hasFilters?<button type="button" className="secondary" onClick={onReset}>{ui('Restablecer filtros')}</button>:
       canCreate&&<button type="button" className="primary" onClick={onCreate}><Plus size={17}/>{ui('Registrar primer ciclo')}</button>}</div>}
   {rows.length>0&&<footer className="sc-cycle-pagination sc-cycle-home-pagination">
    <div><span>{ui('Mostrar')}</span><Combobox label={ui('Filas por página')} value={pageSize} onChange={setPageSize}
     options={['10','20','50'].map(n=>({value:n,label:n}))} searchable={false}/><span>{ui('por página')}</span></div>
    <div><span>{page*Number(pageSize)+1}–{Math.min((page+1)*Number(pageSize),rows.length)} {ui('de')} {rows.length}</span>
     <button type="button" className="secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>{ui('Anterior')}</button>
     <button type="button" className="secondary" disabled={(page+1)*Number(pageSize)>=rows.length} onClick={()=>setPage(p=>p+1)}>{ui('Siguiente')}</button></div>
   </footer>}
  </section>
  {preview&&<CyclePreview key={String(preview.id)} year={preview} events={ownedEvents} today={today} locale={locale}
   onClose={()=>setPreviewId(null)} onView={openFull} onEdit={edit} canEdit={canEdit} canPdf={canPdf} pdfLink={pdfLink}/>}
 </section>;
}
