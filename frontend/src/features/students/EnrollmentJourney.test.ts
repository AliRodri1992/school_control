import {expect,it} from 'vitest';
import {journeyStats,enrollmentGrade,gradeEnrollmentCounts} from './EnrollmentJourney';
it('separates active enrollment, completed years and promotions',()=>{
 expect(journeyStats([{status:'active'},{status:'completed',outcome:'promoted'}])).toEqual({total:2,active:1,completed:1,promoted:1});
});

it('counts all six grades even when a particular grade is selected in the table',()=>{
 const groups=new Map([['1',{grade_level:1}],['2',{grade_level:'2'}]]);
 const rows=[{group_id:1},{group_id:2},{group_id:9,group_label:'3° A · 2026-2027'}];
 expect(gradeEnrollmentCounts(rows,groups)).toEqual([1,1,1,0,0,0]);
 expect(enrollmentGrade(rows[2],groups)).toBe(3);
 expect(rows.filter(row=>enrollmentGrade(row,groups)===1)).toHaveLength(1);
});
