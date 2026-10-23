import {describe,it,expect} from 'vitest';
import {currentPortal,makePortalUrl,resolvePortalLocation,visibleGroups,permissionFor} from './portalNavigation';
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
});
