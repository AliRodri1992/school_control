import {expect,it} from 'vitest';
import {studentInitials,studentDirectoryStats} from './studentDirectory';
it('renders initial avatars for complete and incomplete student names',()=>{
 expect(studentInitials({full_name:'Ana María López'})).toBe('AL');
 expect(studentInitials({first_name:'Luis',last_name:'Pérez'})).toBe('LP');
 expect(studentInitials({})).toBe('A');
});
it('counts available student records without inventing academic statuses',()=>{
 expect(studentDirectoryStats([{id:1,curp:'AAA'},{id:2,curp:''},{id:3}])).toEqual({total:3,withCurp:1});
});
