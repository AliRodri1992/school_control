export type ApiEntry={path:string;verb:string;operation:{tags?:string[];summary?:string;operationId?:string;'x-rbac-permission'?:string|string[]}};
export const apiSections=[
 {id:'all',title:'Todas las áreas',description:'Explora el contrato completo'},
 {id:'students',title:'Alumnos y expedientes',description:'Identidad, familiares y documentación'},
 {id:'admissions',title:'Admisiones e inscripciones',description:'Solicitudes, matrícula y reinscripción'},
 {id:'academics',title:'Control escolar',description:'Ciclos, grupos, clases y horarios'},
 {id:'assessment',title:'Evaluación y asistencia',description:'Calificaciones, asistencias y tareas'},
 {id:'communication',title:'Comunidad y comunicación',description:'Mensajes, avisos y notificaciones'},
 {id:'reports',title:'Reportes y análisis',description:'Indicadores y exportaciones'},
 {id:'administration',title:'Administración y configuración',description:'Escuela, usuarios, permisos y ajustes'},
 {id:'integrations',title:'Importaciones e idiomas',description:'Carga de datos, plantillas e internacionalización'},
 {id:'account',title:'Acceso y cuenta',description:'Sesiones, autenticación y seguridad'}
] as const;
const categoryTags:Record<string,string[]>={
 students:['students','student_details','student_contacts','student_documents'],
 admissions:['admissions','enrollments'],
 academics:['academic_years','groups','subjects','courses','schedule_slots','calendar_events'],
 assessment:['attendances','grades','grade_change_requests','assignments'],
 communication:['messages','notifications','announcements','email_templates'],
 reports:['reports','dashboard'],
 administration:['school','users','access_roles'],
 integrations:['data_imports','import_mapping_templates','languages'],
 account:['sessions','authentication','account']
};
export function apiSectionFor(tags:string[]=[]):string{
 const match=Object.entries(categoryTags).find(([,values])=>tags.some(tag=>values.includes(tag)));
 return match?.[0]||'administration';
}
export function apiSectionCounts(entries:ApiEntry[]):Record<string,number>{
 const result:Record<string,number>={all:entries.length};
 for(const entry of entries){const section=apiSectionFor(entry.operation.tags);result[section]=(result[section]||0)+1;}
 return result;
}
export function filterApiEntries<T extends ApiEntry>(entries:T[],section:string,query:string):T[]{
 const needle=query.trim().toLocaleLowerCase();
 return entries.filter(e=>(section==='all'||apiSectionFor(e.operation.tags)===section)&&
 (!needle||[e.path,e.verb,e.operation.summary||'',e.operation.operationId||'',...(e.operation.tags||[]),String(e.operation['x-rbac-permission']||'')].join(' ').toLocaleLowerCase().includes(needle)));
}
