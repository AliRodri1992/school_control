import {useMemo,useState} from 'react';
import {GraduationCap,Search,Users,School,BookOpenCheck,CalendarCheck} from 'lucide-react';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import TableEmptyState from '../../shared/components/TableEmptyState';
import type {Row} from '../../modules';
import Combobox from '../../shared/components/Combobox';
export function journeyStats(items:Row[]){return {total:items.length,active:items.filter(x=>x.status==='active').length,completed:items.filter(x=>x.status==='completed').length,promoted:items.filter(x=>x.outcome==='promoted').length};}
export function enrollmentGrade(row:Row,groups:Map<string,Row>):number|null{
 const explicit=Number(row.grade_level||groups.get(String(row.group_id))?.grade_level);
 if(Number.isInteger(explicit)&&explicit>=1&&explicit<=6)return explicit;
 const match=String(row.group_label||'').match(/^([1-6])(?:°|\\s|[AB]\\b)/);
 return match?Number(match[1]):null;
}
export function gradeEnrollmentCounts(items:Row[],groups:Map<string,Row>):number[]{
 const counts=[0,0,0,0,0,0];
 for(const row of items){const g=enrollmentGrade(row,groups);if(g!==null)counts[g-1]++;}
 return counts;
}
export default function EnrollmentJourney({items,groups,years,onComplete,canComplete,error}:{items:Row[];groups:Row[];years:Row[];onComplete:(row:Row)=>void;canComplete:boolean;error?:string}){
 const {ui}=useSchoolLocale();
 const [search,setSearch]=useState(''),[year,setYear]=useState(''),[grade,setGrade]=useState(''),[status,setStatus]=useState('');
 const groupMap=useMemo(()=>new Map(groups.map(g=>[String(g.id),g])),[groups]);
 const contextRows=items.filter(row=>(!search||String(row.student_name||'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())||String(row.group_label||'').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))&&(!year||String(row.academic_year_id||groupMap.get(String(row.group_id))?.academic_year_id)===year)&&(!status||row.status===status));
 const rows=contextRows.filter(row=>!grade||String(enrollmentGrade(row,groupMap))===grade);
 const gradeCounts=gradeEnrollmentCounts(contextRows,groupMap);
 const stats=journeyStats(items);
 const statuses:Record<string,string>={active:'Activo',completed:'Concluido'};
 const outcomes:Record<string,string>={promoted:'Promovido',repeat:'Repite grado',graduated:'Egresado'};
 return <section className="sc-journey">
  <div className="sc-journey-hero"><div><span>{ui('GESTIÓN ESCOLAR / TRAYECTORIA')}</span><h2>{ui('Cada ciclo, una etapa de aprendizaje')}</h2><p>{ui('Consulta la matrícula y el avance de los alumnos por ciclo, grado y grupo.')}</p></div><GraduationCap size={54} aria-hidden="true"/></div>
  <div className="sc-journey-kpis">{([{name:'Matrícula registrada',count:stats.total,icon:Users},{name:'Inscripciones activas',count:stats.active,icon:School},{name:'Ciclos concluidos',count:stats.completed,icon:CalendarCheck},{name:'Promociones',count:stats.promoted,icon:BookOpenCheck}]).map(k=>{const Icon=k.icon;return <article key={k.name}><div><Icon size={18}/>{ui(k.name)}</div><strong>{k.count}</strong></article>;})}</div>
  <div className="sc-journey-panel"><header><div><h3>{ui('Matrícula y trayectoria escolar')}</h3><p>{ui('Localiza alumnos y consulta su situación académica.')}</p></div><strong>{rows.length} {ui('Registros')}</strong></header>
   <div className="sc-journey-filters"><label><span>{ui('Buscar alumno')}</span><div className="sc-journey-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={ui('Nombre o grupo')}/></div></label>
    <label><span>{ui('Ciclo escolar')}</span><Combobox searchable={false} label={ui('Ciclo escolar')} value={year} onChange={setYear} placeholder={ui('Todos los ciclos')} options={years.map(y=>({value:String(y.id),label:y.name}))}/></label>
    <label><span>{ui('Grado')}</span><Combobox searchable={false} label={ui('Grado')} value={grade} onChange={setGrade} placeholder={ui('Todos los grados')} options={[1,2,3,4,5,6].map(g=>({value:String(g),label:g+'°'}))}/></label>
    <label><span>{ui('Estado')}</span><Combobox searchable={false} label={ui('Estado')} value={status} onChange={setStatus} placeholder={ui('Todos los estados')} options={Object.entries(statuses).map(([key,label])=>({value:key,label:ui(label)}))}/></label>
    {(search||year||grade||status)&&<button type="button" className="secondary" onClick={()=>{setSearch('');setYear('');setGrade('');setStatus('');}}>{ui('Limpiar filtros')}</button>}
   </div>
   <div className="sc-journey-grades" aria-label={ui('Matrícula por grado')}>{[1,2,3,4,5,6].map(g=><div key={g}><span>{g}°</span><strong>{gradeCounts[g-1]}</strong></div>)}</div>
   {error?<TableEmptyState mode="error" description={error}/>:rows.length?<div className="sc-journey-table-wrap"><table className="sc-journey-table"><thead><tr><th>{ui('Alumno')}</th><th>{ui('Grupo y ciclo')}</th><th>{ui('Estado')}</th><th>{ui('Resultado')}</th>{canComplete&&<th>{ui('Acciones')}</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>
    <td data-label={ui('Alumno')}><div className="sc-journey-student"><span aria-hidden="true">{String(r.student_name||'?').split(' ').slice(0,2).map((part:string)=>part[0]).join('').toUpperCase()}</span><div><strong>{r.student_name}</strong><small>{ui('Registro')} #{r.id}</small></div></div></td>
    <td data-label={ui('Grupo y ciclo')}>{r.group_label||ui('Sin grupo')}</td><td data-label={ui('Estado')}><span className={'sc-journey-status '+(r.status==='active'?'is-active':'')}>{ui(statuses[r.status]||r.status)}</span></td>
    <td data-label={ui('Resultado')}>{r.outcome?ui(outcomes[r.outcome]||r.outcome):ui('Pendiente')}</td>
    {canComplete&&<td data-label={ui('Acciones')}>{r.status==='active'&&<button type="button" className="secondary" onClick={()=>onComplete(r)}>{ui('Cerrar ciclo')}</button>}</td>}</tr>)}</tbody></table></div>:<TableEmptyState canCreate={false} mode={search||year||grade||status?'filtered':'empty'}/>}
  </div>
 </section>;
}
