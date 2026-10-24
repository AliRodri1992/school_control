import type {Row} from '../modules';
export type PortalId='admin'|'teachers'|'students'|'tutors';
export type NavItem={key:string;title:string;children?:NavItem[]};
export type NavGroup={title:string;items:NavItem[]};
export const roots:Record<PortalId,string>={admin:'/admin',teachers:'/teachers',students:'/students',tutors:'/tutors'};
export const currentPortal=(role:string):PortalId=>({admin:'admin',teacher:'teachers',student:'students',guardian:'tutors'} as Record<string,PortalId>)[role]||'tutors';
export const portalLabels:Record<PortalId,string>={admin:'Administración',teachers:'Docentes',students:'Alumnos',tutors:'Tutores'};
const aliases:Record<string,string>={dashboard:'dashboard.show',documents:'student_documents.index',classroom:'assignments.index',schedule:'schedule_slots.index',school:'schools.update',imports:'students.create',languages:'access_roles.update',api_docs:'access_roles.index'};
export const permissionFor=(key:string):string=>aliases[key]||(key+'.index');
export const portalGroups:Record<PortalId,NavGroup[]>={
 admin:[
  {title:'Inicio',items:[{key:'dashboard',title:'Resumen'}]},
  {title:'Gestión escolar',items:[{key:'students',title:'Alumnos y expedientes',children:[{key:'student_contacts',title:'Contactos familiares'},{key:'documents',title:'Documentos'}]},{key:'admissions',title:'Admisiones',children:[{key:'enrollments',title:'Matrícula y trayectoria'}]}]},
  {title:'Gestión académica',items:[{key:'academic_years',title:'Ciclos escolares',children:[{key:'groups',title:'Grupos',children:[{key:'courses',title:'Clases'}]}]},{key:'subjects',title:'Materias'},{key:'schedule',title:'Horarios'},{key:'attendances',title:'Asistencia'},{key:'grades',title:'Calificaciones'}]},
  {title:'Comunicación',items:[{key:'classroom',title:'Aula virtual'},{key:'messages',title:'Mensajes'},{key:'announcements',title:'Comunicados'},{key:'calendar_events',title:'Calendario'}]},
  {title:'Análisis y sistema',items:[{key:'reports',title:'Reportes'},{key:'imports',title:'Importaciones'},{key:'users',title:'Usuarios'},{key:'access_roles',title:'Roles y permisos'},{key:'school',title:'Mi escuela'},{key:'email_templates',title:'Plantillas de correo'},{key:'languages',title:'Idiomas y traducciones'},{key:'api_docs',title:'Documentación API'}]}
 ],
 teachers:[
  {title:'Mi actividad',items:[{key:'dashboard',title:'Mi día'},{key:'groups',title:'Mis grupos'},{key:'courses',title:'Mis clases'},{key:'schedule',title:'Mi horario'},{key:'attendances',title:'Asistencia'},{key:'grades',title:'Calificaciones'},{key:'classroom',title:'Aula virtual'}]},
  {title:'Comunidad',items:[{key:'messages',title:'Mensajes'},{key:'calendar_events',title:'Calendario'},{key:'announcements',title:'Comunicados'},{key:'reports',title:'Reportes'}]}
 ],
 students:[
  {title:'Mi escuela',items:[{key:'dashboard',title:'Mi inicio'},{key:'schedule',title:'Mi horario'},{key:'classroom',title:'Mis tareas'},{key:'grades',title:'Mis calificaciones'},{key:'attendances',title:'Mi asistencia'},{key:'calendar_events',title:'Calendario'},{key:'messages',title:'Mensajes'}]}
 ],
 tutors:[
  {title:'Mi familia',items:[{key:'dashboard',title:'Inicio familiar'},{key:'students',title:'Mis hijos'},{key:'admissions',title:'Inscripciones'},{key:'documents',title:'Documentos'}]},
  {title:'Seguimiento',items:[{key:'grades',title:'Calificaciones'},{key:'attendances',title:'Asistencia'},{key:'schedule',title:'Horarios'},{key:'classroom',title:'Actividades'},{key:'calendar_events',title:'Agenda'},{key:'messages',title:'Mensajes'},{key:'announcements',title:'Comunicados'}]}
 ]
};
export function visibleGroups(portal:PortalId,can:(key:string)=>boolean):NavGroup[]{
 const permitted=(item:NavItem):NavItem[]=>{
   const children=item.children?.flatMap(permitted)||[];
   const access=item.key==='imports'?can('students.create')&&can('users.index'):
     can(permissionFor(item.key))||children.length>0||item.key==='messages';
   return access?[{...item,children}]:[];
 };
 return portalGroups[portal].map(g=>({...g,items:g.items.flatMap(permitted)})).filter(g=>g.items.length);
}
export function findNavPath(groups:NavGroup[],page:string):NavItem[]{
 const traverse=(items:NavItem[],trail:NavItem[]):NavItem[]|null=>{
   for(const item of items){
     const path=[...trail,item];
     if(item.key===page)return path;
     const nested=traverse(item.children||[],path);
     if(nested)return nested;
   }
   return null;
 };
 for(const group of groups){
   const path=traverse(group.items,[]);
   if(path)return path;
 }
 return [];
}
export function makePortalUrl(portal:PortalId,page:string):string{
 return roots[portal]+(page==='dashboard'?'':('/'+page.replaceAll('_','-')));
}
export function resolvePortalLocation(path:string,role:string,permissions:Row={}):string{
 const portal=currentPortal(role),base=roots[portal];
 if(path===base||path===base+'/')return 'dashboard';
 if(!path.startsWith(base+'/'))return 'dashboard';
 const page=decodeURIComponent(path.slice(base.length+1)).replaceAll('-','_');
 if(['profile','preferences','notifications','messages'].includes(page))return page;
 return permissions?.[permissionFor(page)]?.length?page:'dashboard';
}
