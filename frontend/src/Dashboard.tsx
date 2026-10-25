import {useSchoolLocale} from './shared/i18n/LocaleContext';
import Combobox from './shared/components/Combobox';
import {useEffect, useRef, useState} from 'react';
import {RotateCcw,Save,SlidersHorizontal} from 'lucide-react';
import {Responsive, WidthProvider} from 'react-grid-layout/legacy';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import {api} from './api';
import {notify} from './notifications';
import {appendWidget, removeWidget, defaultConfig, widgetKinds, isMetricKind, isAnalyticChartKind, allowedChartKinds, mergeGridLayouts, upgradeSavedDashboardConfig, columns, type Config, type Kind, type DashboardRole} from './dashboardConfig';
import DashboardChart from './DashboardChart';
import DashboardMetricCard from './DashboardMetricCard';
import DashboardEmptyState from './DashboardEmptyState';
import type {Row} from './modules';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
const Grid = WidthProvider(Responsive);
const statusLabels: Record<string,string> = {present:'Presente',absent:'Ausente',late:'Retardo',excused:'Justificada',submitted:'Enviada',approved:'Aprobada',rejected:'Rechazada'};
export default function Dashboard({summary,data,role='admin',userId=0,selectedChildId=''}:{summary:Row;data:Record<string,Row[]>;role?:DashboardRole;userId?:number;selectedChildId?:string}) {
 const {ui,locale}=useSchoolLocale();
 const [filterGroup,setFilterGroup]=useState('');
 const [period,setPeriod]=useState('180'),[academicYear,setAcademicYear]=useState('');
 const [chartLoading,setChartLoading]=useState(false);
 const [visibleSummary,setVisibleSummary]=useState<Row>(summary);
 const yearOptions:Array<{id:number;name:string}>=Array.isArray(visibleSummary?.available_years)?visibleSummary.available_years:[];
 const [config,setConfig] = useState<Config>(()=>defaultConfig(role));
 const [version,setVersion] = useState<number|null>(null);
 const [ready,setReady] = useState(false),[editing,setEditing] = useState(false),[saving,setSaving] = useState(false);
 const [error,setError] = useState(''),[kind,setKind] = useState<Kind>('attendance_chart'),[title,setTitle] = useState('');
 const [restored,setRestored]=useState(false),[gridRevision,setGridRevision]=useState(0);
 const [analyticsRecovered,setAnalyticsRecovered]=useState(false);
 const preventProgrammaticLayoutChange=useRef(false);
 const initialSummaryLoaded=useRef(false);
 useEffect(()=>{let active=true;setVisibleSummary(summary);return()=>{active=false;};},[summary]);
 useEffect(()=>{setAcademicYear('');},[selectedChildId,role,userId]);
 useEffect(()=>{
  // The portal snapshot already contains the unfiltered summary; refetch only after a filter change.
  if(!initialSummaryLoaded.current){initialSummaryLoaded.current=true;if(!selectedChildId)return;}
  let active=true;
  const end=new Date(),start=new Date(end);
  start.setDate(end.getDate()-Number(period)+1);
  const iso=(date:Date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const search=new URLSearchParams({from:iso(start),to:iso(end)});
  if(filterGroup)search.set('group_id',filterGroup);
  if(academicYear)search.set('academic_year_id',academicYear);
  if(selectedChildId)search.set('student_id',selectedChildId);
  setChartLoading(true);
  void api('dashboard?'+search.toString()).then(result=>{
   if(active){setVisibleSummary(result);setError('');}
  }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setChartLoading(false);});
  return()=>{active=false;};
 },[filterGroup,academicYear,period,selectedChildId,role,userId]);
 useEffect(()=>{
  let active=true;
  setReady(false);
  setEditing(false);
  setRestored(false);
  setAnalyticsRecovered(false);
  setError('');
  void api('dashboard_preference').then(result=>{
   if(!active)return;
   const saved=result.configuration as Config|null;
   const upgraded=saved?upgradeSavedDashboardConfig(saved,role):defaultConfig(role);
   const recovered=Boolean(saved&&upgraded.widgets.some(widget=>
    !saved.widgets.some(previous=>previous.kind===widget.kind)));
   setConfig(upgraded);
   setAnalyticsRecovered(recovered);
   setVersion(result.lock_version);
   setReady(true);
  }).catch(e=>{if(active)setError((e as Error).message);});
  return()=>{active=false;};
 },[role,userId]);
 async function save(){
  setSaving(true);setError('');
  try{
   const result=await api('dashboard_preference','PUT',{configuration:config,lock_version:version});
   setVersion(result.lock_version);
   preventProgrammaticLayoutChange.current=false;
   setEditing(false);
   setRestored(false);
   setAnalyticsRecovered(false);
   void notify('Dashboard guardado correctamente.');
  }catch(e){setError((e as Error).message);}
  finally{setSaving(false);}
 }
 function restoreTemplate(){
  preventProgrammaticLayoutChange.current=true;
  setConfig(defaultConfig(role));
  setGridRevision(n=>n+1);
  setRestored(true);
  setAnalyticsRecovered(false);
  setTitle('');
  setKind('attendance_chart');
  setError('');
 }
 function updateWidgets(next:(current:Config)=>Config){
  preventProgrammaticLayoutChange.current=false;
  setRestored(false);
  setConfig(next);
 }
 function content(widget: Config['widgets'][number]) {
  if(isAnalyticChartKind(widget.kind))return <DashboardChart kind={widget.kind}
   data={visibleSummary[widget.kind]} title={ui(widget.title)} translate={ui} role={role}/>;
  if(widget.kind.endsWith('_chart')) {
   const values=visibleSummary[widget.kind];
   const entries=Object.entries(values&&typeof values==='object'&&!Array.isArray(values)?values:{}).map(([name,value])=>{
    const number=Number(value);
    return {name:ui(statusLabels[name]||name),value:Number.isFinite(number)&&number>=0?number:0};
   });
   if(widget.kind==='attendance_chart'&&!entries.some(entry=>entry.value>0)){
    return <DashboardEmptyState kind="attendance" role={role} translate={ui}/>;
   }
   return entries.length?<><div className="widget-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={entries}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" name={ui("Registros")} fill="#405CF5" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><p className="chart-description">{entries.map(e=>`${e.name}: ${e.value}`).join(' · ')}</p></>:<p>{ui("No hay registros para graficar.")}</p>;
  }
  if(widget.kind==='alerts')return visibleSummary.alerts?.length?visibleSummary.alerts.map((a:Row,i:number)=><p key={i}><strong>{a.student_name}</strong><br/>{a.message}</p>):<DashboardEmptyState kind="alerts" role={role} translate={ui}/>;
  if(widget.kind==='calendar') {const events=(data.calendar_events||[]).filter(e=>new Date(e.ends_at)>=new Date()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));return events.length?events.slice(0,6).map(e=><p key={e.id}><strong>{e.title}</strong><br/>{new Date(e.starts_at).toLocaleString(locale==='en'?'en-US':'es-MX')}</p>):<DashboardEmptyState kind="calendar" role={role} translate={ui}/>;}
  if(widget.kind==='announcements')return data.announcements?.length?[...data.announcements].reverse().slice(0,5).map(a=><p key={a.id}><strong>{a.title}</strong><br/>{a.body}</p>):<p>{ui("No hay comunicados.")}</p>;
  return <strong className="widget-number">{visibleSummary[widget.kind]??0}</strong>;
 }
 function widgetActions(widget:Config['widgets'][number],index:number){
  return <>
   <button type="button" disabled={index===0||saving}
    aria-label={locale==='en'?`Move ${widget.title} earlier`:`Mover ${widget.title} antes`}
    onClick={()=>updateWidgets(current=>{
     const widgets=[...current.widgets];
     [widgets[index-1],widgets[index]]=[widgets[index],widgets[index-1]];
     const layouts=Object.fromEntries(Object.entries(current.layouts).map(([bp,items])=>{
      let y=0;
      return [bp,widgets.map(w=>{
       const item=items.find(i=>i.i===w.id)!;
       const next={...item,x:0,y};y+=item.h;return next;
      })];
     }));
     return {widgets,layouts};
    })}>↑</button>
   <button type="button" disabled={saving}
    aria-label={locale==='en'?`Remove ${widget.title}`:`Quitar ${widget.title}`}
    onClick={()=>updateWidgets(current=>removeWidget(current,widget.id))}>×</button>
  </>;
 }
 return <section aria-label={ui("Dashboard personalizable")}>
  <div className="dashboard-controls">
   <div className="dashboard-controls-heading">
    <h2>{ui("Mi dashboard")}</h2>
    <p>{ui("Indicadores y gráficas de los registros a los que tienes acceso.")}</p>
   </div>
   <div className="dashboard-control-actions" role="group" aria-label={ui("Acciones del dashboard")}>
    {!editing?
     <button type="button" className="primary dashboard-action-primary" disabled={!ready}
      onClick={()=>{preventProgrammaticLayoutChange.current=false;setRestored(false);setEditing(true);}}>
      <SlidersHorizontal size={17} aria-hidden="true"/>{ui("Personalizar")}
     </button>:
     <>
      <button type="button" className="secondary dashboard-action-reset" disabled={saving} onClick={restoreTemplate}>
       <RotateCcw size={17} aria-hidden="true"/>{ui("Restablecer plantilla")}
      </button>
      <button type="button" className="primary dashboard-action-primary" disabled={saving} onClick={()=>void save()}>
       <Save size={17} aria-hidden="true"/>{ui(saving?'Guardando…':'Guardar dashboard')}
      </button>
     </>
    }
   </div>
  </div>
  {analyticsRecovered&&!editing&&<div className="dashboard-analytics-recovery" role="status">
   <p>{ui("Recuperamos las gráficas que faltaban sin modificar tus tarjetas personalizadas.")}</p>
   <button type="button" disabled={saving} onClick={()=>void save()}>
    <Save size={15} aria-hidden="true"/>{ui(saving?"Guardando…":"Guardar gráficas recuperadas")}
   </button>
  </div>}
  {editing&&restored&&<p className="dashboard-reset-notice" role="status">
   {ui("Plantilla original restaurada. Pulsa Guardar dashboard para conservar los cambios.")}
  </p>}
  <div className="sc-analytics-date-filters" role="group" aria-label={ui('Filtros de estadísticas')}>
   <label>{ui('Periodo de análisis')}
    <select value={period} onChange={e=>setPeriod(e.target.value)}>
     <option value="30">{ui('Últimos 30 días')}</option>
     <option value="90">{ui('Últimos 90 días')}</option>
     <option value="180">{ui('Últimos 180 días')}</option>
     <option value="365">{ui('Últimos 365 días')}</option>
    </select>
   </label>
   {yearOptions.length>0&&
    <label>{ui('Ciclo escolar')}
     <select value={academicYear} onChange={e=>setAcademicYear(e.target.value)}>
      <option value="">{ui('Todos los ciclos autorizados')}</option>
      {yearOptions.map(year=><option value={String(year.id)} key={year.id}>{year.name}</option>)}
     </select>
    </label>}
   <span className="sc-analytics-filter-note">
    {role==='guardian'?(selectedChildId?ui('Estadísticas del hijo seleccionado'):ui('Estadísticas de tus hijos vinculados')):
     role==='teacher'?ui('Estadísticas de tus grupos autorizados'):ui('Resultados de los registros autorizados')}
   </span>
   {chartLoading&&<span className="sc-analytics-filter-loading" role="status">{ui('Actualizando gráficas…')}</span>}
  </div>
  {(['admin','teacher'].includes(role))&&(data.groups||[]).length>0&&
   <div className="dashboard-context-filter">
    <div className="sc-dashboard-select">
     <label>{ui("Grupo para indicadores")}</label>
     <Combobox label="Grupo para indicadores" value={filterGroup} onChange={setFilterGroup}
      placeholder="Todos los grupos autorizados"
      options={(data.groups||[]).map(group=>({value:String(group.id),label:group.label}))}/>
    </div>
    <p>{ui("El filtro se aplica a la información académica del dashboard.")}</p>
   </div>
  }
  {error&&<p className="error" role="alert">{error}</p>}
  {!ready&&!error&&<p>{ui("Cargando configuración…")}</p>}
  {editing&&<form className="widget-builder" onSubmit={event=>{
   event.preventDefault();
   updateWidgets(current=>appendWidget(current,kind,title.trim()||widgetKinds[kind]));
   setTitle('');
  }}>
   <div className="sc-dashboard-select">
    <label>{ui("Contenido")}</label>
    <Combobox label="Tipo de widget" value={kind} onChange={value=>setKind(value as Kind)}
     options={Object.entries(widgetKinds).filter(([value])=>!isAnalyticChartKind(value as Kind)||allowedChartKinds[role].includes(value as Kind)).map(([value,label])=>({value,label:ui(label)}))}/>
   </div>
   <label>{ui("Título del widget")}
    <input value={title} maxLength={80} placeholder={ui(widgetKinds[kind])}
     onChange={event=>setTitle(event.target.value)}/>
   </label>
   <button className="secondary" disabled={saving||config.widgets.length>=24}>{ui("Añadir widget")}</button>
   <p>{ui("Arrastra desde el título o ajusta la esquina. En móvil puedes cambiar el orden con las flechas. Guarda para conservar los cambios.")}</p>
  </form>}
  {ready&&<Grid key={gridRevision}
   layouts={Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.map(item=>({...item,minH:2,maxH:20}))]))}
   breakpoints={{lg:1200,md:800,sm:480,xs:0}} cols={columns} rowHeight={52} margin={[14,14]}
   isDraggable={editing&&!saving} isResizable={editing&&!saving} draggableHandle=".widget-handle"
   onDragStart={()=>{preventProgrammaticLayoutChange.current=false;setRestored(false);}}
   onResizeStart={()=>{preventProgrammaticLayoutChange.current=false;setRestored(false);}}
   onLayoutChange={(_,layouts)=>{
    if(!editing||saving||preventProgrammaticLayoutChange.current)return;
    setConfig(current=>mergeGridLayouts(current,layouts));
   }}>
   {config.widgets.map((widget,index)=>isMetricKind(widget.kind)?
    <div key={widget.id} className="sc-kpi-grid-item" data-widget={widget.kind}>
     <DashboardMetricCard kind={widget.kind} title={ui(widget.title)}
      value={visibleSummary[widget.kind]} role={role} locale={locale} translate={ui}
      editing={editing} actions={editing?widgetActions(widget,index):undefined}/>
    </div>:
    <article className="dashboard-widget" key={widget.id}>
     <div className="widget-header">
      <h3 className={editing?'widget-handle':''}>{ui(widget.title)}</h3>
      {editing&&<div className="widget-actions">{widgetActions(widget,index)}</div>}
     </div>
     <div className="widget-body">{content(widget)}</div>
    </article>)}
  </Grid>}
  {ready&&!config.widgets.length&&<p>{ui("Tu dashboard está vacío. Añade un widget desde Personalizar.")}</p>}
 </section>;
}
