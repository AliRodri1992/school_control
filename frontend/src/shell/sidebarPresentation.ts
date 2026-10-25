import type {NavGroup,NavItem,PortalId} from './portalNavigation';
export type SidebarSection={id:string;es:string;en:string;items:NavItem[];directPage?:string};
const areas:{id:string;en:string;pages:string[];directPage?:string}[]=[
{id:'Inicio',en:'Home',pages:['dashboard'],directPage:'dashboard'},
{id:'Alumnos',en:'Students',pages:['students','student_contacts']},
{id:'Matrícula',en:'Enrollment',pages:['admissions','enrollments']},
{id:'Académico',en:'Academics',pages:['academic_years','groups','courses','subjects','schedule','grades','classroom']},
{id:'Asistencia',en:'Attendance',pages:['attendances']},
{id:'Comunicación',en:'Communication',pages:['messages','announcements','calendar_events']},
{id:'Documentos',en:'Documents',pages:['documents']},
{id:'Reportes',en:'Reports',pages:['reports','imports']},
{id:'Configuración',en:'Settings',pages:['users','access_roles','school','email_templates','languages','api_docs']}
];
const flatten=(items:NavItem[]):NavItem[]=>items.flatMap(i=>[i,...flatten(i.children||[])]);
/** Presentation only: cannot bypass the original permissions filter. */
export function sidebarSections(portal:PortalId,groups:NavGroup[]):SidebarSection[]{
 if(portal!=='admin')return groups.map(g=>({id:g.title,es:g.title,en:g.title,items:g.items}));
 const allowed=new Map(flatten(groups.flatMap(g=>g.items)).map(i=>[i.key,i]));
 return areas.map(area=>({...area,es:area.id,items:area.pages.flatMap(key=>{
  const item=allowed.get(key);return item?[{...item,children:[]}]:[];
 })})).filter(section=>section.items.length>0);
}
