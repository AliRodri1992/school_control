import TableEmptyState from '../../shared/components/TableEmptyState';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,BookOpen,FileText,GraduationCap,IdCard,MapPin,Phone,Plus,Users,CalendarDays,ShieldCheck,HeartHandshake,UserRoundCheck,ArrowRight,StickyNote,House,Mail,Star,PenLine,Trash2,MapPinned,Info} from 'lucide-react';
import {api} from '../../api';
import RecordForm from '../../shared/components/RecordForm';
import StudentPhoneForm from './StudentPhoneForm';
import StudentAddressForm from './StudentAddressForm';
import StudentContactForm from './StudentContactForm';
import {familyContactDisplayName,hasFamilyContactIdentityColumns,verifyFamilyContactSaved} from '../contacts/familyContactPersistence';
import DetailCollectionControls,{DetailCollectionPagination,collectionParams,initialCollectionFilters,type CollectionFilters,type CollectionMeta} from './DetailCollectionControls';
import type {Field,Row} from '../../modules';
import {FAMILY_RELATIONSHIPS} from '../../shared/relationships';
import {confirmDanger,notify} from '../../notifications';

type DataKind='addresses'|'phones'|'contacts'|'notes';
type Kind='overview'|'family'|DataKind;
const category:{kind:Kind;title:string;description:string}[]=[
 {kind:'overview',title:'Información general',description:'Identidad, datos básicos y trayectoria escolar'},
 {kind:'family',title:'Datos familiares',description:'Tutor responsable y personas vinculadas al aspirante'},
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
  {key:'name',label:'Nombre de contacto'}, {key:'relationship',label:'Parentesco',optional:true,options:FAMILY_RELATIONSHIPS.map(name=>[name,name] as [string,string])},
  {key:'email',label:'Correo electrónico',type:'email',optional:true},
  {key:'emergency',label:'Contacto de emergencia',options:[['true','Sí'],['false','No']],optional:true},
  {key:'pickup_authorized',label:'Autorización de recogida',options:[['true','Sí'],['false','No']],optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 notes:[{key:'body',label:'Contenido de la nota',type:'textarea'}, {key:'category',label:'Categoría',optional:true},
  {key:'visibility',label:'Visibilidad',options:[['internal','Solo personal autorizado'],['shared','Compartida con la familia']],optional:true}]
};
const icon:Record<Kind,typeof MapPin>={overview:IdCard,family:Users,addresses:MapPin,phones:Phone,contacts:Users,notes:FileText};
const kindDescriptions:Record<DataKind,{emptyTitle:string;emptyMessage:string;add:string;eyebrow:string}>={
 addresses:{emptyTitle:'Aún no hay direcciones registradas',emptyMessage:'Agrega el domicilio del alumno para mantener actualizado su expediente y facilitar la comunicación escolar.',add:'Agregar dirección',eyebrow:'UBICACIÓN Y DOMICILIOS'},
 phones:{emptyTitle:'Aún no hay teléfonos registrados',emptyMessage:'Registra números de contacto, especialmente uno para emergencias, con su código internacional.',add:'Agregar teléfono',eyebrow:'COMUNICACIÓN Y EMERGENCIAS'},
 contacts:{emptyTitle:'Aún no hay contactos registrados',emptyMessage:'Vincula una persona de confianza e identifica si puede atender emergencias o recoger al alumno.',add:'Agregar contacto',eyebrow:'RED DE APOYO DEL ALUMNO'},
 notes:{emptyTitle:'Todavía no hay notas de seguimiento',emptyMessage:'Las observaciones y acuerdos autorizados aparecerán aquí para acompañar el expediente escolar.',add:'Agregar nota',eyebrow:'SEGUIMIENTO INSTITUCIONAL'}
};
const yes=(value:unknown)=>value===true||value===1||value==='true'||value==='1';
const humanPurpose=(value:unknown)=>({home:'Domicilio',fiscal:'Fiscal',other:'Otro',mobile:'Celular',work:'Trabajo',emergency:'Emergencia'}[String(value)]||String(value||'Sin clasificar'));
function title(row:Row,kind:DataKind):string{
 if(kind==='addresses')return row.line1||'Dirección';
 if(kind==='phones')return row.number_e164||'Teléfono';
 if(kind==='contacts')return familyContactDisplayName(row);
 return row.body?.slice(0,65)||'Nota';
}
export default function StudentDetails({student,onClose,canEdit,canWriteNotes,canManageFamilyContacts=false,canViewReport=false}:{
 student:Row;onClose:()=>void;canEdit:boolean;canWriteNotes:boolean;canManageFamilyContacts?:boolean;canViewReport?:boolean;
}){
 const {ui}=useSchoolLocale();
 const [kind,setKind]=useState<Kind>('overview'),[items,setItems]=useState<Row[]>([]);
 const [editing,setEditing]=useState<Row|null>(null),[creating,setCreating]=useState(false);
 const [error,setError]=useState(''),[fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const [report,setReport]=useState<Row|null>(null);
 const [collection,setCollection]=useState<CollectionFilters>(initialCollectionFilters);
 const [debouncedQuery,setDebouncedQuery]=useState('');
 const [collectionMeta,setCollectionMeta]=useState<CollectionMeta>({total:0,page:1,per_page:8,total_pages:1});
 const requestSequence=useRef(0);
 const [familyContacts,setFamilyContacts]=useState<Row[]>([]),[familyLoading,setFamilyLoading]=useState(false),[familyError,setFamilyError]=useState('');
 const root='students/'+student.id+'/details/';
 async function fetchItems(selected:Kind){
  const request=++requestSequence.current;
  if(selected==='overview'||selected==='family')return;
  setLoading(true);
  try{
   const params=collectionParams({...collection,query:debouncedQuery});
   const result=await api(root+selected+'?'+params);
   if(request!==requestSequence.current)return;
   if(Array.isArray(result)){
    setItems(result);
    setCollectionMeta({total:result.length,page:1,per_page:collection.perPage,total_pages:Math.max(1,Math.ceil(result.length/collection.perPage))});
   }else{
    setItems(result.items||[]);
    setCollectionMeta({total:Number(result.total)||0,page:Number(result.page)||1,
      per_page:Number(result.per_page)||collection.perPage,total_pages:Number(result.total_pages)||1});
    if(Number(result.page)&&Number(result.page)!==collection.page)
     setCollection(previous=>({...previous,page:Number(result.page)}));
   }
   setError('');
  }catch(e){
   if(request!==requestSequence.current)return;
   setError((e as Error).message);
   setItems([]);
   setCollectionMeta({total:0,page:1,per_page:collection.perPage,total_pages:1});
  }finally{if(request===requestSequence.current)setLoading(false);}
 }
 useEffect(()=>{
  const timer=window.setTimeout(()=>setDebouncedQuery(collection.query),250);
  return()=>window.clearTimeout(timer);
 },[collection.query]);
 useEffect(()=>{void fetchItems(kind);},[student.id,kind,debouncedQuery,collection.type,collection.flag,collection.sort,collection.page,collection.perPage]);
 useEffect(()=>{
  if(kind!=='family')return;
  let active=true;
  setFamilyLoading(true);setFamilyError('');
  void api(root+'contacts').then((value:Row[])=>{if(active)setFamilyContacts(value);})
    .catch((cause:Error)=>{if(active)setFamilyError(cause.message);})
    .finally(()=>{if(active)setFamilyLoading(false);});
  return()=>{active=false;};
 },[kind,student.id]);
 useEffect(()=>{
   if(!canViewReport)return;
   let active=true;
   void api('students/'+student.id+'/report').then(value=>{if(active)setReport(value);}).catch(()=>undefined);
   return()=>{active=false;};
 },[student.id,canViewReport]);
 async function editContact(row:Row){
  setError('');setFieldErrors({});setLoading(true);
  try{
   const mirrored=Boolean(row.legacy_student_contact_id);
   if(mirrored&&!canManageFamilyContacts)throw new Error('No cuentas con permiso para editar este contacto desde Contactos familiares.');
   const persisted=await api(mirrored?'student_contacts/'+row.legacy_student_contact_id:root+'contacts/'+row.id);
   if(!hasFamilyContactIdentityColumns(persisted))throw new Error('El backend no tiene disponibles los campos separados del contacto. Comprueba la migración y reconstruye los contenedores.');
   setEditing(mirrored?{...persisted,id:row.id,legacy_student_contact_id:row.legacy_student_contact_id,
    legacy_phone:persisted.phone,primary:row.primary}:persisted);
   setCreating(false);
  }catch(cause){setError((cause as Error).message);}
  finally{setLoading(false);}
 }
 async function save(attrs:Row){setBusy(true);setError('');setFieldErrors({});
  try{
   const wasEditing=Boolean(editing);
   if(kind==='contacts'){
    const mirror=Boolean(editing?.legacy_student_contact_id);
    const endpoint=mirror?'student_contacts/'+editing!.legacy_student_contact_id:
      root+'contacts'+(editing?'/'+editing.id:'');
    const saved=await api(endpoint,editing?'PATCH':'POST',attrs);
    const normalize=(value:Row):Row=>mirror?value:{...value,phone:value.legacy_phone};
    const expected=mirror?attrs:{...attrs,phone:attrs.legacy_phone};
    verifyFamilyContactSaved(normalize(saved),expected);
    const latest=await api(mirror?'student_contacts/'+editing!.legacy_student_contact_id:
      root+'contacts/'+saved.id);
    verifyFamilyContactSaved(normalize(latest),expected);
   }else await api(root+kind+(editing?'/'+editing.id:''),editing?'PATCH':'POST',attrs);
   const noun=({addresses:'Dirección',phones:'Teléfono',contacts:'Contacto',notes:'Nota'} as Record<DataKind,string>)[kind as DataKind];
   void notify(noun+' '+(wasEditing?'actualizad':'cread')+(kind==='addresses'||kind==='notes'?'a':'o')+' exitosamente.');
   setCreating(false);setEditing(null);await fetchItems(kind);
  }catch(e){const cause=e as Error & {fieldErrors?:Record<string,string[]>};setError(cause.message);setFieldErrors(cause.fieldErrors||{});}
  finally{setBusy(false);}
 }
 async function remove(row:Row){
  const noun={addresses:'dirección',phones:'teléfono',contacts:'contacto',notes:'nota'}[kind as DataKind];
  const description={addresses:'Se eliminará el domicilio seleccionado del expediente.',phones:'Este número dejará de estar disponible para contacto escolar.',contacts:'Se eliminará la persona seleccionada y sus autorizaciones de este expediente.',notes:'Se eliminará esta nota y dejará de ser visible para los usuarios autorizados.'}[kind as DataKind];
  if(!await confirmDanger('Eliminar '+noun,'¿Confirmas que deseas eliminar '+String(title(row,kind as DataKind))+'? '+description,'Sí, eliminar',true))return;
  setBusy(true);setError('');
  try{await api(root+kind+'/'+row.id,'DELETE');await fetchItems(kind);void notify(({addresses:'Dirección',phones:'Teléfono',contacts:'Contacto',notes:'Nota'} as Record<DataKind,string>)[kind as DataKind]+' eliminado exitosamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const writable=kind!=='overview'&&kind!=='family'&&canEdit&&(kind!=='notes'||canWriteNotes);
 return <section className="sc-student-details" aria-label={'Expediente de '+student.full_name}>
  <div className="sc-record-hero">
   <div className="sc-record-hero-copy">
    <button className="sc-record-back" type="button" onClick={onClose}><ArrowLeft size={17}/>{ui('Volver al directorio')}</button>
    <span className="eyebrow">{student.enrollment_stage==='enrolled'?ui('CONTROL ESCOLAR / EXPEDIENTE DEL ALUMNO'):ui('ADMISIONES / EXPEDIENTE DEL ASPIRANTE')}</span>
    <h1>{student.full_name}</h1>
    <p>{student.enrollment_stage==='enrolled'?ui('Consulta la identidad, contactos y trayectoria escolar.'):ui('Completa los datos generales, dirección, teléfonos y contactos familiares antes del ingreso.')}</p>
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
   <article><IdCard size={20}/><div><small>{ui("CURP")}</small><strong>{student.curp||ui('Sin registrar')}</strong></div></article>
   <article><CalendarDays size={20}/><div><small>{ui("Fecha de nacimiento")}</small><strong>{student.birth_date||ui('Sin registrar')}</strong></div></article>
   <article><Phone size={20}/><div><small>{ui("Teléfono de emergencia")}</small><strong>{student.emergency_phone||ui('Sin registrar')}</strong></div></article>
   <article><Users size={20}/><div><small>{ui("Expediente")}</small><strong>#{student.id}</strong></div></article>
  </div>
  <div className="sc-record-layout">
   <nav className="sc-details-tabs" aria-label={ui("Secciones del expediente")}>
    {category.map(section=>{const Icon=icon[section.kind];return <button key={section.kind} aria-current={kind===section.kind?'page':undefined}
      type="button" onClick={()=>{setKind(section.kind);setEditing(null);setCreating(false);setError('');setCollection(initialCollectionFilters);setDebouncedQuery('');setItems([]);setCollectionMeta({total:0,page:1,per_page:8,total_pages:1});}}>
      <Icon size={18}/><span >{ui(section.title)}</span></button>;})}
   </nav>
   <section className={'sc-record-content'+(kind!=='overview'&&kind!=='family'&&(creating||editing)?' sc-record-content-form-active':'')}>
    {kind==='family'?<div className="sc-family">
     <div className="sc-details-heading"><div><span className="eyebrow">{ui('FAMILIA Y RESPONSABLES')}</span><h2>{ui('Datos familiares')}</h2><p>{ui('Consulta las personas vinculadas al alumno y sus autorizaciones de contacto y recogida.')}</p></div></div>
     <section className="sc-family-guardian" aria-label={ui('Tutor responsable')}>
      <div className="sc-family-avatar" aria-hidden="true"><Users size={28}/></div>
      <div className="sc-family-guardian-info"><span className="sc-family-eyebrow">{ui('RESPONSABLE PRINCIPAL')}</span><h3>{student.guardian_name||ui('Tutor vinculado')}</h3>
       <p>{ui('Responsable de la cuenta familiar y del seguimiento de la inscripción.')}</p>
       <span className="sc-family-id">{ui('Identificador de tutor')} #{student.guardian_id||'—'}</span></div>
      <span className="sc-family-primary"><ShieldCheck size={15}/>{ui('Tutor responsable')}</span>
     </section>
     <div className="sc-family-section-heading"><div><h3>{ui('Red de apoyo familiar')}</h3><p>{ui('Contactos adicionales registrados en el expediente del alumno.')}</p></div>
      <button className="secondary sc-family-manage" type="button" onClick={()=>setKind('contacts')}>{ui('Administrar contactos')}<ArrowRight size={16}/></button></div>
     {familyLoading?<TableEmptyState mode="loading"/>:familyError?<p className="sc-family-load-error" role="alert">{familyError}</p>:familyContacts.length?
      <><div className="sc-family-summary"><div><Users size={18}/><span>{ui('Contactos registrados')}</span><strong>{familyContacts.length}</strong></div>
       <div><HeartHandshake size={18}/><span>{ui('Contactos de emergencia')}</span><strong>{familyContacts.filter(c=>c.emergency===true).length}</strong></div>
       <div><UserRoundCheck size={18}/><span>{ui('Recogida autorizada')}</span><strong>{familyContacts.filter(c=>c.pickup_authorized===true).length}</strong></div></div>
       <div className="sc-family-cards">{familyContacts.map(contact=><article className="sc-family-card" key={contact.id}>
        <div className="sc-family-card-head"><span className="sc-family-contact-icon"><Users size={19}/></span><div><h4>{familyContactDisplayName(contact)}</h4><small>{contact.relationship||ui('Parentesco sin registrar')}</small></div></div>
        <div className="sc-family-badges">{contact.emergency===true&&<span><HeartHandshake size={14}/>{ui('Emergencia')}</span>}
         {contact.pickup_authorized===true&&<span><UserRoundCheck size={14}/>{ui('Recogida autorizada')}</span>}
         {contact.primary===true&&<span><ShieldCheck size={14}/>{ui('Principal')}</span>}</div>
        <dl>{contact.phone&&<div><dt>{ui('Teléfono')}</dt><dd>{contact.phone}</dd></div>}{contact.email&&<div><dt>{ui('Correo electrónico')}</dt><dd>{contact.email}</dd></div>}</dl>
       </article>)}</div></>:
      <div className="sc-family-empty"><HeartHandshake size={30}/><h4>{ui('Sin familiares adicionales registrados')}</h4>
       <p>{ui('El tutor responsable ya está vinculado. Puedes añadir contactos de emergencia o personas autorizadas para recoger al alumno.')}</p>
       {canEdit&&<button className="secondary" type="button" onClick={()=>setKind('contacts')}>{ui('Agregar contacto familiar')}</button>}</div>}
    </div>:kind==='overview'?<>
      <div className="sc-details-heading"><div><span className="eyebrow">{ui("INFORMACIÓN GENERAL")}</span>
       <h2>{ui("Resumen del expediente")}</h2><p>{ui("Identidad registrada y seguimiento académico disponible.")}</p></div></div>
      <div className="sc-record-overview-banner">
       <span className="sc-record-overview-badge"><IdCard size={18}/></span>
       <div><strong>{ui('Información de identificación')}</strong><p>{ui('Datos asociados al expediente. Los campos pendientes se indican sin ocultar información.')}</p></div>
       <span className="sc-record-overview-stage">{student.enrollment_stage==='enrolled'?ui('Alumno inscrito'):ui('Aspirante')}</span>
      </div>
      <dl className="sc-record-summary">
       <div><dt>{ui('Nombre completo')}</dt><dd>{student.full_name||ui('Sin registrar')}</dd></div>
       <div><dt>{ui('CURP')}</dt><dd>{student.curp||ui('Sin registrar')}</dd></div>
       <div><dt>{ui('Fecha de nacimiento')}</dt><dd>{student.birth_date||ui('Sin registrar')}</dd></div>
       <div><dt>{ui('Domicilio')}</dt><dd>{student.address||ui('Consultar la sección Direcciones')}</dd></div>
      </dl>
      <div className="sc-record-history-heading"><BookOpen size={20}/><div><h3>{ui("Trayectoria académica")}</h3><p>{ui('Ciclos, grupos y actividad académica disponibles para este expediente.')}</p></div></div>
      {student.enrollment_stage!=='enrolled'?<div className="sc-record-academic-empty" role="status"><img src="/illustrations/auli-explain.svg" alt="" /><div><strong>{ui('Trayectoria pendiente de inscripción')}</strong><p>{ui('Cuando se formalice la inscripción, aparecerán aquí los ciclos académicos del alumno.')}</p></div></div>:
       report?.years?.length?<div className="sc-record-academic-timeline" aria-label={ui('Historial de ciclos académicos')}>
        {[...report.years].reverse().map((year:Row,index:number)=>{
         const enrollment=year.enrollment||{};
         const attendance=Object.entries(year.attendance||{}).filter(([,count])=>Number(count)>0);
         const totalAttendance=attendance.reduce((total,[,count])=>total+Number(count),0);
         const grades=Array.isArray(year.grades)?year.grades:[];
         const status=String(enrollment.status||'');
         return <article className="sc-record-academic-entry" key={enrollment.id||index}>
          <span className="sc-record-academic-step" aria-hidden="true">{index+1}</span>
          <div className="sc-record-academic-card">
           <div className="sc-record-academic-card-head">
            <div><span className="sc-record-academic-eyebrow">{ui('CICLO ACADÉMICO')}</span><h4>{enrollment.academic_year_name||enrollment.year_name||ui('Ciclo sin nombre')}</h4>
             <p><GraduationCap size={16}/>{enrollment.group_label||ui('Grupo no asignado')}</p></div>
            <span className={'sc-record-academic-state'+(status==='active'?' is-active':status==='completed'?' is-completed':'')}>{ui(status==='active'?'En curso':status==='completed'?'Finalizado':status||'Sin estado')}</span>
           </div>
           <div className="sc-record-academic-stats">
            <div><BookOpen size={18}/><span><strong>{grades.length}</strong><small>{ui('Calificaciones registradas')}</small></span></div>
            <div><CalendarDays size={18}/><span><strong>{totalAttendance}</strong><small>{ui('Registros de asistencia')}</small></span></div>
            <div><ShieldCheck size={18}/><span><strong>{enrollment.outcome?ui(String(enrollment.outcome)):ui('Pendiente')}</strong><small>{ui('Resultado del ciclo')}</small></span></div>
           </div>
           {attendance.length>0?<div className="sc-record-academic-attendance"><strong>{ui('Detalle de asistencia')}</strong><div>{attendance.map(([key,count])=><span key={key}>{ui(key)} <b>{Number(count)}</b></span>)}</div></div>:
            <p className="sc-record-academic-no-data">{ui('Todavía no existen asistencias registradas para este ciclo.')}</p>}
          </div>
         </article>;
        })}
       </div>:<div className="sc-record-academic-empty"><img src="/illustrations/auli-explain.svg" alt=""/><div><strong>{ui(canViewReport?'Sin trayectoria académica disponible':'Trayectoria con acceso restringido')}</strong><p>{ui(canViewReport?'Cuando existan inscripciones formalizadas y resultados capturados, se mostrarán aquí.':'Necesitas autorización para consultar los resultados académicos de este alumno.')}</p></div></div>}
    </>:<>
     <div className={'sc-details-heading'+(creating||editing?' sc-details-section-heading':'')}><div><span className="eyebrow">{ui(kindDescriptions[kind as DataKind].eyebrow)}</span>
       <h2>{ui(category.find(section=>section.kind===kind)?.title||'')}</h2>
       <p>{ui(category.find(section=>section.kind===kind)?.description||'')}</p></div>
       {writable&&!creating&&!editing&&!loading&&items.length>0&&<button className="primary" type="button" onClick={()=>{setCreating(true);setEditing(null);}}>
         <Plus size={17}/>{ui(kindDescriptions[kind as DataKind].add)}</button>}
     </div>
     {error&&kind!=='contacts'&&kind!=='addresses'&&<div className="error" role="alert">{error}</div>}
       {error&&kind==='addresses'&&!creating&&!editing&&<div className="error" role="alert">{error}</div>}
      {error&&kind==='contacts'&&!creating&&!editing&&<div className="error" role="alert">{error}</div>}
     {(creating||editing)&&<div className="sc-details-form sc-dossier-form-shell sc-dossier-composed">
       <header className="sc-dossier-form-hero"><span className="sc-dossier-form-hero-icon">{kind==='addresses'?<MapPin size={24}/>:kind==='phones'?<Phone size={24}/>:kind==='contacts'?<Users size={24}/>:<StickyNote size={24}/>}</span><div><span>{ui(editing?'EDITAR INFORMACIÓN':'NUEVO REGISTRO')}</span><h3>{ui(editing?'Editar ':'Agregar ')+ui({addresses:'dirección',phones:'teléfono',contacts:'contacto',notes:'nota'}[kind as DataKind])}</h3><p>{ui(kind==='addresses'?'Actualiza la ubicación, las referencias y el domicilio principal del alumno.':'Completa los datos del expediente. Los campos obligatorios están identificados.')}</p></div></header>
       <div className="sc-dossier-form-body">{kind==='addresses'?<StudentAddressForm
         key={'address-'+(editing?.id||'new')} initial={editing||{}} studentName={String(student.full_name||student.name||'alumno')}
         busy={busy} error={error} fieldErrors={fieldErrors} onSubmit={values=>void save(values)}
         onCancel={()=>{setEditing(null);setCreating(false);setError('');setFieldErrors({});}}/>:
        kind==='contacts'?<StudentContactForm key={'contact-'+(editing?.id||'new')}
        initial={editing||{}} studentName={String(student.full_name||student.name||'Alumno')} busy={busy} error={error} fieldErrors={fieldErrors}
        onSave={values=>void save(values)} onCancel={()=>{setEditing(null);setCreating(false);setError('');}}/>:
        kind==='phones'?<StudentPhoneForm key={'phone-'+(editing?.id||'new')} initial={editing||{}} onSubmit={values=>void save(values)} onCancel={()=>{setEditing(null);setCreating(false);setError('');}} busy={busy} error={error} fieldErrors={fieldErrors}/>:<RecordForm layout={kind as Exclude<DataKind,'phones'>} key={kind+'-'+(editing?.id||'new')}
       fields={fields[kind as DataKind].map(field=>({...field,label:ui(field.label),options:field.options?.map(([id,label])=>[id,ui(label)] as [string,string])}))} initial={editing||{}}
       onSubmit={values=>void save(values)} onCancel={()=>{setEditing(null);setCreating(false);setError('');}} busy={busy}
       options={()=>[]} optionName={row=>String(row.name||row.id)} error={error} fieldErrors={fieldErrors}/>}</div></div>}
     {!creating&&!editing&&<div className="sc-details-list">
       {(collectionMeta.total>0||items.length>0||collection.query||collection.type||collection.flag)&&
        <DetailCollectionControls key={kind} kind={kind as DataKind} filters={collection} meta={collectionMeta} onChange={setCollection}/>}
       {loading?<div className="sc-details-loading" role="status"><span className="sc-details-skeleton"/><span className="sc-details-skeleton"/><span>{ui('Cargando información…')}</span></div>:
       items.length?<><div className="sc-details-collection-head"><span><Info size={15}/>{collectionMeta.total} {ui(collectionMeta.total===1?'registro disponible':'registros disponibles')}</span><small>{ui('Información vinculada a este alumno')}</small></div>
        <div className="sc-details-card-grid">{items.map(row=>{
         const Icon=kind==='addresses'?MapPinned:kind==='phones'?Phone:kind==='contacts'?Users:StickyNote;
         const details=kind==='addresses'?[row.line2,row.neighborhood,row.locality,row.region,row.postal_code].filter(Boolean).join(' · '):
           kind==='phones'?[humanPurpose(row.purpose),row.extension?ui('Extensión')+' '+row.extension:''].filter(Boolean).join(' · '):
           kind==='contacts'?[row.relationship,row.email].filter(Boolean).join(' · '):String(row.category||ui('Seguimiento general'));
         return <article className={'sc-details-card sc-details-card-'+kind} key={row.id}>
          <div className="sc-details-card-top"><span className="sc-details-card-icon"><Icon size={21}/></span>
           <div className="sc-details-card-main"><h3>{title(row,kind as DataKind)}</h3><p>{details||ui('Información complementaria sin registrar')}</p></div>
           {yes(row.primary)&&<span className="sc-details-chip is-primary"><Star size={13}/>{ui('Principal')}</span>}
          </div>
          {kind==='addresses'&&<div className="sc-details-card-detail"><House size={15}/>{ui(humanPurpose(row.purpose))}{row.country_code?' · '+row.country_code:''}</div>}
          {kind==='phones'&&<div className="sc-details-card-detail"><Phone size={15}/><a href={'tel:'+String(row.number_e164||'')}>{row.number_e164}</a></div>}
          {kind==='contacts'&&<div className="sc-details-card-chips">
           <span className={'sc-details-chip'+(yes(row.emergency)?' is-alert':'')}>{yes(row.emergency)?ui('Contacto de emergencia'):ui('Contacto adicional')}</span>
           {yes(row.pickup_authorized)&&<span className="sc-details-chip is-authorized"><ShieldCheck size={13}/>{ui('Recogida autorizada')}</span>}
           {row.email&&<a className="sc-details-chip is-email" href={'mailto:'+row.email}><Mail size={13}/>{row.email}</a>}
            {row.legacy_phone&&<a className="sc-details-chip is-phone" href={'tel:'+String(row.legacy_phone).replace(/[^+\d]/g,'')}><Phone size={13}/>{row.legacy_phone}</a>}
          </div>}
          {kind==='notes'&&<div className="sc-details-card-chips"><span className="sc-details-chip"><StickyNote size={13}/>{ui(row.category||'General')}</span><span className="sc-details-chip">{ui(row.visibility==='shared'?'Compartida con la familia':'Nota institucional')}</span></div>}
          {row.legacy_student_contact_id&&<p className="sc-details-linked"><Users size={14}/>{ui('Gestionado desde Contactos familiares')}</p>}
          {writable&&(!row.legacy_student_contact_id||canManageFamilyContacts)&&<div className="sc-details-card-actions">
           <button className="secondary" type="button" disabled={busy||loading} onClick={()=>{if(kind==='contacts')void editContact(row);else{setEditing(row);setFieldErrors({});}}}><PenLine size={15}/>{ui('Editar')}</button>
           {!row.legacy_student_contact_id&&<button className="secondary danger" type="button" disabled={busy} onClick={()=>void remove(row)}><Trash2 size={15}/>{ui('Eliminar')}</button>}
          </div>}
         </article>;
        })}</div><DetailCollectionPagination filters={collection} meta={collectionMeta} onChange={setCollection}/></>:
        <div className="sc-details-empty">
         <div className="sc-details-empty-art sc-details-empty-auli" aria-hidden="true"><img src="/illustrations/auli-explain.svg" alt=""/></div>
         <span className="sc-details-empty-eyebrow">{ui(collection.query||collection.type||collection.flag?'SIN COINCIDENCIAS':'EXPEDIENTE SIN REGISTROS')}</span>
         <h3>{ui(collection.query||collection.type||collection.flag?'No se encontraron registros con estos filtros':kindDescriptions[kind as DataKind].emptyTitle)}</h3>
         <p>{ui(collection.query||collection.type||collection.flag?'Prueba una búsqueda diferente o limpia los filtros para mostrar todos los registros.':kindDescriptions[kind as DataKind].emptyMessage)}</p>
         {(collection.query||collection.type||collection.flag)?<button type="button" className="secondary" onClick={()=>{setCollection(initialCollectionFilters);setDebouncedQuery('');}}>{ui('Limpiar filtros')}</button>:
         writable?<button type="button" className="primary" onClick={()=>{setCreating(true);setEditing(null);}}><Plus size={16}/>{ui(kindDescriptions[kind as DataKind].add)}</button>:
          <small>{ui('La consulta está disponible; no tienes permisos para agregar registros en esta sección.')}</small>}
        </div>}
     </div>}
    </>}
   </section>
  </div>
 </section>;
}
