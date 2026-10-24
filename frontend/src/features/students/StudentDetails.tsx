import {useEffect,useState} from 'react';
import {ArrowLeft,BookOpen,FileText,GraduationCap,IdCard,MapPin,Phone,Plus,Users,CalendarDays} from 'lucide-react';
import {api} from '../../api';
import RecordForm from '../../shared/components/RecordForm';
import type {Field,Row} from '../../modules';
import {confirmDanger} from '../../notifications';

type DataKind='addresses'|'phones'|'contacts'|'notes';
type Kind='overview'|DataKind;
const category:{kind:Kind;title:string;description:string}[]=[
 {kind:'overview',title:'Información general',description:'Identidad, datos básicos y trayectoria escolar'},
 {kind:'addresses',title:'Direcciones',description:'Domicilios vinculados al expediente'},
 {kind:'phones',title:'Teléfonos',description:'Medios de contacto internacionales'},
 {kind:'contacts',title:'Contactos',description:'Personas autorizadas y de emergencia'},
 {kind:'notes',title:'Notas',description:'Seguimiento institucional autorizado'}
];
const fields:Record<DataKind,Field[]>={
 addresses:[
  {key:'country_code',label:'País ISO',type:'text'},
  {key:'purpose',label:'Propósito',options:[['home','Domicilio'],['fiscal','Fiscal'],['other','Otro']]},
  {key:'line1',label:'Calle y número'},{key:'line2',label:'Complemento',optional:true},
  {key:'neighborhood',label:'Colonia',optional:true},{key:'locality',label:'Localidad o municipio',optional:true},
  {key:'region',label:'Estado o región',optional:true},{key:'postal_code',label:'Código postal',optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 phones:[
  {key:'number_e164',label:'Teléfono internacional',type:'tel'},
  {key:'country_code',label:'País ISO',optional:true},
  {key:'purpose',label:'Tipo',options:[['mobile','Celular'],['home','Domicilio'],['work','Trabajo'],['emergency','Emergencia']]},
  {key:'extension',label:'Extensión',optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 contacts:[
  {key:'name',label:'Nombre de contacto'}, {key:'relationship',label:'Parentesco',optional:true},
  {key:'email',label:'Correo electrónico',type:'email',optional:true},
  {key:'emergency',label:'Contacto de emergencia',options:[['true','Sí'],['false','No']],optional:true},
  {key:'pickup_authorized',label:'Autorización de recogida',options:[['true','Sí'],['false','No']],optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 notes:[{key:'body',label:'Contenido de la nota',type:'textarea'}, {key:'category',label:'Categoría',optional:true},
  {key:'visibility',label:'Visibilidad',options:[['internal','Solo personal autorizado'],['shared','Compartida con la familia']],optional:true}]
};
const icon:Record<Kind,typeof MapPin>={overview:IdCard,addresses:MapPin,phones:Phone,contacts:Users,notes:FileText};
function title(row:Row,kind:DataKind):string{
 if(kind==='addresses')return row.line1||'Dirección';
 if(kind==='phones')return row.number_e164||'Teléfono';
 if(kind==='contacts')return row.name||'Contacto';
 return row.body?.slice(0,65)||'Nota';
}
export default function StudentDetails({student,onClose,canEdit,canWriteNotes,canViewReport=false}:{
 student:Row;onClose:()=>void;canEdit:boolean;canWriteNotes:boolean;canViewReport?:boolean;
}){
 const [kind,setKind]=useState<Kind>('overview'),[items,setItems]=useState<Row[]>([]);
 const [editing,setEditing]=useState<Row|null>(null),[creating,setCreating]=useState(false);
 const [error,setError]=useState(''),[fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [report,setReport]=useState<Row|null>(null);
 const root='students/'+student.id+'/details/';
 async function fetchItems(selected:Kind){if(selected==='overview')return;setLoading(true);
  try{setItems(await api(root+selected));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}
 }
 useEffect(()=>{void fetchItems(kind);},[student.id,kind]);
 useEffect(()=>{
   if(!canViewReport)return;
   let active=true;
   void api('students/'+student.id+'/report').then(value=>{if(active)setReport(value);}).catch(()=>undefined);
   return()=>{active=false;};
 },[student.id,canViewReport]);
 async function save(attrs:Row){setBusy(true);setError('');setFieldErrors({});
  try{
   await api(root+kind+(editing?'/'+editing.id:''),editing?'PATCH':'POST',attrs);
   setCreating(false);setEditing(null);await fetchItems(kind);
  }catch(e){const cause=e as Error & {fieldErrors?:Record<string,string[]>};setError(cause.message);setFieldErrors(cause.fieldErrors||{});}
  finally{setBusy(false);}
 }
 async function remove(row:Row){
  if(!await confirmDanger('Eliminar '+category.find(x=>x.kind===kind)?.title,'Esta información dejará de aparecer en el expediente.'))return;
  setBusy(true);setError('');
  try{await api(root+kind+'/'+row.id,'DELETE');await fetchItems(kind);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const writable=kind!=='overview'&&canEdit&&(kind!=='notes'||canWriteNotes);
 return <section className="sc-student-details" aria-label={'Expediente de '+student.full_name}>
  <div className="sc-record-hero">
   <div className="sc-record-hero-copy">
    <button className="sc-record-back" type="button" onClick={onClose}><ArrowLeft size={17}/>Volver a alumnos</button>
    <span className="eyebrow">CONTROL ESCOLAR / EXPEDIENTE DEL ALUMNO</span>
    <h1>{student.full_name}</h1>
    <p>Consulta su información personal, contactos y trayectoria en una vista completa.</p>
    <span className="sc-record-identity"><IdCard size={16}/>{student.curp||'CURP no registrada'}</span>
   </div>
   <div className="sc-record-illustration" aria-hidden="true">
    <svg viewBox="0 0 240 170" width="240" height="170">
     <rect x="46" y="23" width="148" height="120" rx="18" fill="#a7b8ff" transform="rotate(-8 120 82)"/>
     <rect x="60" y="34" width="148" height="120" rx="18" fill="#f5f7ff"/>
     <circle cx="107" cy="77" r="21" fill="#879af1"/>
     <path d="M78 123q28-44 58 0" fill="#879af1"/>
     <path d="M147 71h40M147 89h32M147 106h42" stroke="#b5c3ef" strokeWidth="8" strokeLinecap="round"/>
     <circle cx="46" cy="31" r="8" fill="#ffbb67"/>
    </svg>
    <GraduationCap size={38}/>
   </div>
  </div>
  <div className="sc-record-facts">
   <article><IdCard size={20}/><div><small>CURP</small><strong>{student.curp||'Sin registrar'}</strong></div></article>
   <article><CalendarDays size={20}/><div><small>Fecha de nacimiento</small><strong>{student.birth_date||'Sin registrar'}</strong></div></article>
   <article><Phone size={20}/><div><small>Teléfono de emergencia</small><strong>{student.emergency_phone||'Sin registrar'}</strong></div></article>
   <article><Users size={20}/><div><small>Expediente</small><strong>#{student.id}</strong></div></article>
  </div>
  <div className="sc-record-layout">
   <nav className="sc-details-tabs" aria-label="Secciones del expediente">
    {category.map(section=>{const Icon=icon[section.kind];return <button key={section.kind} aria-current={kind===section.kind?'page':undefined}
      type="button" onClick={()=>{setKind(section.kind);setEditing(null);setCreating(false);setError('');}}>
      <Icon size={18}/><span>{section.title}</span></button>;})}
   </nav>
   <section className="sc-record-content">
    {kind==='overview'?<>
      <div className="sc-details-heading"><div><span className="eyebrow">INFORMACIÓN GENERAL</span>
       <h2>Resumen del expediente</h2><p>Identidad registrada y seguimiento académico disponible.</p></div></div>
      <div className="sc-record-summary">
       <div><small>Nombre del alumno</small><strong>{student.full_name}</strong></div>
       <div><small>CURP</small><strong>{student.curp||'Pendiente'}</strong></div>
       <div><small>Fecha de nacimiento</small><strong>{student.birth_date||'Pendiente'}</strong></div>
       <div><small>Dirección registrada</small><strong>{student.address||'Consulta la sección Direcciones'}</strong></div>
      </div>
      <div className="sc-record-history-heading"><BookOpen size={20}/><h3>Trayectoria académica</h3></div>
      {report?.years?.length?report.years.map((year:Row)=><article className="sc-record-year" key={year.enrollment.id}>
        <div><strong>{year.enrollment.group_label||'Grupo escolar'}</strong><span>{year.enrollment.status||'Inscripción'}</span></div>
        <small>{year.grades?.length||0} calificaciones · {Object.entries(year.attendance||{}).map(([status,count])=>status+': '+count).join(' · ')||'Sin asistencias registradas'}</small>
       </article>):<p className="sc-details-blank">{canViewReport?'Sin inscripciones o calificaciones registradas.':'El historial académico no está disponible para tu perfil.'}</p>}
    </>:<>
     <div className="sc-details-heading"><div><span className="eyebrow">EXPEDIENTE / INFORMACIÓN RELACIONADA</span>
       <h2>{category.find(section=>section.kind===kind)?.title}</h2>
       <p>{category.find(section=>section.kind===kind)?.description}</p></div>
       {writable&&!creating&&!editing&&<button className="primary" type="button" onClick={()=>{setCreating(true);setEditing(null);}}>
         <Plus size={17}/>Agregar registro</button>}
     </div>
     {error&&<div className="error" role="alert">{error}</div>}
     {(creating||editing)&&<div className="sc-details-form"><RecordForm key={kind+'-'+(editing?.id||'new')}
       fields={fields[kind as DataKind]} initial={editing||{}}
       onSubmit={values=>void save(values)} onCancel={()=>{setEditing(null);setCreating(false);setError('');}} busy={busy}
       options={()=>[]} optionName={row=>String(row.name||row.id)} error={error} fieldErrors={fieldErrors}/></div>}
     {!creating&&!editing&&<div className="sc-details-list">
       {loading?<p>Cargando información…</p>:items.length?items.map(row=><article className="sc-details-card" key={row.id}>
         <span className="sc-details-card-icon">{kind==='addresses'?<MapPin size={21}/>:kind==='phones'?<Phone size={21}/>:kind==='contacts'?<Users size={21}/>:<FileText size={21}/>}</span>
         <div><strong>{title(row,kind as DataKind)}</strong>
          <p>{kind==='addresses'?[row.locality,row.region,row.postal_code].filter(Boolean).join(' · '):kind==='phones'?row.purpose:kind==='contacts'?[row.relationship,row.email].filter(Boolean).join(' · '):row.category}</p>
          {row.legacy_student_contact_id&&<small>Contacto vinculado a Contactos familiares</small>}
         </div>
         {writable&&!row.legacy_student_contact_id&&<div className="actions">
          <button className="secondary" type="button" onClick={()=>{setEditing(row);setFieldErrors({});}}>Editar</button>
          <button className="secondary danger" type="button" disabled={busy} onClick={()=>void remove(row)}>Eliminar</button>
         </div>}
        </article>):<p className="sc-details-blank">No existen registros en esta sección. Puedes agregar información autorizada.</p>}
     </div>}
    </>}
   </section>
  </div>
 </section>;
}
