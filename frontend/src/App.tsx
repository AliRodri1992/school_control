function loadRememberedFilters(userId:unknown,page:string){
 try{
  const prefs=JSON.parse(localStorage.getItem('school-preferences')||'{}');
  if(!prefs.remember_filters||!userId)return null;
  const saved=JSON.parse(localStorage.getItem('school-filters-'+userId+'-'+page)||'null');
  return saved&&typeof saved==='object'&&typeof saved.query==='string'&&
   typeof saved.statusFilter==='string'&&typeof saved.sorting==='string'?saved:null;
 }catch{return null;}
}
import SchoolBootScreen,{type BootStage} from './features/boot/SchoolBootScreen';
import SessionRestoreScreen from './features/boot/SessionRestoreScreen';
import {waitForMinimumBootVisibility} from './features/boot/bootVisibility';
import TableEmptyState from './shared/components/TableEmptyState';
import Combobox from './shared/components/Combobox';
import TableAction from './shared/components/TableAction';
const HelpCenter=lazy(()=>import('./features/help/HelpCenter'));
const LegalInformation=lazy(()=>import('./features/legal/LegalInformation'));
const loadPortalHome=()=>import('./features/portal/PortalHome');
const PortalHome=lazy(loadPortalHome);
const Preferences=lazy(()=>import('./features/preferences/Preferences'));
const StudentDetails=lazy(()=>import('./features/students/StudentDetails'));
import StudentRowActions from './features/students/StudentRowActions';
import {studentInitials,studentDirectoryStats} from './features/students/studentDirectory';
import {useStudentReport} from './features/students/useStudentReport';
const EmailTemplateDesigner=lazy(()=>import('./features/mail/EmailTemplateDesigner'));
const ApiDocs=lazy(()=>import('./features/api/ApiDocs'));
import RecordForm from './shared/components/RecordForm';
const LanguageManager=lazy(()=>import('./features/languages/LanguageManager'));
import {useLocation,useNavigate} from 'react-router-dom';
const ImportWizard=lazy(()=>import('./features/imports/ImportWizard'));
import {confirmDanger} from './notifications';
import {PortalChrome} from './shell/PortalChrome';
import {currentPortal,resolvePortalLocation,makePortalUrl,canImportFromPermissions,isStudentRecordUrl,studentRecordUrl} from './shell/portalNavigation';
import Login from './auth/Login';
const Reports=lazy(()=>import('./Reports'));
const AccessRoles=lazy(()=>import('./AccessRoles'));
const GradeActions=lazy(()=>import('./GradeActions'));
const PasswordRecovery=lazy(()=>import('./PasswordRecovery'));
const Notifications=lazy(()=>import('./NotificationsCenter'));
const Profile=lazy(()=>import('./Profile'));
const Classroom=lazy(()=>import('./Classroom'));
const Documents=lazy(()=>import('./Documents'));
const Messages=lazy(()=>import('./Messages'));
import LogoUploader from './LogoUploader';
import {notify} from './notifications';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {BookOpen, Plus, Search, X, Check, Printer, GraduationCap} from 'lucide-react';
import {api,timeLabel,mean} from './api';
import type {ModuleLoadError} from './shared/data/loadPortalCollections';
import {loadPortalSnapshot} from './shared/data/loadPortalSnapshot';
import {modules,labels,localizedModules,type Row,type Field} from './modules';
import {useInterfaceLocale} from './shared/i18n/LocaleContext';
const pagePermission=(key:string)=>({schedule:'schedule_slots.index',school:'schools.update',documents:'student_documents.index',classroom:'assignments.index',dashboard:'dashboard.show',imports:'students.create',languages:'access_roles.update',api_docs:'access_roles.index'} as Record<string,string>)[key]||(key+'.index');
const localDateTime = (value: string) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16); };
export default function App(){
 const {locale,ui}=useInterfaceLocale();
 const translatedModules=localizedModules(ui);
 const display=(value:any):string=>value===true?ui('Sí'):value===false?ui('No'):value==null||value===''?'—':ui(labels[value]||String(value));
 const readableDate=(value:string)=>new Date(value).toLocaleString(locale==='en'?'en-US':'es-MX',{dateStyle:'medium',timeStyle:'short'});
 const navigate=useNavigate();const location=useLocation();
 const [resetToken,setResetToken]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('reset-password')||'');
 useEffect(()=>{if(resetToken)window.history.replaceState(null,'',window.location.pathname+window.location.search);},[resetToken]);
 function signedOut(){setUser(null);setData({});setSummary({});setPage('dashboard');setError('');setResetToken('');navigate('/login',{replace:true});}

 const [user,setUser] = useState<Row|null>(null),[school,setSchool] = useState<Row>({name:'Aula'});
 const [loadingStage,setLoadingStage]=useState<BootStage>('connecting');
 const [restoringSession,setRestoringSession]=useState(true);
 const [preparingLogin,setPreparingLogin]=useState(false);
 const bootReadyRef=useRef<(()=>void)|null>(null);
 const [page,setPage] = useState(()=>new URLSearchParams(window.location.search).has('verify_email')?'profile':'dashboard'),[data,setData] = useState<Record<string,Row[]>>({}),[summary,setSummary] = useState<Row>({});
 const [error,setError] = useState(''),[notice,setNotice] = useState(''),[query,setQuery] = useState(''),[mobile,setMobile] = useState(false),[busy,setBusy] = useState(false);
 const [detailStudent,setDetailStudent]=useState<Row|null>(null);
 const [studentRecordLoading,setStudentRecordLoading]=useState(false);
 const [dialog,setDialog] = useState<{title:string;fields:Field[];values:Row;submit:(values:Row)=>Promise<void>}|null>(null);
 const {report,loadingStudentId:reportLoadingStudentId,error:reportError,
  open:openStudentReport,close:closeStudentReport,clearError:clearStudentReportError} = useStudentReport(id=>api(`students/${id}/report`));
 const [groupFilter,setGroupFilter] = useState('');
 const [sorting,setSorting]=useState('');
 const [ascending,setAscending]=useState(true),[pageNumber,setPageNumber]=useState(0),[pageSize,setPageSize]=useState(15),[statusFilter,setStatusFilter]=useState(''),[advanced,setAdvanced]=useState(false);
 const [selectedChild,setSelectedChild]=useState('');
 const [fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});
 const [moduleLoadErrors,setModuleLoadErrors]=useState<Record<string,ModuleLoadError>>({});
 const portal=currentPortal(user?.role||'admin');
 function go(next:string) {
   if(next==='imports'&&!canImportFromPermissions(user?.permissions))return;
   if(next!=='imports'&&next!=='profile'&&next!=='notifications'&&next!=='messages'&&next!=='preferences'&&next!=='help'&&next!=='privacy'&&next!=='terms'&&!user?.permissions?.[pagePermission(next)]?.length)return;
   if(next!=='student_details')setDetailStudent(null);
   closeStudentReport();
   const remembered=loadRememberedFilters(user?.id,next);
   setPage(next);setQuery(remembered?.query||'');setNotice('');setMobile(false);setPageNumber(0);
   setStatusFilter(remembered?.statusFilter||'');setSorting(remembered?.sorting||'');
   const url=makePortalUrl(portal,next);
   if(location.pathname!==url)navigate(url);
 }
 useEffect(()=>{
   if(!user)return;
   const base=makePortalUrl(currentPortal(user.role),'dashboard');
   if(!location.pathname.startsWith(base)){navigate(base,{replace:true});return;}
   const studentBase=makePortalUrl(currentPortal(user.role),'students')+'/';
   if(isStudentRecordUrl(location.pathname,user.role,user.permissions)){
     const id=location.pathname.slice(studentBase.length);
     if(!/^\d+$/.test(id)||!user.permissions?.['students.show']?.length){navigate(base,{replace:true});return;}
     setPage('student_details');
     setDetailStudent(existing=>String(existing?.id)===id?existing:null);
     let active=true;
     setStudentRecordLoading(true);
     void api('students/'+id).then(record=>{if(active)setDetailStudent(record);})
       .catch(error=>{if(active){setError((error as Error).message);setDetailStudent(null);}})
       .finally(()=>{if(active)setStudentRecordLoading(false);});
     return ()=>{active=false;};
   }
   setDetailStudent(null);
   setStudentRecordLoading(false);
   const selected=resolvePortalLocation(location.pathname,user.role,user.permissions);
   setPage(selected);
   if(selected==='dashboard'&&location.pathname!==base)navigate(base,{replace:true});
 },[user?.id,user?.role,location.pathname]);

 useEffect(()=>{
   if(!user||user.role!=='guardian')return;
   const saved=localStorage.getItem('school-child-'+user.id)||'';
   setSelectedChild((data.students||[]).some(s=>String(s.id)===saved)?saved:'');
 },[user?.id,user?.role,data.students]);
 function openStudentRecord(record:Row){
   if(!can('students.show'))return;
   setDetailStudent(record);
   setPage('student_details');
   setMobile(false);
   navigate(studentRecordUrl(portal,record.id));
 }
 function selectChild(id:string){setSelectedChild(id);setPageNumber(0);if(user)localStorage.setItem('school-child-'+user.id,id);
  void api('preferences','PATCH',{selected_child_id:id?Number(id):null}).catch(e=>setError((e as Error).message));}
 async function hydratePortal(who:Row){
   const snapshot=await loadPortalSnapshot(who,api,Object.keys(modules));
   setData(snapshot.data);
   setModuleLoadErrors(snapshot.errors);
   setSummary(snapshot.summary);
   if(snapshot.summaryError)setError(snapshot.summaryError);
 }
 async function refresh(who = user){
   if(!who)return;
   const session=await api('session');
   const current=session.user as Row|null;
   setUser(current);
   if(!current){signedOut();return;}
   await hydratePortal(current);
 }
 useEffect(()=>{
   let active=true;
   void Promise.all([api('session'),api('school')])
     .then(async ([session,branding])=>{
       if(!active)return;
       setSchool(branding);
       setUser(session.user);
       if(session.user)await hydratePortal(session.user);
     })
     .catch(cause=>{if(active)setError((cause as Error).message);})
     .finally(()=>{if(active)setRestoringSession(false);});
   return ()=>{active=false;};
 },[]);
 async function perform(action:()=>Promise<void>){setError('');setFieldErrors({});setBusy(true);try{await action();void notify('Cambios guardados correctamente.');await refresh();}catch(e){setError((e as Error).message);setFieldErrors((e as Error & {fieldErrors?:Record<string,string[]>}).fieldErrors||{});}finally{setBusy(false);}}
 function options(source:string, values:Row = {}):Row[]{
   if(source==='guardians')return (data.users||[]).filter(x=>x.role==='guardian');
   if(source==='teachers')return (data.users||[]).filter(x=>x.role==='teacher'&&x.active);
   if(source==='active_enrollments'){
     const course = (data.courses||[]).find(x=>String(x.id)===String(values.course_id));
     return (data.enrollments||[]).filter(x=>x.status==='active'&&(!course||x.group_id===course.group_id)).map(x=>({...x,label:`${x.student_name} · ${x.group_label}`}));
   }
   return data[source]||[];
 }
 const optionName = (row:Row) => row.label||row.full_name||row.name||row.title||String(row.id);
 function createOrEdit(record?:Row){
   const module = translatedModules[page];
   let fields = module.fields.filter(f=>!(f.key==='guardian_id'&&user?.role==='guardian'));
   if(page==='student_contacts'&&record)fields=fields.filter(f=>f.key!=='student_id');
   if(page==='users'&&record)fields=fields.filter(f=>['name','email'].includes(f.key));
   setFieldErrors({});setDialog({title:`${ui(record?'Editar':'Registrar')} ${module.singular}`,fields,values:record||{},submit:async(values)=>{
     const updateAsCreate=['attendances','grades'].includes(page);
     await api(record&&!updateAsCreate?`${page}/${record.id}`:page,record&&!updateAsCreate?'PATCH':'POST',values);setDialog(null);
   }});
 }
 function approve(record:Row){
   const groups = (data.groups||[]).filter(g=>g.academic_year_id===record.academic_year_id&&g.grade_level===record.grade_level);
   setDialog({title:`${ui('Aprobar solicitud')} · ${record.student_name}`,fields:[{key:'group_id',label:ui('Asignar grupo'),options:groups.map(g=>[String(g.id),`${g.label} · ${g.capacity-g.occupied} ${ui(' lugares').trim()}`])}],values:{},submit:async values=>{await api(`admissions/${record.id}/approve`,'POST',values);setDialog(null);}});
 }
 function reject(record:Row){setDialog({title:ui('Rechazar solicitud'),fields:[{key:'reason',label:ui('Motivo para la familia'),type:'textarea'}],values:{},submit:async values=>{await api(`admissions/${record.id}/reject`,'POST',values);setDialog(null);}});}
 function complete(record:Row){
   const group=(data.groups||[]).find(g=>g.id===record.group_id);
   setDialog({title:`Cerrar ciclo · ${record.student_name}`,fields:[{key:'outcome',label:ui('Resultado académico'),options:group?.grade_level===6?[['graduated',ui('Egresado')],['repeat',ui('Repite sexto')]]:[['promoted',ui('Promovido al siguiente grado')],['repeat',ui('Repite grado')]]}],values:{},submit:async values=>{await api(`enrollments/${record.id}/complete`,'POST',values);setDialog(null);}});
 }
 function manualSlot(){setDialog({title:ui('Agregar sesión al horario'),fields:[{key:'course_id',label:ui('Clase'),source:'courses'},{key:'weekday',label:ui('Día'),options:['Lunes','Martes','Miércoles','Jueves','Viernes'].map((x,i)=>[String(i+1),ui(x)])},{key:'start',label:ui('Inicio'),type:'time'},{key:'end',label:ui('Fin'),type:'time'},{key:'room',label:ui('Aula')}],values:{},submit:async values=>{
   const minute=(value:string)=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
   await api('schedule_slots','POST',{...values,starts_minute:minute(values.start),ends_minute:minute(values.end)});setDialog(null);
 }});}
 const can=(key:string)=>!!user?.permissions?.[key]?.length;
 function searchGo(page:string,search?:string){
  if(!user?.permissions?.[pagePermission(page)]?.length)return;
  go(page);if(search)setQuery(search);
 }

 const editable = can(`${page}.create`);
 const linkedEnrollments=new Set((data.enrollments||[]).filter(e=>String(e.student_id)===selectedChild).map(e=>String(e.id)));
 const records=(data[page]||[]).filter(row=>{
  if(user?.role==='guardian'&&selectedChild){
   if(page==='students'&&String(row.id)!==selectedChild)return false;
   if(row.student_id&&String(row.student_id)!==selectedChild)return false;
   if(row.enrollment_id&&!linkedEnrollments.has(String(row.enrollment_id)))return false;
  }
  return (!statusFilter||String(row.status||'')===statusFilter)&&JSON.stringify(Object.values(row)).toLowerCase().includes(query.toLowerCase());
 }).sort((a,b)=>!sorting?0:String(a[sorting]??'').localeCompare(String(b[sorting]??''),locale==='en'?'en-US':'es-MX',{numeric:true})*(ascending?1:-1));
 const statuses=[...new Set((data[page]||[]).map(row=>String(row.status||'')).filter(Boolean))].sort();
 const pages=Math.max(1,Math.ceil(records.length/pageSize));
 const currentPage=Math.min(pageNumber,pages-1);
 const shownRows=records.slice(currentPage*pageSize,(currentPage+1)*pageSize);
 useEffect(()=>{
  if(!user)return;
  try{
   const prefs=JSON.parse(localStorage.getItem('school-preferences')||'{}');
   if(prefs.remember_filters)localStorage.setItem('school-filters-'+user.id+'-'+page,JSON.stringify({query,statusFilter,sorting}));
  }catch{/* Storage may be disabled by browser policy. */}
 },[user?.id,page,query,statusFilter,sorting]);
 function sortBy(key:string){if(sorting===key)setAscending(value=>!value);else{setSorting(key);setAscending(true);}setPageNumber(0);}

 if(restoringSession)return <SessionRestoreScreen locale={locale}/>;
 if(preparingLogin)return <SchoolBootScreen locale={locale} stage={loadingStage} onReady={bootReadyRef.current??undefined}/>;
 if(resetToken)return <Suspense fallback={<div className="boot" role="status">{ui('Cargando recuperación de contraseña…')}</div>}><PasswordRecovery schoolName={school.name} token={resetToken} onClose={signedOut}/></Suspense>;
 if(!user)return <Login school={school} initialError={error} onLogin={async account=>{
   const startedAt=performance.now();
   const screenReady=new Promise<void>(resolve=>{bootReadyRef.current=resolve;});
   setError('');
   setLoadingStage('connecting');
   setPreparingLogin(true);
   try{
     // Wait until Auli's preparation screen has been rendered and painted.
     await screenReady;
     const session=await api('session');
     if(!session.user)throw new Error('No se pudo recuperar la sesión iniciada.');
     setLoadingStage('modules');
     // Keep the original preparation scene until data and the dashboard code are ready.
     await Promise.all([hydratePortal(session.user),loadPortalHome()]);
     await waitForMinimumBootVisibility(startedAt);
     setUser(session.user);
   }catch(cause){
     setUser(null);
     setError((cause as Error).message);
     throw cause;
   }finally{
     bootReadyRef.current=null;
     setPreparingLogin(false);
   }
 }}/>;
 return <PortalChrome user={user} school={school} page={page} mobile={mobile} onMobile={setMobile}
 can={can} pendingAdmissions={Number(summary.pending_admissions||0)} onNavigate={go}
 onSearchNavigate={searchGo} onSearchStudent={openStudentRecord} searchCollections={data} 
  childrenList={user.role==='guardian'?data.students||[]:[]} selectedChildId={selectedChild} onSelectChild={selectChild}
 onSignOut={async()=>{try{await api('session','DELETE');signedOut();void notify('Sesión cerrada correctamente.');}catch(e){setError((e as Error).message);}}}>
 <Suspense fallback={<div className="content" role="status"><p>{ui('Cargando módulo…')}</p></div>}><div className="content">{error&&<div className="error" role="alert">{error}<button aria-label={ui('Cerrar error')} onClick={()=>setError('')}><X size={16}/></button></div>}{reportError&&<div className="error" role="alert">{reportError}<button aria-label={ui('Cerrar error de boleta')} onClick={clearStudentReportError}><X size={16}/></button></div>}{notice&&<div className="success" role="status"><Check size={16}/>{notice}</div>}
 {page==='student_details'?(detailStudent?<StudentDetails key={detailStudent.id} student={detailStudent} onClose={()=>go('students')}
    canEdit={can('students.update')} canWriteNotes={!!user.permissions?.['students.update']?.includes('institution')}
    canViewReport={can('students.report')}/>:
    <section className="sc-record-loading" role="status">{studentRecordLoading?ui('Cargando expediente del alumno…'):ui('No fue posible consultar este expediente.')}
      <button className="secondary" onClick={()=>go('students')}>{ui('Volver a alumnos')}</button>
    </section>):
  page==='dashboard'?<PortalHome user={user} summary={summary} data={data} can={can}
  onNavigate={go} selectedChildId={selectedChild} onSelectChild={selectChild}/>:
  page==='reports'?<Reports data={data}/>:
 page==='imports'?<ImportWizard/>:
 page==='languages'?<LanguageManager/>:
 page==='api_docs'?<ApiDocs/>:
 page==='email_templates'?<EmailTemplateDesigner schoolName={school.name}/>:
  page==='access_roles'?<AccessRoles can={can} onChanged={()=>refresh()}/>:
 page==='help'?<HelpCenter role={user.role} can={can} onNavigate={go}/>:
  (page==='privacy'||page==='terms')?<LegalInformation kind={page} onHelp={()=>go('help')}/>:
  page==='preferences'?<Preferences onSaved={prefs=>setPageSize(prefs.rows_per_page)}/>:
  page==='profile'?<Profile onChange={setUser} onSignedOut={signedOut} onNavigate={go}/>:
 page==='notifications'?<Notifications navigate={target=>{if(target==='profile'||target==='notifications'||target==='messages'||modules[target]||['dashboard','reports','classroom','documents','schedule','school','access_roles'].includes(target))go(target);}}/>:
 page==='classroom'?<Classroom user={user} courses={data.courses||[]} enrollments={data.enrollments||[]}/>:
 page==='documents'?<Documents students={(data.students||[]).filter(s=>user.role!=='guardian'||!selectedChild||String(s.id)===selectedChild)} admin={can('student_documents.review')}/>:
 page==='messages'?<Messages userId={user.id}/>:
 page==='school'?<SchoolSettings school={school} busy={busy} onSave={form=>perform(async()=>setSchool(await api('school','PATCH',form)))}/>:
 page==='schedule'?<><div className="page-heading"><div><div className="eyebrow">{ui('ORGANIZA TU SEMANA')}</div><h1>{ui('Horarios')}</h1><p>{ui('Cada clase en su lugar. Sin cruces de grupo, docente ni aula.')}</p></div>{can('schedule_slots.create')&&<button className="primary" onClick={manualSlot}><Plus size={18}/>{ui('Agregar sesión')}</button>}</div><div className="toolbar"><div className="sc-toolbar-filter"><label>{ui('Grupo')}</label><Combobox label={ui('Filtrar por grupo')} value={groupFilter} onChange={setGroupFilter}
      placeholder={ui('Todos mis grupos')} options={(data.groups||[]).map(g=>({value:String(g.id),label:g.label}))}/></div>{can('groups.generate_schedule')&&<button className="primary" disabled={!groupFilter||busy} onClick={()=>perform(async()=>{await api(`groups/${groupFilter}/generate_schedule`,'POST');})}>{ui('Generar horario del grupo')}</button>}</div><div className="week-grid">{['Lunes','Martes','Miércoles','Jueves','Viernes'].map((day,i)=><section key={day}><h3>{ui(day)}</h3>{(data.schedule_slots||[]).filter(s=>s.weekday===i+1&&(!groupFilter||String(s.group_id)===groupFilter)).map(slot=><article key={slot.id}><small>{timeLabel(slot.starts_minute)} — {timeLabel(slot.ends_minute)}</small><strong>{slot.course_label}</strong><p>{slot.teacher_name}</p><span>{slot.room}</span>{can('schedule_slots.destroy')&&<button className="text-button danger" disabled={busy} onClick={()=>perform(async()=>{await api(`schedule_slots/${slot.id}`,'DELETE');})} >{ui('Eliminar')}</button>}</article>)}</section>)}</div><p className="footnote">{ui('Generador: sesiones de 50 minutos, lunes a viernes; descanso de 10:30 a 11:00. La carga se define en Clases.')}</p></>:
 <><div className={'page-heading'+(page==='students'?' sc-students-heading':'')}><div><div className="eyebrow">{page==='students'?ui('GESTIÓN ESCOLAR / ALUMNOS'):user.role==='student'?ui('MI APRENDIZAJE'):ui('GESTIÓN ESCOLAR')}</div><h1>{page==='students'?ui('Alumnos y expedientes'):translatedModules[page].title}</h1><p>{translatedModules[page].subtitle}</p></div>{editable&&<button className="primary" onClick={()=>createOrEdit()}><Plus size={18}/>{ui('Registrar')} {translatedModules[page].singular}</button>}</div>
 {page==='students'&&<section className="sc-students-overview" aria-label={ui('Resumen de alumnos')}><div className="sc-students-overview-intro"><span>{ui('DIRECTORIO ESCOLAR')}</span><strong>{ui('Cada expediente, una trayectoria por acompañar')}</strong><p>{ui('Accede a datos de identificación, contactos autorizados y seguimiento académico desde un mismo lugar.')}</p></div><div className="sc-students-overview-metrics"><article><span>{ui('Expedientes disponibles')}</span><strong>{studentDirectoryStats(data.students||[]).total}</strong></article><article><span>{ui('Con CURP registrada')}</span><strong>{studentDirectoryStats(data.students||[]).withCurp}</strong></article><article><span>{ui('Resultados de búsqueda')}</span><strong>{records.length}</strong></article></div></section>}
 {page==='academic_years'&&<div className="info">{ui('Las solicitudes solo se admiten dentro de las fechas de apertura y cierre configuradas para cada proceso.')}</div>}
 {page==='grades'&&<div className="info">{['admin','teacher'].includes(user.role)?ui('Las familias y alumnos solo ven calificaciones publicadas. Promedio visible: ') : ui('Promedio de calificaciones publicadas: ')} <strong>{mean(records.map(x=>Number(x.score)))}</strong> . {ui('La boleta detallada se encuentra en Expedientes.')}</div>}
 <section className={'panel table-panel'+(page==='students'?' sc-students-panel':'')}><div className="toolbar"><div className="search"><Search size={17}/><input aria-label={page==='students'?ui('Buscar alumnos por nombre o CURP'):ui('Buscar registros')} placeholder={page==='students'?ui('Buscar por nombre, CURP o dato del expediente…'):ui('Buscar…')} value={query} onChange={e=>{setQuery(e.target.value);setPageNumber(0);}}/></div>{statuses.length>0&&<button className="secondary" type="button" aria-expanded={advanced} onClick={()=>setAdvanced(value=>!value)}>{ui('Filtros avanzados')}</button>}
  <span className="count">{records.length} {ui('Registros').toLowerCase()}</span></div>
  {advanced&&statuses.length>0&&<div className="sc-advanced-filters">
  <div className="sc-toolbar-filter"><label>{ui('Estado')}</label><Combobox label={ui('Filtrar por estado')} value={statusFilter}
     onChange={value=>{setStatusFilter(value);setPageNumber(0);}} placeholder={ui('Todos los estados')}
     options={statuses.map(status=>({value:status,label:display(status)}))}/></div>
  <button className="text-button" onClick={()=>{setStatusFilter('');setQuery('');setSorting('');setPageNumber(0);}}>{ui('Limpiar filtros')}</button>
  </div>}
  {records.length>0&&<div className="table-scroll"><table className={page==='students'?'sc-students-table':undefined}><thead><tr>{translatedModules[page].columns.map(([key,title])=><th key={key} aria-sort={sorting===key?(ascending?"ascending":"descending"):"none"}><button className="sc-sort-button" aria-label={(locale==='en'?'Sort by ':'Ordenar por ')+title} onClick={()=>sortBy(key)}>{title}{sorting===key?(ascending?" ↑":" ↓"):" ↕"}</button></th>)}<th className="sc-table-action-col">{ui('Acciones')}</th></tr></thead><tbody>{shownRows.map(row=><tr key={row.id}>{translatedModules[page].columns.map(([key])=><td key={key}>{page==='students'&&key==='full_name'?<div className="sc-student-identity"><span className="sc-student-initials" aria-hidden="true">{studentInitials(row)}</span><div><strong>{row.full_name||[row.first_name,row.last_name].filter(Boolean).join(' ')}</strong><small>{ui('Expediente')} #{row.id}</small></div></div>:['status','outcome','role','kind'].includes(key)?<span className={`badge ${row[key]||''}`}>{display(row[key])}</span>:key.endsWith('_at')?readableDate(row[key]):display(row[key])}</td>)}<td className="sc-table-action-cell"><div className="sc-table-action-group">
 {page==='grades'&&<GradeActions grade={row} admin={user.role==='admin'} permissions={user.permissions} onChanged={()=>refresh()}/>}
 {page==='student_contacts'&&can('student_contacts.destroy')&&<TableAction kind="delete" ariaLabel={`Eliminar contacto de ${row.student_name||row.name}`} disabled={busy} onClick={()=>{void confirmDanger('Eliminar contacto','Este contacto dejará de estar disponible para el alumno.').then(ok=>{if(ok)void perform(async()=>{await api('student_contacts/'+row.id,'DELETE');});});}}/>}
 {page==='students'&&<StudentRowActions student={row} canView={can('students.show')} canReport={can('students.report')}
  reportLoading={reportLoadingStudentId===String(row.id)} canEdit={can('students.update')} onView={()=>openStudentRecord(row)}
  onReport={()=>void openStudentReport(row.id)} onEdit={()=>createOrEdit(row)}/>}
 {page!=='students'&&can(`${page}.${['grades','attendances'].includes(page)?'create':'update'}`)&&!['admissions','announcements'].includes(page)&&(page!=='grades'||row.status!=='published')&&<TableAction kind="edit" ariaLabel={`Editar ${translatedModules[page]?.singular||"registro"} ${row.full_name||row.name||row.id}`} onClick={()=>createOrEdit(row)}/>}
 {page==='admissions'&&(can('admissions.approve')||can('admissions.reject'))&&row.status==='submitted'&&<><TableAction kind="approve" ariaLabel={`Aprobar solicitud ${row.folio||row.id}`} onClick={()=>approve(row)}/><TableAction kind="reject" ariaLabel={`Rechazar solicitud ${row.folio||row.id}`} onClick={()=>reject(row)}/></>}
 {page==='enrollments'&&can('enrollments.complete')&&row.status==='active'&&<TableAction kind="complete" ariaLabel={`Cerrar ciclo de ${row.student_name||row.id}`} onClick={()=>complete(row)}/>}
 {page==='users'&&can('users.update')&&row.id!==user.id&&<TableAction kind={row.active?"deactivate":"activate"} ariaLabel={`${row.active?"Desactivar":"Activar"} usuario ${row.name||row.id}`} onClick={()=>perform(async()=>{await api(`users/${row.id}`,'PATCH',{active:!row.active});})}/>}
 </div></td></tr>)}</tbody></table></div>}{!records.length&&(moduleLoadErrors[page]?
   (moduleLoadErrors[page].status===403?<TableEmptyState mode="forbidden"/>:
    <div><TableEmptyState mode="error" description={moduleLoadErrors[page].message}/><div className="form-actions"><button className="secondary" type="button" onClick={()=>void refresh().catch(e=>setError((e as Error).message))}>{ui('Reintentar consulta')}</button></div></div>)
   :!user.permissions?.[pagePermission(page)]?.length?<TableEmptyState mode="forbidden"/>
   :data[page]===undefined?<TableEmptyState mode="loading"/>
   :<TableEmptyState mode={query||statusFilter?'filtered':'empty'} canCreate={editable}/>)}
 
  {records.length>0&&<div className="sc-pagination">
    <div className="sc-page-size"><label>{ui('Por página')}</label><Combobox label={ui('Registros por página')} value={String(pageSize)}
      onChange={value=>{setPageSize(Number(value));setPageNumber(0);}}
      options={[10,15,25,50].map(size=>({value:String(size),label:String(size)}))}/></div>
    <span>{locale==='en'?'Showing':'Mostrando'} {currentPage*pageSize+1}–{Math.min((currentPage+1)*pageSize,records.length)} {locale==='en'?'of':'de'} {records.length}</span>
    <div className="sc-pager-actions"><button className="secondary" disabled={currentPage===0} onClick={()=>setPageNumber(n=>Math.max(0,n-1))}>{ui('Anterior')}</button>
    <span>{ui('Página')} {currentPage+1} {locale==='en'?'of':'de'} {pages}</span>
    <button className="secondary" disabled={currentPage===pages-1} onClick={()=>setPageNumber(n=>Math.min(pages-1,n+1))}>{ui('Siguiente')}</button></div>
  </div>}</section></>}
 </div>

  {dialog&&<div className="overlay"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="dialog"><header><div><span className="eyebrow">CONTROL ESCOLAR</span><h2 id="dialog-title">{dialog.title}</h2></div><button aria-label="Cerrar formulario" onClick={()=>setDialog(null)}><X/></button></header><RecordForm fields={dialog.fields} initial={dialog.values} busy={busy} options={options} optionName={optionName} error={error} fieldErrors={fieldErrors} onCancel={()=>setDialog(null)} onSubmit={values=>perform(()=>dialog.submit(values))}/></section></div>}
 {report&&<div className="overlay"><section role="dialog" aria-modal="true" aria-label="Boleta e historial" className="dialog report"><header><div><span className="eyebrow">{school.name}</span><h2>{report.student.full_name}</h2><p>Boleta de consulta · {report.student.curp}</p></div><div className="actions"><button onClick={()=>window.print()} aria-label="Imprimir boleta"><Printer/></button><button onClick={closeStudentReport} aria-label="Cerrar boleta"><X/></button></div></header>{report.years.map((year:Row)=><article key={year.enrollment.id}><h3>{year.enrollment.group_label}</h3><p>{display(year.enrollment.status)} · {display(year.enrollment.outcome)}</p><table><thead><tr><th>Materia</th><th>Trimestre</th><th>Calificación</th><th>Observación</th></tr></thead><tbody>{year.grades.map((g:Row)=><tr key={g.id}><td>{g.subject_name}</td><td>{g.term}</td><td>{g.score}</td><td>{g.feedback}</td></tr>)}</tbody></table><p>{ui('Promedio registrado: ')}<strong>{mean(year.grades.map((g:Row)=>Number(g.score)))}</strong></p><div className="actions">{Object.entries(year.attendance).map(([status,total])=><span className="badge" key={status}>{display(status)}: {String(total)}</span>)}</div></article>)}{!report.years.length&&<TableEmptyState canCreate={false}/>}<p className="footnote">Documento de consulta interna. No sustituye una certificación oficial.</p></section></div>}
 </Suspense></PortalChrome>;
}
function SchoolSettings({school,onSave,busy}:{school:Row;onSave:(form:FormData)=>void;busy:boolean}){
 const [preview,setPreview]=useState<string>();
 const [logoFile,setLogoFile]=useState<File|null>(null);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 return <><div className="page-heading"><div><div className="eyebrow">IDENTIDAD Y COMUNIDAD</div><h1>Mi escuela</h1><p>Haz que cada portal refleje la identidad de tu escuela.</p></div></div><form className="panel settings" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);if(logoFile)form.set('logo',logoFile);onSave(form);}}><h2>Identidad institucional</h2><div className="logo-upload">{preview||school.logo_url?<img src={preview||school.logo_url} alt="Vista previa del logotipo"/>:<div className="logo-placeholder"><GraduationCap size={38}/></div>}<LogoUploader onChange={file=>{setLogoFile(file);setPreview(file?URL.createObjectURL(file):undefined);}}/></div><div className="form-grid">{[['name','Nombre de la escuela'],['code','Clave del centro de trabajo'],['address','Domicilio'],['phone','Teléfono']].map(([key,label])=><label key={key}>{label}<input name={key} defaultValue={school[key]} required={key==='name'} placeholder={label}/></label>)}</div><div className="info">Configura las fechas de inscripción y reinscripción en <strong>Ciclos escolares</strong>. Programa exámenes y actividades en <strong>Calendario</strong>.</div><div className="form-actions"><button className="primary" disabled={busy}>{busy?'Guardando…':'Guardar configuración'}</button></div></form></>;
}
