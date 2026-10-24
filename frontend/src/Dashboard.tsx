import {useSchoolLocale} from './shared/i18n/LocaleContext';
import Combobox from './shared/components/Combobox';
import {useEffect, useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout/legacy';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer} from 'recharts';
import {api} from './api';
import {notify} from './notifications';
import {appendWidget, removeWidget, defaultConfig, widgetKinds, columns, type Config, type Kind, type DashboardRole} from './dashboardConfig';
import type {Row} from './modules';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
const Grid = WidthProvider(Responsive);
const statusLabels: Record<string,string> = {present:'Presente',absent:'Ausente',late:'Retardo',excused:'Justificada',submitted:'Enviada',approved:'Aprobada',rejected:'Rechazada'};
export default function Dashboard({summary,data,role='admin',userId=0}:{summary:Row;data:Record<string,Row[]>;role?:DashboardRole;userId?:number}) {
 const {ui}=useSchoolLocale();
 const [filterGroup,setFilterGroup]=useState('');
 const [visibleSummary,setVisibleSummary]=useState<Row>(summary);
 const [config,setConfig] = useState<Config>(()=>defaultConfig(role));
 const [version,setVersion] = useState<number|null>(null);
 const [ready,setReady] = useState(false),[editing,setEditing] = useState(false),[saving,setSaving] = useState(false);
 const [error,setError] = useState(''),[kind,setKind] = useState<Kind>('attendance_chart'),[title,setTitle] = useState('');
 useEffect(()=>{let active=true;setVisibleSummary(summary);return()=>{active=false;};},[summary]);
 useEffect(()=>{let active=true;if(!filterGroup){setVisibleSummary(summary);return;}
   void api('dashboard?group_id='+encodeURIComponent(filterGroup)).then(result=>{if(active)setVisibleSummary(result);}).catch(e=>{if(active)setError(e.message);});
   return()=>{active=false;};
 },[filterGroup,summary,userId]);
 useEffect(()=>{let active=true;api('dashboard_preference').then(result=>{if(active){setConfig(result.configuration||defaultConfig(role));setVersion(result.lock_version);setReady(true);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 async function save(){setSaving(true);setError('');try{const result=await api('dashboard_preference','PUT',{configuration:config,lock_version:version});setVersion(result.lock_version);setEditing(false);void notify('Dashboard guardado correctamente.');}catch(e){setError((e as Error).message);}finally{setSaving(false);}}
 function content(widget: Config['widgets'][number]) {
  if(widget.kind.endsWith('_chart')) {
   const entries=Object.entries(visibleSummary[widget.kind]||{}).map(([name,value])=>({name:statusLabels[name]||name,value:Number(value)}));
   return entries.length?<><div className="widget-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={entries}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" name="Registros" fill="#405CF5" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><p className="chart-description">{entries.map(e=>`${e.name}: ${e.value}`).join(' · ')}</p></>:<p>{ui("No hay registros para graficar.")}</p>;
  }
  if(widget.kind==='alerts')return visibleSummary.alerts?.length?visibleSummary.alerts.map((a:Row,i:number)=><p key={i}><strong>{a.student_name}</strong><br/>{a.message}</p>):<p>{ui("Sin alertas de asistencia. Se señalan tres o más faltas en 30 días para revisión humana.")}</p>;
  if(widget.kind==='calendar') {const events=(data.calendar_events||[]).filter(e=>new Date(e.ends_at)>=new Date()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));return events.length?events.slice(0,6).map(e=><p key={e.id}><strong>{e.title}</strong><br/>{new Date(e.starts_at).toLocaleString('es-MX')}</p>):<p>{ui("No hay próximos eventos.")}</p>;}
  if(widget.kind==='announcements')return data.announcements?.length?[...data.announcements].reverse().slice(0,5).map(a=><p key={a.id}><strong>{a.title}</strong><br/>{a.body}</p>):<p>{ui("No hay comunicados.")}</p>;
  return <strong className="widget-number">{visibleSummary[widget.kind]??0}</strong>;
 }
 return <section aria-label={ui("Dashboard personalizable")}><div className="dashboard-controls"><div><h2>{ui("Mi dashboard")}</h2><p>{ui("Indicadores y gráficas de los registros a los que tienes acceso.")}</p></div>{!editing?<button className="primary" disabled={!ready} onClick={()=>setEditing(true)}>{ui("Personalizar")}</button>:<button className="primary" disabled={saving} onClick={save}>{saving?'Guardando…':'Guardar dashboard'}</button>}{editing&&<button className="secondary" disabled={saving} onClick={()=>setConfig(defaultConfig(role))}>{ui("Restablecer plantilla")}</button>}</div>
 {(['admin','teacher'].includes(role))&&(data.groups||[]).length>0&&<div className="dashboard-context-filter">
   <div className="sc-dashboard-select"><label>{ui("Grupo para indicadores")}</label>
     <Combobox label="Grupo para indicadores" value={filterGroup} onChange={setFilterGroup} placeholder="Todos los grupos autorizados"
       options={(data.groups||[]).map(group=>({value:String(group.id),label:group.label}))}/></div>
   <p>{ui("El filtro se aplica a la información académica del dashboard.")}</p>
 </div>}
 {error&&<p className="error" role="alert">{error}</p>}{!ready&&!error&&<p>{ui("Cargando configuración…")}</p>}
 {editing&&<form className="widget-builder" onSubmit={e=>{e.preventDefault();setConfig(c=>appendWidget(c,kind,title.trim()||widgetKinds[kind]));setTitle('');}}><div className="sc-dashboard-select"><label>{ui("Contenido")}</label><Combobox label="Tipo de widget" value={kind}
     onChange={value=>setKind(value as Kind)} options={Object.entries(widgetKinds).map(([value,label])=>({value,label}))}/></div><label>{ui("Título del widget")}<input value={title} maxLength={80} placeholder={widgetKinds[kind]} onChange={e=>setTitle(e.target.value)}/></label><button className="secondary" disabled={saving||config.widgets.length>=24}>{ui("Añadir widget")}</button><p>{ui("Arrastra desde el título o ajusta la esquina. En móvil puedes cambiar el orden con las flechas. Guarda para conservar los cambios.")}</p></form>}
 {ready&&<Grid layouts={Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.map(item=>({...item,minH:2,maxH:20}))]))} breakpoints={{lg:1200,md:800,sm:480,xs:0}} cols={columns} rowHeight={48} margin={[16,16]} isDraggable={editing&&!saving} isResizable={editing&&!saving} draggableHandle=".widget-handle" onLayoutChange={(_,layouts)=>{if(!saving)setConfig(c=>({...c,layouts:Object.fromEntries(Object.entries(layouts).map(([bp,items])=>[bp,(items||[]).map(({i,x,y,w,h})=>({i,x,y,w,h}))]))}));}}>
 {config.widgets.map((widget,index)=><article className="dashboard-widget" key={widget.id}><div className="widget-header"><h3 className={editing?'widget-handle':''}>{widget.title}</h3>{editing&&<div className="widget-actions"><button type="button" disabled={index===0||saving} aria-label={`Mover ${widget.title} antes`} onClick={()=>setConfig(c=>{const widgets=[...c.widgets];[widgets[index-1],widgets[index]]=[widgets[index],widgets[index-1]];const layouts=Object.fromEntries(Object.entries(c.layouts).map(([bp,items])=>{let y=0;return[bp,widgets.map(w=>{const item=items.find(i=>i.i===w.id)!;const next={...item,x:0,y};y+=item.h;return next;})];}));return{widgets,layouts};})}>↑</button><button type="button" disabled={saving} aria-label={`Quitar ${widget.title}`} onClick={()=>setConfig(c=>removeWidget(c,widget.id))}>×</button></div>}</div><div className="widget-body">{content(widget)}</div></article>)}
 </Grid>}{ready&&!config.widgets.length&&<p>{ui("Tu dashboard está vacío. Añade un widget desde Personalizar.")}</p>}</section>;
}
