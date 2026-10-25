import {expect,it} from 'vitest';
import {sidebarSections} from './sidebarPresentation';
import {visibleGroups} from './portalNavigation';
it('renders the reference categories with unique allowed routes',()=>{
 const sections=sidebarSections('admin',visibleGroups('admin',()=>true));
 expect(sections.map(s=>s.id)).toEqual(['Inicio','Alumnos','Matrícula','Académico','Asistencia','Comunicación','Documentos','Reportes','Configuración']);
 const keys=sections.flatMap(s=>s.items.map(i=>i.key));
 expect(new Set(keys).size).toBe(keys.length);
 expect(keys).toContain('courses');expect(keys).toContain('api_docs');
});
it('does not show unauthorized modules',()=>{
 const sections=sidebarSections('admin',visibleGroups('admin',p=>p==='dashboard.show'||p==='students.index'));
 expect(sections.flatMap(s=>s.items.map(i=>i.key))).toEqual(['dashboard','students']);
});
it('preserves non-admin menus',()=>{
 for(const role of ['teachers','students','tutors'] as const){
  const groups=visibleGroups(role,()=>true);
  expect(sidebarSections(role,groups).map(s=>s.id)).toEqual(groups.map(g=>g.title));
 }
});
