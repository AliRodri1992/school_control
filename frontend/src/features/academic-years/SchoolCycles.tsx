import {useMemo,useState} from 'react';
import {CalendarDays,CalendarRange,GraduationCap,Pencil,Search,Users} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
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
export default function SchoolCycles({items,onSave,canCreate,canEdit,error}:{items:Row[];onSave:(data:Row,existing?:Row|null)=>Promise<void>;canCreate:boolean;canEdit:boolean;error?:string}){
 const {ui,locale}=useSchoolLocale();
 const [query,setQuery]=useState('');
 const [editor,setEditor]=useState<Row|null|false>(false);
 const today=new Date().toLocaleDateString('en-CA');
 const stats=useMemo(()=>schoolYearStats(items,today),[items,today]);
 const rows=useMemo(()=>items.filter(x=>String(x.name||'').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>String(b.starts_on||'').localeCompare(String(a.starts_on||''))),[items,query]);
 const stateNames:Record<string,string>={open:'Abierta',upcoming:'Próxima',closed:'Cerrada',unknown:'Sin configurar'};
 const format=(date?:string)=>date?new Date(date+'T12:00:00').toLocaleDateString(locale.startsWith('en')?'en-US':'es-MX',{day:'numeric',month:'short',year:'numeric'}):ui('Sin fecha');
 const period=(label:string,from?:string,to?:string,icon?:'school')=>{
  const state=windowState(from,to,today);const Icon=icon==='school'?GraduationCap:CalendarRange;
  return <div className="sc-cycle-period"><div className="sc-cycle-period-title"><Icon size={17}/><strong>{ui(label)}</strong><span className={'sc-cycle-badge state-'+state}>{ui(stateNames[state])}</span></div>
   <div className="sc-cycle-date-row"><span>{ui('Apertura')}<strong>{format(from)}</strong></span><span>{ui('Cierre')}<strong>{format(to)}</strong></span></div></div>;
 };
 if(editor!==false)return <CycleForm key={editor?.id||'new'} initial={editor||undefined} onCancel={()=>setEditor(false)} onSave={async values=>{await onSave(values,editor||null);setEditor(false);}}/>;
 return <section className="sc-cycles" aria-label={ui('Ciclos y convocatorias')}>
  <header className="sc-cycles-hero"><div><span>{ui('PLANEACIÓN ESCOLAR')}</span><h2>{ui('Organiza cada ciclo y sus convocatorias')}</h2><p>{ui('Visualiza el calendario lectivo y las ventanas de inscripción y reinscripción, sin perder de vista sus fechas clave.')}</p></div><CalendarDays size={46} aria-hidden="true"/></header>
  <div className="sc-cycles-kpis">{[
   {title:'Ciclos registrados',value:stats.total,icon:CalendarDays},{title:'Inscripciones abiertas',value:stats.admissions,icon:Users},
   {title:'Reinscripciones abiertas',value:stats.reenrollments,icon:GraduationCap},{title:'Próximas convocatorias',value:stats.upcoming,icon:CalendarRange}
  ].map(metric=>{const Icon=metric.icon;return <article key={metric.title}><div><Icon size={17}/><span>{ui(metric.title)}</span></div><strong>{metric.value}</strong></article>;})}</div>
  <section className="sc-cycles-workspace"><div className="sc-cycles-heading"><div><h3>{ui('Calendario de ciclos escolares')}</h3><p>{ui('Las fechas de cada convocatoria determinan cuándo pueden enviarse solicitudes.')}</p></div>{canCreate&&<button className="primary" type="button" onClick={()=>setEditor(null)}>{ui('Registrar ciclo')}</button>}</div>
   <label className="sc-cycles-search"><Search size={18}/><input aria-label={ui('Buscar ciclo escolar')} placeholder={ui('Buscar por nombre del ciclo…')} value={query} onChange={event=>setQuery(event.target.value)}/></label>
   {error?<TableEmptyState mode="error" description={error}/>:rows.length?<div className="sc-cycles-list">{rows.map(item=><article className="sc-cycle-card" key={item.id}>
    <div className="sc-cycle-card-heading"><div><span className="sc-cycle-card-icon"><CalendarDays size={20}/></span><div><h4>{item.name}</h4><small>{ui('Periodo lectivo')}: {format(item.starts_on)} — {format(item.ends_on)}</small></div></div>
    {canEdit&&<button type="button" className="secondary sc-cycle-edit" onClick={()=>setEditor(item)}><Pencil size={15}/>{ui('Editar fechas')}</button>}</div>
    <div className="sc-cycle-periods">{period('Inscripciones · nuevo ingreso',item.admissions_open_on,item.admissions_close_on)}{period('Reinscripciones',item.reenrollment_open_on,item.reenrollment_close_on)}{period('Clases',item.starts_on,item.ends_on,'school')}</div>
   </article>)}</div>:<TableEmptyState mode={query?'filtered':'empty'} canCreate={canCreate}/>}
  </section>
 </section>;
}
