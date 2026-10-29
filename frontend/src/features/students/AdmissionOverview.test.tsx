// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmissionOverview from './AdmissionOverview';
import {filterAdmissionRows} from './AdmissionOverview';
const rows=[
 {id:1,academic_year_id:1,grade_level:1,created_at:'2026-10-01T10:00:00Z'},
 {id:2,academic_year_id:2,grade_level:2,created_at:'2026-10-02T10:00:00Z'}
];
it('filters admissions by cycle, grade and application date without changing the original list',()=>{
 expect(filterAdmissionRows(rows,{year:'2',grade:'2',date:'2026-10-02'}).map(x=>x.id)).toEqual([2]);
 expect(filterAdmissionRows(rows,{year:'',grade:'1',date:''}).map(x=>x.id)).toEqual([1]);
 expect(rows).toHaveLength(2);
});

it('filters applications by status and kind without mixing them with enrollment status',()=>{
 const applications=[{id:1,status:'submitted',kind:'new'},{id:2,status:'approved',kind:'reenrollment'},{id:3,status:'rejected',kind:'new'}];
 expect(filterAdmissionRows(applications,{year:'',grade:'',date:'',status:'approved',kind:'reenrollment'}).map(x=>x.id)).toEqual([2]);
 expect(filterAdmissionRows(applications,{year:'',grade:'',date:'',status:'submitted',kind:'reenrollment'})).toHaveLength(0);
});

it('exposes status and application type as usable filters',async()=>{
 const updates:string[]=[];
 render(<AdmissionOverview items={[]} years={[]} year="" onYear={()=>{}} grade="" onGrade={()=>{}} date="" onDate={()=>{}} status="" onStatus={value=>updates.push('status:'+value)} kind="" onKind={value=>updates.push('kind:'+value)} onReset={()=>{}}/>);
 await userEvent.click(screen.getByRole('combobox',{name:'Filtrar por estado de solicitud'}));
 await userEvent.click(screen.getByRole('option',{name:'En revisión'}));
 await userEvent.click(screen.getByRole('combobox',{name:'Filtrar por tipo de solicitud'}));
 await userEvent.click(screen.getByRole('option',{name:'Reinscripción'}));
 expect(updates).toEqual(['status:submitted','kind:reenrollment']);
});
