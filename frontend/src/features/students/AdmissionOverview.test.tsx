import {expect,it} from 'vitest';
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
