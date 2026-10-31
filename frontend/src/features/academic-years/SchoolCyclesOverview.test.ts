import {describe,expect,it} from 'vitest';
import {cycleProgress,filterCycles,selectCurrentCycle,upcomingYearEvents} from './SchoolCyclesOverview';

const base={id:1,name:'2026–2027',status:'active',starts_on:'2026-08-31',ends_on:'2027-07-09',
 planned_school_days:185,admissions_open_on:'2026-02-01',admissions_close_on:'2026-09-30',
 reenrollment_open_on:'2026-03-01',reenrollment_close_on:'2026-04-30',
 first_term_starts_on:'2026-08-31',first_term_ends_on:'2026-11-30',
 second_term_starts_on:'2026-12-01',second_term_ends_on:'2027-03-31',
 third_term_starts_on:'2027-04-01',third_term_ends_on:'2027-07-09'};
const completeEvent={id:10,academic_year_id:1,title:'CTE',kind:'cte',starts_at:'2026-11-27T09:00:00'};
describe('cycle overview derived information',()=>{
 it('features only an active or closing cycle whose calendar actually includes today',()=>{
  const past={...base,id:2,name:'2025–2026',starts_on:'2025-08-01',ends_on:'2026-07-15'};
  expect(selectCurrentCycle([past,base],'2026-10-31')?.id).toBe(1);
  expect(selectCurrentCycle([base],'2027-08-01')).toBeUndefined();
  expect(selectCurrentCycle([{...base,status:'draft'}],'2026-10-31')).toBeUndefined();
 });
 it('does not imply SEP compliance from a progress score',()=>{
  expect(cycleProgress(base,1)).toMatchObject({completed:5,total:5,percentage:100,missing:[]});
  expect(cycleProgress({...base,third_term_ends_on:null,planned_school_days:null},0)).toMatchObject({
   completed:3,total:5,percentage:60,
   missing:['Tres trimestres','Días lectivos','Eventos del calendario']
  });
 });
 it('applies state, origin, readiness and search filters together',()=>{
  const draft={...base,id:2,name:'2027–2028',status:'draft',calendar_source:'manual',planned_school_days:null};
  const official={...base,calendar_source:'sep'};
  const events=[completeEvent];
  expect(filterCycles([draft,official],{query:'2026',status:'active',source:'sep',readiness:'complete',order:'newest'},events).map(x=>x.id)).toEqual([1]);
  expect(filterCycles([draft,official],{query:'',status:'draft',source:'',readiness:'pending',order:'newest'},events).map(x=>x.id)).toEqual([2]);
 });
 it('shows only forthcoming events for the featured cycle',()=>{
  const past={id:20,academic_year_id:1,starts_at:'2026-10-01T09:00:00'};
  const other={id:21,academic_year_id:2,starts_at:'2026-12-01T09:00:00'};
  const next={id:22,academic_year_id:1,starts_at:'2026-11-02T09:00:00'};
  expect(upcomingYearEvents([completeEvent,past,other,next],1,'2026-10-31').map(x=>x.id)).toEqual([22,10]);
 });
});