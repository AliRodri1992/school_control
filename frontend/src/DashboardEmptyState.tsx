import {CalendarDays,ChartNoAxesColumnIncreasing,ClipboardCheck,ClipboardList,Check,Clock3,GraduationCap,School,ShieldCheck,TrendingUp,ChartPie,UsersRound} from 'lucide-react';
import type {DashboardRole} from './dashboardConfig';

export type DashboardEmptyKind='alerts'|'attendance'|'calendar'|'admission_status'|'attendance_rate'|'students_by_grade'|'enrollment_trend';

type Props={kind:DashboardEmptyKind;role:DashboardRole;translate:(message:string)=>string};

const details={
 alerts:{
  eyebrow:'SEGUIMIENTO ESCOLAR',title:'Sin alertas por revisar',
  description:'No se detectaron casos con tres o más inasistencias durante los últimos 30 días.',
  note:'Criterio: 3 faltas en 30 días',icon:ClipboardCheck,mini:ShieldCheck,
  theme:'mint'
 },
 attendance:{
  eyebrow:'ÚLTIMOS 30 DÍAS',title:'Aún no hay registros de asistencia',
  description:'Cuando se registren asistencias, verás aquí su distribución por estado.',
  note:'El gráfico se actualiza con nuevos registros',icon:ChartNoAxesColumnIncreasing,mini:Clock3,
  theme:'blue'
 },
 calendar:{
  eyebrow:'AGENDA ESCOLAR',title:'No hay eventos próximos',
  description:'Las siguientes actividades del calendario escolar aparecerán en este espacio.',
  note:'Calendario institucional',icon:CalendarDays,mini:Clock3,
  theme:'violet'
 },
 admission_status:{
  eyebrow:'PROCESO DE ADMISIÓN',title:'Aún no hay admisiones',
  description:'Cuando haya solicitudes registradas en tu ámbito autorizado, verás la distribución de sus estados.',
  note:'Estados: enviadas, aprobadas y rechazadas',icon:ClipboardList,mini:School,
  theme:'amber'
 },
 attendance_rate:{
  eyebrow:'PANORAMA DE ASISTENCIA',title:'Sin datos de asistencia',
  description:'La proporción de asistencias y faltas aparecerá cuando existan registros en el periodo.',
  note:'Resumen del periodo seleccionado',icon:ChartPie,mini:Clock3,
  theme:'cyan'
 },
 students_by_grade:{
  eyebrow:'DISTRIBUCIÓN ESCOLAR',title:'Aún no hay alumnos por grado',
  description:'Aquí podrás comparar alumnos por grado cuando existan inscripciones en los grupos autorizados.',
  note:'Grados del ciclo escolar disponible',icon:GraduationCap,mini:UsersRound,
  theme:'indigo'
 },
 enrollment_trend:{
  eyebrow:'EVOLUCIÓN DE MATRÍCULA',title:'Sin matrícula para comparar',
  description:'La evolución de inscripciones aparecerá cuando existan registros en los ciclos escolares disponibles.',
  note:'Comparativo de ciclos escolares',icon:TrendingUp,mini:School,
  theme:'teal'
 }
} as const;

const personalAttendance:Partial<Record<DashboardRole,string>>={
 teacher:'Las asistencias de tus grupos aparecerán aquí cuando se registren.',
 guardian:'Las asistencias de tus hijos aparecerán aquí cuando se registren.',
 student:'Tu resumen de asistencias aparecerá aquí cuando haya registros.'
};
const personalDistribution:Partial<Record<DashboardRole,string>>={
 teacher:'La proporción de asistencias y faltas de tus grupos aparecerá cuando haya registros.',
 guardian:'La proporción de asistencias y faltas de tus hijos aparecerá cuando haya registros.',
 student:'Tu distribución de asistencia y faltas aparecerá cuando haya registros.'
};

/** Purpose-built, static empty state: no synthetic values, fake trends or dead controls. */
export default function DashboardEmptyState({kind,role,translate}:Props){
 const meta=details[kind];
 const Icon=meta.icon;
 const Mini=meta.mini;
 const description=kind==='attendance'?personalAttendance[role]||meta.description:
  kind==='attendance_rate'?personalDistribution[role]||meta.description:meta.description;
 return <div className={'sc-dashboard-empty sc-dashboard-empty-'+meta.theme}
  data-empty-kind={kind} aria-label={translate(meta.title)}>
  <div className="sc-dashboard-empty-art" aria-hidden="true">
   <span className="sc-dashboard-empty-orbit sc-dashboard-empty-orbit-top"/>
   <span className="sc-dashboard-empty-orbit sc-dashboard-empty-orbit-bottom"/>
   <span className="sc-dashboard-empty-icon"><Icon size={27} strokeWidth={1.7}/></span>
   {kind==='alerts'&&<span className="sc-dashboard-empty-check"><Check size={13} strokeWidth={2.5}/></span>}
  </div>
  <div className="sc-dashboard-empty-copy">
   <span className="sc-dashboard-empty-eyebrow">{translate(meta.eyebrow)}</span>
   <strong className="sc-dashboard-empty-title">{translate(meta.title)}</strong>
   <p className="sc-dashboard-empty-description">{translate(description)}</p>
  </div>
  <div className="sc-dashboard-empty-note"><Mini size={13} strokeWidth={2} aria-hidden="true"/><span>{translate(meta.note)}</span></div>
 </div>;
}
