import {describe,expect,it} from 'vitest';
import {birthDateFromCurp} from './curpBirthDate';
describe('CURP date extraction',()=>{
 const today=new Date(2026,9,31);
 it('extracts dates for people born in the 2000s',()=>expect(birthDateFromCurp('DEMO200101MDFRNN01',today)).toBe('2020-01-01'));
 it('extracts dates for people born in the 1900s',()=>expect(birthDateFromCurp('DEMO991231MDFRNN01',today)).toBe('1999-12-31'));
 it('rejects invalid calendar dates',()=>expect(birthDateFromCurp('DEMO230231MDFRNN01',today)).toBeNull());
 it('rejects incomplete and invalid CURPs',()=>{
  expect(birthDateFromCurp('DEMO200101',today)).toBeNull();
  expect(birthDateFromCurp('DEMO260231MDFRNN01',today)).toBeNull();
 });
});
