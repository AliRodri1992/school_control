import {describe,it,expect} from 'vitest';
import {currentPortal,makePortalUrl,resolvePortalLocation,visibleGroups,permissionFor,findNavPath,canImportFromPermissions,studentRecordUrl,isStudentRecordUrl} from './portalNavigation';
describe('portal route protections',()=>{
 it('uses distinct paths for each school audience',()=>{
  expect(currentPortal('admin')).toBe('admin');
  expect(currentPortal('teacher')).toBe('teachers');
  expect(currentPortal('student')).toBe('students');
  expect(currentPortal('guardian')).toBe('tutors');
  expect(makePortalUrl('teachers','dashboard')).toBe('/teachers');
  expect(makePortalUrl('admin','academic_years')).toBe('/admin/academic-years');
 });
 it('does not authorize guessed URLs',()=>{
  expect(resolvePortalLocation('/admin/users','admin',{'users.index':['institution']})).toBe('users');
  expect(resolvePortalLocation('/admin/users','admin',{})).toBe('dashboard');
  expect(resolvePortalLocation('/admin/users','teacher',{})).toBe('dashboard');
  expect(resolvePortalLocation('/teachers/grades','teacher',{'grades.index':['assigned']})).toBe('grades');
 });
 it('retains permitted children without showing unrelated modules',()=>{
  const allow=(key:string)=>['dashboard.show','students.index','student_contacts.index'].includes(key);
  const groups=visibleGroups('admin',allow);
  expect(groups.flatMap(g=>g.items).some(x=>x.key==='students')).toBe(true);
  expect(groups.flatMap(g=>g.items).some(x=>x.key==='users')).toBe(false);
  expect(permissionFor('schedule')).toBe('schedule_slots.index');
 });
 it('filters grandchild modules and creates three-level breadcrumb paths',()=>{
  const allowed=(key:string)=>['academic_years.index','groups.index','courses.index'].includes(key);
  const sections=visibleGroups('admin',allowed);
  expect(findNavPath(sections,'courses').map(node=>node.key)).toEqual(['academic_years','groups','courses']);
  expect(findNavPath(visibleGroups('admin',key=>key==='academic_years.index'),'courses')).toEqual([]);
 });

 it('opens the importer only when an institution-level importer permission exists',()=>{
  expect(canImportFromPermissions({'students.create':['family']})).toBe(false);
  expect(canImportFromPermissions({'subjects.create':['institution']})).toBe(true);
  expect(resolvePortalLocation('/admin/imports','admin',{'subjects.create':['institution']})).toBe('imports');
  expect(resolvePortalLocation('/tutors/imports','guardian',{'students.create':['family']})).toBe('dashboard');
 });

 it('supports deep links to permitted full-page student records',()=>{
  expect(studentRecordUrl('admin',42)).toBe('/admin/students/42');
  expect(studentRecordUrl('tutors',42)).toBe('/tutors/students/42');
  expect(isStudentRecordUrl('/tutors/students/42','guardian',{'students.show':['family']})).toBe(true);
  expect(isStudentRecordUrl('/tutors/students/42','guardian',{})).toBe(false);
  expect(isStudentRecordUrl('/tutors/students/../../users','guardian',{'students.show':['family']})).toBe(false);
 });

});
