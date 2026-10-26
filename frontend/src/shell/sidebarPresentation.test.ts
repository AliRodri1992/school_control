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
 // Messaging is explicitly available to all school roles in visibleGroups.
 const available=sections.flatMap(s=>s.items.map(i=>i.key));
 expect(available).toEqual(['dashboard','students','messages']);
 expect(available).not.toContain('users');
 expect(available).not.toContain('access_roles');
});
it('preserves non-admin menus',()=>{
 for(const role of ['teachers','students','tutors'] as const){
  const groups=visibleGroups(role,()=>true);
  expect(sidebarSections(role,groups).map(s=>s.id)).toEqual(groups.map(g=>g.title));
 }
});

it('persists only permitted disclosure sections for each portal',async()=>{
 const {sidebarExpandedSections,sidebarExpandedStorageKey}=await import('./sidebarPresentation');
 const sections=sidebarSections('admin',visibleGroups('admin',()=>true));
 expect(sidebarExpandedStorageKey('admin')).toBe('school-sidebar-expanded-admin');
 expect(sidebarExpandedStorageKey('teachers')).not.toBe(sidebarExpandedStorageKey('admin'));
 expect(sidebarExpandedSections('admin',sections,JSON.stringify(['Alumnos','Configuración','fake','Inicio']))).toEqual(['Alumnos','Configuración']);
 expect(sidebarExpandedSections('admin',sections,'broken')).toEqual([]);
 expect(sidebarExpandedSections('admin',sections,null)).toEqual(['Alumnos']);
});
