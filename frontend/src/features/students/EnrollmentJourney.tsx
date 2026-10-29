import {useMemo,useState} from 'react';
import {GraduationCap,Search,Users,School,BookOpenCheck,CalendarCheck} from 'lucide-react';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import TableEmptyState from '../../shared/components/TableEmptyState';
import type {Row} from '../../modules';
export function journeyStats(items:Row[]){return {total:items.length,active:items.filter(x=>x.status==='active').length,completed:items.filter(x=>x.status==='completed').length,promoted:items.filter(x=>x.outcome==='promoted').length};}
export default function EnrollmentJourney({items,groups,years,onComplete,canComplete,error}:{items:Row[];groups:Row[];years:Row[];onComplete:(row:Row)=>void;canComplete:boolean;error?:string}){
 const {ui}=useSchoolLocale();
 const [search,setSearch]=useState(''),[year,setYear]=useState(''),[grade,setGrade]=useState(''),[status,setStatus]=useState('');
 const groupMap=useMemo(()=>new Map(groups.map(g=>[String(g.id),g])),[groups]);
 const rows=items.filter(row=>(!search||String(row.student_name||'').toLowerCase().includes(search.toLowerCase())||String(row.group_label||'').toLowerCase().includes(search.toLowerCase()))&&(!year||String(row.academic_year_id)===year)&&(!grade||String(groupMap.get(String(row.group_id))?.grade_level)===grade)&&(!status||row.status===status));
 const stats=journeyStats(items);
 const statuses:Record<string,string>={active:'Activo',completed:'Concluido'};
 const outcomes:Record<string,string>={promoted:'Promovido',repeat:'Repite grado',graduated:'Egresado'};
 return <section className="sc-journey">
  <div className="sc-journey-hero"><div><span>{ui('GESTIÓN ESCOLAR / TRAYECTORIA')}</span><h2>{ui('Cada ciclo, una etapa de aprendizaje')}</h2><p>{ui('Consulta la matrícula y el avance de los alumnos por ciclo, grado y grupo.')}</p></div><GraduationCap size={54} aria-hidden="true"/></div>
  <div className="sc-journey-kpis">{([{name:'Matrícula registrada',count:stats.total,icon:Users},{name:'Inscripciones activas',count:stats.active,icon:School},{name:'Ciclos concluidos',count:stats.completed,icon:CalendarCheck},{name:'Promociones',count:stats.promoted,icon:BookOpenCheck}]).map(k=>{const Icon=k.icon;return <article key={k.name}><div><Icon size={18}/>{ui(k.name)}</div><strong>{k.count}</strong></article>;})}</div>
  <div className="sc-journey-panel"><header><div><h3>{ui('Matrícula y trayectoria escolar')}</h3><p>{ui('Localiza alumnos y consulta su situación académica.')}</p></div><strong>{rows.length} {ui('Registros')}</strong></header>
   <div className="sc-journey-filters"><label><span>{ui('Buscar alumno')}</span><div className="sc-journey-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={ui('Nombre o grupo')}/></div></label>
    <label><span>{ui('Ciclo escolar')}</span><select value={year} onChange={e=>setYear(e.target.value)}><option value="">{ui('Todos los ciclos')}</option>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
    <label><span>{ui('Grado')}</span><select value={grade} onChange={e=>setGrade(e.target.value)}><option value="">{ui('Todos los grados')}</option>{[1,2,3,4,5,6].map(g=><option value={g} key={g}>{g}°</option>)}</select></label>
    <label><span>{ui('Estado')}</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{ui('Todos los estados')}</option>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{ui(label)}</option>)}</select></label>
    {(search||year||grade||status)&&<button type="button" className="secondary" onClick={()=>{setSearch('');setYear('');setGrade('');setStatus('');}}>{ui('Limpiar filtros')}</button>}
   </div>
   <div className="sc-journey-grades" aria-label={ui('Matrícula por grado')}>{[1,2,3,4,5,6].map(g=><div key={g}><span>{g}°</span><strong>{rows.filter(r=>Number(groupMap.get(String(r.group_id))?.grade_level)===g).length}</strong></div>)}</div>
   {error?<TableEmptyState mode="error" description={error}/>:rows.length?<div className="sc-journey-table-wrap"><table className="sc-journey-table"><thead><tr><th>{ui('Alumno')}</th><th>{ui('Grupo y ciclo')}</th><th>{ui('Estado')}</th><th>{ui('Resultado')}</th>{canComplete&&<th>{ui('Acciones')}</th>}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>
    <td data-label={ui('Alumno')}><div className="sc-journey-student"><span aria-hidden="true">{String(r.student_name||'?').split(' ').slice(0,2).map((part:string)=>part[0]).join('').toUpperCase()}</span><div><strong>{r.student_name}</strong><small>{ui('Registro')} #{r.id}</small></div></div></td>
    <td data-label={ui('Grupo y ciclo')}>{r.group_label||ui('Sin grupo')}</td><td data-label={ui('Estado')}><span className={'sc-journey-status '+(r.status==='active'?'is-active':'')}>{ui(statuses[r.status]||r.status)}</span></td>
    <td data-label={ui('Resultado')}>{r.outcome?ui(outcomes[r.outcome]||r.outcome):ui('Pendiente')}</td>
    {canComplete&&<td data-label={ui('Acciones')}>{r.status==='active'&&<button type="button" className="secondary" onClick={()=>onComplete(r)}>{ui('Cerrar ciclo')}</button>}</td>}</tr>)}</tbody></table></div>:<TableEmptyState canCreate={false} mode={search||year||grade||status?'filtered':'empty'}/>}
  </div>
 </section>;
}
