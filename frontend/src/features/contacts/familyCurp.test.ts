import {expect,it} from 'vitest';
import {parseFamilyCurp} from './familyCurp';

const digits='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
function curp(part:string){
 const sum=[...part].reduce((n,char,index)=>n+digits.indexOf(char)*(18-index),0);
 return part+((10-sum%10)%10);
}
it('extracts an adult date and the CURP-encoded sex (not a self-reported gender)',()=>{
 expect(parseFamilyCurp(curp('SALS850720MDFLLF0'))).toEqual({birthDate:'1985-07-20',sex:'M'});
 expect(parseFamilyCurp(curp('SALS030719HDFLLFA'))).toEqual({birthDate:'2003-07-19',sex:'H'});
});
it('rejects tampered check digits, invalid calendar dates and future dates',()=>{
 const valid=curp('SALS850720MDFLLF0');
 expect(parseFamilyCurp(valid.slice(0,17)+((Number(valid[17])+1)%10))).toBeNull();
 expect(parseFamilyCurp(curp('SALS850230MDFLLF0'))).toBeNull();
 expect(parseFamilyCurp(curp('SALS991231MDFLLFA'))).toBeNull();
});
