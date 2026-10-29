import {useMemo,useState} from 'react';
import {AlertCircle,CheckCircle2,ContactRound,Mail,Phone,Search,ShieldCheck,UserRound,UsersRound,Plus,PenLine,Trash2,X} from 'lucide-react';
import type {Row} from '../../modules';
import TableEmptyState from '../../shared/components/TableEmptyState';

type Props={contacts:Row[];students:Row[];canCreate:boolean;canEdit:boolean;canDelete:boolean;busy:boolean;loading?:boolean;error?:string;onRetry:()=>void;onCreate:()=>void;onEdit:(row:Row)=>void;onDelete:(row:Row)=>void};
export const isEnabled=(value:unknown)=>value===true||value===1||value==='true'||value==='1';
export const filterFamilyContacts=(contacts:Row[],search:string,filter:string,student:string)=>contacts.filter(row=>{
 const query=search.trim().toLocaleLowerCase();
 const match=!query||[row.name,row.student_name,row.relationship,row.phone,row.email].some(value=>String(value??'').toLocaleLowerCase().includes(query));
 return match&&(!student||String(row.student_id)===student)&&
 (filter==='all'||(filter==='emergency'&&isEnabled(row.emergency))||(filter==='pickup'&&isEnabled(row.pickup_authorized)));
});
export default function FamilyContacts({contacts,students,canCreate,canEdit,canDelete,busy,loading,error,onRetry,onCreate,onEdit,onDelete}:Props){
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('all'),[student,setStudent]=useState('');
 const rows=useMemo(()=>filterFamilyContacts(contacts,search,filter,student),[contacts,search,filter,student]);
 const emergency=contacts.filter(r=>isEnabled(r.emergency)).length;
 const pickup=contacts.filter(r=>isEnabled(r.pickup_authorized)).length;
 const clear=()=>{setSearch('');setFilter('all');setStudent('');};
 return <section className="sc-family" aria-label="Contactos familiares">
  <header className="sc-family-heading">
   <div><span className="sc-family-eyebrow"><ContactRound size={16}/> VÍNCULO ESCUELA Y FAMILIA</span><h1>Contactos familiares</h1><p>Administra las personas de confianza, contactos de emergencia y autorizaciones de recogida de cada alumno.</p></div>
   {canCreate&&<button type="button" className="primary sc-family-add" onClick={onCreate}><Plus size={18}/> Registrar contacto</button>}
  </header>
  <div className="sc-family-stats" aria-label="Resumen de contactos">
   <div className="sc-family-stat"><span className="sc-family-stat-icon"><UsersRound size={21}/></span><div><strong>{contacts.length}</strong><small>Contactos registrados</small></div></div>
   <div className="sc-family-stat"><span className="sc-family-stat-icon is-red"><AlertCircle size={21}/></span><div><strong>{emergency}</strong><small>Contactos de emergencia</small></div></div>
   <div className="sc-family-stat"><span className="sc-family-stat-icon is-green"><ShieldCheck size={21}/></span><div><strong>{pickup}</strong><small>Autorizados para recoger</small></div></div>
  </div>
  <div className="sc-family-panel">
   <div className="sc-family-tools">
    <label className="sc-family-search"><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nombre, alumno, parentesco o teléfono" aria-label="Buscar contactos familiares"/></label>
    <label className="sc-family-select-label"><span>Alumno</span><select aria-label="Filtrar contactos por alumno" value={student} onChange={e=>setStudent(e.target.value)}><option value="">Todos los alumnos</option>{students.map(s=><option key={s.id} value={String(s.id)}>{String(s.full_name||[s.first_name,s.last_name].filter(Boolean).join(' ')||s.name||s.id)}</option>)}</select></label>
   </div>
   <div className="sc-family-filterbar" aria-label="Tipos de contactos">
    {([['all','Todos',contacts.length],['emergency','Emergencia',emergency],['pickup','Recogida autorizada',pickup]] as const).map(([key,label,count])=><button key={key} type="button" className={filter===key?'is-selected':''} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}<span>{count}</span></button>)}
    <span className="sc-family-results" role="status">{rows.length} de {contacts.length} contactos</span>
   </div>
   {error?<div className="sc-family-empty"><TableEmptyState mode="error" description={error}/><button className="secondary" onClick={onRetry}>Reintentar consulta</button></div>:
   loading?<TableEmptyState mode="loading"/>:
   !contacts.length?<div className="sc-family-empty"><TableEmptyState mode="empty" canCreate={canCreate}/>{canCreate&&<button className="primary" onClick={onCreate}><Plus size={17}/> Registrar primer contacto</button>}</div>:
   !rows.length?<div className="sc-family-empty"><Search size={32} aria-hidden="true"/><h2>Sin coincidencias</h2><p>Prueba con otro nombre, alumno o tipo de contacto.</p><button className="secondary" onClick={clear}><X size={16}/> Limpiar filtros</button></div>:
   <div className="sc-family-grid">{rows.map(row=><article key={String(row.id)} className="sc-family-card">
    <div className="sc-family-card-head"><span className="sc-family-monogram" aria-hidden="true">{String(row.name||'?').trim().split(/\s+/).slice(0,2).map((x:string)=>x[0]||'').join('').toUpperCase()}</span><div className="sc-family-person"><h2>{String(row.name||'Sin nombre')}</h2><span>{String(row.relationship||'Parentesco no registrado')}</span></div>
    {(canEdit||canDelete)&&<div className="sc-family-card-actions">{canEdit&&<button title="Editar contacto" aria-label={'Editar contacto '+row.name} onClick={()=>onEdit(row)}><PenLine size={16}/></button>}{canDelete&&<button title="Eliminar contacto" aria-label={'Eliminar contacto '+row.name} disabled={busy} onClick={()=>onDelete(row)}><Trash2 size={16}/></button>}</div>}</div>
    <div className="sc-family-student"><UserRound size={15}/><span>Alumno: <strong>{String(row.student_name||students.find(s=>String(s.id)===String(row.student_id))?.full_name||'Sin asignar')}</strong></span></div>
    <div className="sc-family-details"><div><Phone size={15}/>{row.phone?<a href={'tel:'+String(row.phone).replace(/[^+\d]/g,'')}>{String(row.phone)}</a>:<span>Sin teléfono</span>}</div>{row.email&&<div><Mail size={15}/><a href={'mailto:'+row.email}>{String(row.email)}</a></div>}</div>
    <div className="sc-family-tags"><span className={isEnabled(row.emergency)?'is-emergency':'is-neutral'}><AlertCircle size={14}/>{isEnabled(row.emergency)?'Contacto de emergencia':'No es contacto de emergencia'}</span><span className={isEnabled(row.pickup_authorized)?'is-authorized':'is-neutral'}><CheckCircle2 size={14}/>{isEnabled(row.pickup_authorized)?'Recogida autorizada':'Sin autorización de recogida'}</span></div>
   </article>)}</div>}
  </div>
 </section>;
}
