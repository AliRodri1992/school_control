import type {ComponentType} from 'react';
import {ArrowRight,BookOpen,CalendarDays,ClipboardCheck,FileCheck2,GraduationCap,HeartHandshake,MessageCircle,School2,Users} from 'lucide-react';
import Dashboard from '../../Dashboard';
import type {Row} from '../../modules';

type Role='admin'|'teacher'|'student'|'guardian';
type Action={key:string;label:string;detail:string;permission:string;icon:ComponentType<{size?:number}>};
const cards:Record<Role,{eyebrow:string;headline:string;intro:string;icon:ComponentType<{size?:number}>;actions:Action[]}>={
 admin:{eyebrow:'DIRECCIÓN · VISIÓN INSTITUCIONAL',headline:'Cada decisión, una escuela mejor.',intro:'Organiza trámites, alumnos y procesos con indicadores de tu institución.',icon:School2,actions:[
  {key:'students',label:'Expedientes',detail:'Alumnos y sus datos',permission:'students.index',icon:Users},
  {key:'admissions',label:'Admisiones',detail:'Solicitudes pendientes',permission:'admissions.index',icon:FileCheck2},
  {key:'groups',label:'Grupos',detail:'Organización académica',permission:'groups.index',icon:GraduationCap},
  {key:'reports',label:'Reportes',detail:'Información para decidir',permission:'reports.index',icon:BookOpen}]},
 teacher:{eyebrow:'DOCENTES · MI JORNADA',headline:'Cada clase cuenta. Cada alumno también.',intro:'Prepara tus clases, registra asistencia y acompaña el aprendizaje.',icon:BookOpen,actions:[
  {key:'attendances',label:'Pasar asistencia',detail:'Registra el día',permission:'attendances.index',icon:ClipboardCheck},
  {key:'grades',label:'Calificaciones',detail:'Evalúa y revisa',permission:'grades.index',icon:GraduationCap},
  {key:'classroom',label:'Aula virtual',detail:'Actividades del grupo',permission:'assignments.index',icon:BookOpen},
  {key:'schedule',label:'Horario',detail:'Mi jornada semanal',permission:'schedule_slots.index',icon:CalendarDays}]},
 student:{eyebrow:'ALUMNOS · MI APRENDIZAJE',headline:'¡Hoy es un buen día para aprender!',intro:'Encuentra tus tareas, horario y avances de manera sencilla.',icon:GraduationCap,actions:[
  {key:'classroom',label:'Mis tareas',detail:'Actividades por realizar',permission:'assignments.index',icon:BookOpen},
  {key:'grades',label:'Mis logros',detail:'Calificaciones publicadas',permission:'grades.index',icon:GraduationCap},
  {key:'schedule',label:'Mi horario',detail:'Clases y actividades',permission:'schedule_slots.index',icon:CalendarDays},
  {key:'messages',label:'Mensajes',detail:'Comunícate con tu escuela',permission:'',icon:MessageCircle}]},
 guardian:{eyebrow:'FAMILIAS · SEGUIMIENTO',headline:'Más cerca de cada paso de tus hijos.',intro:'Acompaña su trayectoria escolar y realiza los trámites en un solo lugar.',icon:HeartHandshake,actions:[
  {key:'students',label:'Mis hijos',detail:'Expedientes familiares',permission:'students.index',icon:Users},
  {key:'admissions',label:'Inscripciones',detail:'Solicitudes y folios',permission:'admissions.index',icon:FileCheck2},
  {key:'documents',label:'Documentos',detail:'Entrega de archivos',permission:'student_documents.index',icon:BookOpen},
  {key:'messages',label:'Mensajes',detail:'Comunicación escolar',permission:'',icon:MessageCircle}]}
};
export default function PortalHome({user,summary,data,can,onNavigate,selectedChildId='',onSelectChild}:{
 user:Row;summary:Row;data:Record<string,Row[]>;can:(permission:string)=>boolean;onNavigate:(page:string)=>void;selectedChildId?:string;onSelectChild?:(id:string)=>void;
}){
 const role=(Object.hasOwn(cards,user.role)?user.role:'guardian') as Role;
 const info=cards[role];const HeroIcon=info.icon;
 const allowed=info.actions.filter(action=>!action.permission||can(action.permission));
 const children=data.students||[];
 return <section className={'sc-home sc-home-'+role}>
  <div className="sc-home-hero"><div className="sc-home-copy">
   <span className="sc-home-overline">{info.eyebrow}</span><h1>{info.headline}</h1><p>{info.intro}</p>
   <div className="sc-home-hello">Hola, {String(user.name||'').split(' ')[0]}.</div>
   </div><div className="sc-home-illustration" aria-hidden="true">
    <svg viewBox="0 0 210 175" width="210" height="175" role="presentation">
     <circle cx="105" cy="86" r="75" stroke="#95aaf0" strokeDasharray="5 9" fill="none" opacity=".7"/>
     <rect x="51" y="30" width="110" height="114" rx="20" fill="#acbafb" transform="rotate(-9 110 87)"/>
     <rect x="66" y="47" width="115" height="106" rx="19" fill="#ecf0ff"/>
     <path d="M87 85h64M87 105h47M87 125h54" stroke="#8498da" strokeWidth="8" strokeLinecap="round"/>
     <circle cx="59" cy="24" r="9" fill="#f4a340"/>
    </svg><span><HeroIcon size={29}/></span>
   </div></div>
  {role==='guardian'&&children.length>0&&<section className="sc-home-family" aria-label="Seleccionar alumno">
   <div><strong>Seguimiento familiar</strong><p>Elige un hijo para filtrar su información.</p></div>
   <div className="sc-home-child-options">
   {children.map(child=><button key={child.id} aria-pressed={String(child.id)===selectedChildId}
    className={String(child.id)===selectedChildId?'active':''}
    onClick={()=>onSelectChild?.(String(child.id)===selectedChildId?'':String(child.id))}>
    <GraduationCap size={17}/>{child.full_name||child.first_name}</button>)}</div>
  </section>}
  <div className="sc-home-intro"><h2>Accesos rápidos</h2><p>Herramientas disponibles de acuerdo con tus permisos.</p></div>
  <div className="sc-home-actions">{allowed.map(action=>{const Icon=action.icon;return <button key={action.key} onClick={()=>onNavigate(action.key)} className="sc-home-action">
   <span><Icon size={22}/></span><strong>{action.label}</strong><small>{action.detail}</small><ArrowRight size={16} className="sc-home-arrow"/>
  </button>;})}</div>
  <Dashboard summary={summary} data={data} role={role} userId={user.id}/>
 </section>;
}
