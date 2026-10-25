import type {ReactNode} from 'react';
import {BookOpenCheck,CalendarCheck2,ClipboardList,FileClock,GraduationCap,Layers3,UsersRound} from 'lucide-react';
import type {MetricKind,DashboardRole} from './dashboardConfig';

const metricStyles={
 students:{icon:UsersRound,tone:'blue',category:'Comunidad escolar',detail:'Expedientes dentro de tu alcance',unit:'alumnos',attention:false},
 enrollments:{icon:GraduationCap,tone:'indigo',category:'Matrícula',detail:'Inscripciones con estado activo',unit:'inscripciones',attention:false},
 pending_admissions:{icon:ClipboardList,tone:'amber',category:'Admisiones',detail:'Solicitudes que esperan revisión',unit:'solicitudes',attention:true},
 groups:{icon:Layers3,tone:'teal',category:'Organización',detail:'Grupos a los que tienes acceso',unit:'grupos',attention:false},
 today_classes:{icon:CalendarCheck2,tone:'sky',category:'Mi jornada',detail:'Clases programadas para hoy',unit:'clases',attention:false},
 grade_drafts:{icon:BookOpenCheck,tone:'violet',category:'Evaluación',detail:'Calificaciones en borrador',unit:'borradores',attention:true},
 pending_documents:{icon:FileClock,tone:'coral',category:'Documentación',detail:'Documentos pendientes de revisión',unit:'documentos',attention:true}
} as const;

function asCount(value:unknown):number{
 const count=Number(value??0);
 return Number.isFinite(count)&&count>=0?Math.trunc(count):0;
}

type Props={
 kind:MetricKind;title:string;value:unknown;role:DashboardRole;locale:string;
 translate:(text:string)=>string;editing?:boolean;actions?:ReactNode;
};

export default function DashboardMetricCard({kind,title,value,role,locale,translate,editing=false,actions}:Props){
 const meta=metricStyles[kind];
 const Icon=meta.icon;
 const count=asCount(value);
 const formatted=new Intl.NumberFormat(locale==='en'?'en-US':locale==='ko'?'ko-KR':'es-MX').format(count);
 const footer=meta.attention?(count>0?'Requiere seguimiento':'Sin pendientes'):'Información actual';
 return <article className={'dashboard-widget sc-kpi-card sc-kpi-'+meta.tone}
  data-metric={kind} data-portal={role} aria-label={title+': '+formatted}>
  <header className="sc-kpi-header">
   <div className={'sc-kpi-header-copy'+(editing?' widget-handle':'')}>
    <span className="sc-kpi-category">{translate(meta.category)}</span>
    <h3>{title}</h3>
   </div>
   <span className="sc-kpi-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.9}/></span>
   {editing&&<div className="widget-actions sc-kpi-actions">{actions}</div>}
  </header>
  <div className="sc-kpi-main">
   <div className="sc-kpi-value-line">
    <strong className="sc-kpi-number">{formatted}</strong>
    <span className="sc-kpi-unit">{translate(meta.unit)}</span>
   </div>
   <p className="sc-kpi-description">{translate(meta.detail)}</p>
  </div>
  <footer className="sc-kpi-footer">
   <span className={'sc-kpi-indicator'+(meta.attention&&count>0?' needs-attention':'')}>
    <span className="sc-kpi-dot" aria-hidden="true"/>{translate(footer)}
   </span>
   <span className="sc-kpi-corner" aria-hidden="true"><span/><span/><span/></span>
  </footer>
 </article>;
}
