import {ClipboardCheck,ClipboardList,FileWarning,School,SlidersHorizontal} from 'lucide-react';
import type {Row} from '../../modules';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';

export function filterAdmissionRows(items:Row[],filters:{year:string;grade:string;date:string;status?:string;kind?:string}):Row[]{
 return items.filter(record=>(!filters.year||String(record.academic_year_id)===filters.year)&&
  (!filters.grade||String(record.grade_level)===filters.grade)&&
  (!filters.date||String(record.created_at||'').slice(0,10)===filters.date)&&
  (!filters.status||String(record.status)===filters.status)&&(!filters.kind||String(record.kind)===filters.kind));
}
type Props={items:Row[];years:Row[];year:string;onYear:(value:string)=>void;
 grade:string;onGrade:(value:string)=>void;date:string;onDate:(value:string)=>void;status:string;onStatus:(value:string)=>void;kind:string;onKind:(value:string)=>void;onReset:()=>void};
export default function AdmissionOverview({items,years,year,onYear,grade,onGrade,date,onDate,status,onStatus,kind,onKind,onReset}:Props){
 const {ui}=useSchoolLocale();
 const metrics=[
  {label:'En revisión',value:items.filter(x=>x.status==='submitted').length,icon:ClipboardList},
  {label:'Correcciones pendientes',value:items.filter(x=>x.status==='correction_requested').length,icon:FileWarning},
  {label:'Aprobadas por formalizar',value:items.filter(x=>x.status==='approved'&&!x.enrollment_id).length,icon:ClipboardCheck},
  {label:'Inscripciones formalizadas',value:items.filter(x=>Boolean(x.enrollment_id)).length,icon:School}
 ];
 return <section className="sc-admission-overview" aria-label={ui('Panorama de admisiones')}>
  <div className="sc-admission-overview-intro"><span>{ui('CONTROL DE SOLICITUDES')}</span><strong>{ui('Del registro a la matrícula, sin perder el seguimiento')}</strong><p>{ui('La aprobación de una solicitud no equivale a una inscripción formalizada. Consulta el expediente para continuar cada trámite.')}</p></div>
  <div className="sc-admission-overview-kpis">{metrics.map(metric=>{const Icon=metric.icon;return <article key={metric.label}>
   <span className="sc-admission-overview-icon"><Icon size={20}/></span><div><small>{ui(metric.label)}</small>
    <strong>{metric.value}</strong></div></article>;})}</div>
  <div className="sc-admission-overview-filters"><div className="sc-admission-overview-filter-title"><SlidersHorizontal size={17}/><strong>{ui('Filtrar solicitudes')}</strong></div>
   <label>{ui('Ciclo escolar')}<Combobox label={ui('Ciclo escolar')} value={year} onChange={onYear} placeholder={ui('Todos los ciclos')} options={years.map(y=>({value:String(y.id),label:y.name}))}/></label>
   <label>{ui('Grado')}<Combobox label={ui('Grado')} value={grade} onChange={onGrade} placeholder={ui('Todos')} options={Array.from({length:6},(_,i)=>({value:String(i+1),label:(i+1)+'°'}))}/></label>
   <label>{ui('Estado')}<Combobox label={ui('Filtrar por estado de solicitud')} value={status} onChange={onStatus} placeholder={ui('Todos los estados')} options={([['draft','Borrador'],['submitted','En revisión'],['correction_requested','Correcciones solicitadas'],['approved','Aprobada'],['rejected','Rechazada'],['cancelled','Cancelada']] as [string,string][]).map(([value,label])=>({value,label:ui(label)}))}/></label>
   <label>{ui('Tipo de solicitud')}<Combobox label={ui('Filtrar por tipo de solicitud')} value={kind} onChange={onKind} placeholder={ui('Todos los tipos')} options={[{value:'new',label:ui('Nuevo ingreso')},{value:'reenrollment',label:ui('Reinscripción')}]}/></label>
   <label>{ui('Fecha de solicitud')}<input type="date" value={date} onChange={e=>onDate(e.target.value)}/></label>
   <button type="button" className="secondary" onClick={onReset}>{ui('Limpiar filtros')}</button>
  </div>
 </section>;
}
