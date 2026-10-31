import {describe,it,expect} from 'vitest';
import {windowState,schoolYearStats,eventDatePayload} from './SchoolCycles';
describe('school cycles calendar',()=>{
 it('identifies open, upcoming and closed application periods',()=>{
  expect(windowState('2026-08-01','2026-10-31','2026-10-29')).toBe('open');
  expect(windowState('2026-11-01','2026-12-01','2026-10-29')).toBe('upcoming');
  expect(windowState('2026-01-01','2026-05-01','2026-10-29')).toBe('closed');
 });
 it('summarizes application periods without modifying school years',()=>{
  expect(schoolYearStats([{admissions_open_on:'2026-10-01',admissions_close_on:'2026-11-01',reenrollment_open_on:'2026-12-01',reenrollment_close_on:'2026-12-31'}],'2026-10-29')).toEqual({total:1,admissions:1,reenrollments:0,upcoming:1});
 });
});

describe('manual cycle event date semantics',()=>{
 it('stores an inclusive one-day holiday as an exclusive datetime interval',()=>{
  expect(eventDatePayload({allDay:true,start:'2026-09-16',end:'2026-09-16'})).toEqual({
   starts_at:'2026-09-16T00:00:00',ends_at:'2026-09-17T00:00:00'});
 });
 it('retains timestamps for timed meetings',()=>{
  expect(eventDatePayload({allDay:false,start:'2026-10-30T09:00',end:'2026-10-30T11:00'})).toEqual({
   starts_at:'2026-10-30T09:00',ends_at:'2026-10-30T11:00'});
 });
 it('rejects inverted event intervals',()=>{
  expect(()=>eventDatePayload({allDay:true,start:'2026-10-31',end:'2026-10-30'})).toThrow();
 });
});
