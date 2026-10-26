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

/** Keep disclosure state scoped to the active portal and its permitted sections. */
export function sidebarExpandedSections(portal:PortalId,sections:SidebarSection[],stored:string|null):string[]{
 const allowed=new Set(sections.filter(section=>!section.directPage).map(section=>section.id));
 if(stored===null)return sections.filter(section=>section.id==='Alumnos'||section.id==='Mi actividad'||section.id==='Mi escuela'||section.id==='Mi familia').map(section=>section.id);
 try {
  const parsed:unknown=JSON.parse(stored);
  return Array.isArray(parsed)?parsed.filter((id):id is string=>typeof id==='string'&&allowed.has(id)):[];
 }catch{return [];}
}
export const sidebarExpandedStorageKey=(portal:PortalId)=>'school-sidebar-expanded-'+portal;
