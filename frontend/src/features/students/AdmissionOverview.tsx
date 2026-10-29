import {ClipboardCheck,ClipboardList,FileWarning,School,SlidersHorizontal} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

export function filterAdmissionRows(items:Row[],filters:{year:string;grade:string;date:string}):Row[]{
 return items.filter(record=>(!filters.year||String(record.academic_year_id)===filters.year)&&
  (!filters.grade||String(record.grade_level)===filters.grade)&&
  (!filters.date||String(record.created_at||'').slice(0,10)===filters.date));
}
type Props={items:Row[];years:Row[];year:string;onYear:(value:string)=>void;
 grade:string;onGrade:(value:string)=>void;date:string;onDate:(value:string)=>void;onReset:()=>void};
export default function AdmissionOverview({items,years,year,onYear,grade,onGrade,date,onDate,onReset}:Props){
 const {ui}=useSchoolLocale();
 const metrics=[
  {label:'En revisión',value:items.filter(x=>x.status==='submitted').length,icon:ClipboardList},
  {label:'Correcciones pendientes',value:items.filter(x=>x.status==='correction_requested').length,icon:FileWarning},
  {label:'Aprobadas por formalizar',value:items.filter(x=>x.status==='approved'&&!x.enrollment_id).length,icon:ClipboardCheck},
  {label:'Inscripciones formalizadas',value:items.filter(x=>Boolean(x.enrollment_id)).length,icon:School}
 ];
 return <section className="sc-admission-overview" aria-label={ui('Panorama de admisiones')}>
  <div className="sc-admission-overview-kpis">{metrics.map(metric=>{const Icon=metric.icon;return <article key={metric.label}>
   <span className="sc-admission-overview-icon"><Icon size={20}/></span><div><small>{ui(metric.label)}</small>
    <strong>{metric.value}</strong></div></article>;})}</div>
  <div className="sc-admission-overview-filters"><div className="sc-admission-overview-filter-title"><SlidersHorizontal size={17}/><strong>{ui('Filtrar solicitudes')}</strong></div>
   <label>{ui('Ciclo escolar')}<select value={year} onChange={e=>onYear(e.target.value)}><option value="">{ui('Todos los ciclos')}</option>
     {years.map(y=><option value={String(y.id)} key={y.id}>{y.name}</option>)}</select></label>
   <label>{ui('Grado')}<select value={grade} onChange={e=>onGrade(e.target.value)}><option value="">{ui('Todos')}</option>
    {Array.from({length:6},(_,i)=><option key={i} value={String(i+1)}>{i+1}°</option>)}</select></label>
   <label>{ui('Fecha de solicitud')}<input type="date" value={date} onChange={e=>onDate(e.target.value)}/></label>
   <button type="button" className="secondary" onClick={onReset}>{ui('Limpiar filtros')}</button>
  </div>
 </section>;
}
