import {expect,it} from 'vitest';
import {currentPortal,findNavPath,visibleGroups,portalGroups,breadcrumbPath,breadcrumbDestination,breadcrumbTranslationKey,shouldCondenseBreadcrumbs} from './portalNavigation';

it('provides distinct navigation group structures for each school portal',()=>{
 const portals=['admin','teachers','students','tutors'] as const;
 for(const portal of portals){
   expect(portalGroups[portal].length).toBeGreaterThan(0);
   expect(portalGroups[portal].every(group=>group.items.length>0)).toBe(true);
 }
 expect(currentPortal('teacher')).toBe('teachers');
 expect(currentPortal('guardian')).toBe('tutors');
});

it('finds the entire group path for a nested school module',()=>{
 const admin=visibleGroups('admin',()=>true);
 expect(findNavPath(admin,'courses').map(item=>item.key)).toEqual(['academic_years','groups','courses']);
 expect(admin.find(group=>group.title==='Gestión académica')).toBeTruthy();
});

it('hides inaccessible modules rather than rendering disabled navigation entries',()=>{
 const groups=visibleGroups('admin',key=>key==='students.index');
 expect(findNavPath(groups,'students')).toHaveLength(1);
 expect(findNavPath(groups,'reports')).toHaveLength(0);
});

it('builds a complete breadcrumb for nested modules and standalone screens',()=>{
 const groups=visibleGroups('admin',()=>true);
 expect(breadcrumbPath(groups,'courses','admin').map(item=>item.key)).toEqual(['academic_years','groups','courses']);
 expect(breadcrumbPath(groups,'student_details','admin').map(item=>item.key)).toEqual(['students','student_records','student_details']);
 expect(breadcrumbPath(groups,'student_details','admin').map(item=>item.title)).toEqual(['Alumnos','Expedientes','Ficha del alumno']);
 expect(breadcrumbPath(groups,'student_details','tutors').map(item=>item.title)).toEqual(['Mis hijos','Expedientes','Ficha del alumno']);
 expect(breadcrumbPath(groups,'preferences','admin').map(item=>item.title)).toEqual(['Preferencias']);
 expect(breadcrumbPath(groups,'dashboard','admin').map(item=>item.title)).toEqual(['Resumen']);
});

it('resolves the student-records breadcrumb to an existing route in every portal',()=>{
 expect(breadcrumbDestination('student_records')).toBe('students');
 expect(breadcrumbDestination('students')).toBe('students');
 expect(breadcrumbDestination('groups')).toBe('groups');
 expect(breadcrumbDestination('courses')).toBe('courses');
});

it('keeps virtual breadcrumb translations scoped to navigation, not module headings',()=>{
 expect(breadcrumbTranslationKey('student_records')).toBe('nav.student_records');
 expect(breadcrumbTranslationKey('student_details')).toBe('nav.student_details');
 expect(breadcrumbTranslationKey('preferences')).toBe('shell.preferences');
 expect(breadcrumbTranslationKey('courses')).toBe('nav.courses');
});

it('collapses only when breadcrumb content genuinely exceeds available width',()=>{
 expect(shouldCondenseBreadcrumbs(750,375)).toBe(true);
 expect(shouldCondenseBreadcrumbs(470,470)).toBe(false);
 expect(shouldCondenseBreadcrumbs(471,470)).toBe(false);
 expect(shouldCondenseBreadcrumbs(473,470)).toBe(true);
 expect(shouldCondenseBreadcrumbs(0,0)).toBe(false);
 expect(shouldCondenseBreadcrumbs(Number.NaN,480)).toBe(false);
});
