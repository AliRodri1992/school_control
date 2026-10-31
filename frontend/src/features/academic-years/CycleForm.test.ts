import {describe,expect,it} from 'vitest';
import {validateCycle} from './CycleForm';
const good={first_term_starts_on:'2026-08-24',first_term_ends_on:'2026-11-28',second_term_starts_on:'2026-11-29',second_term_ends_on:'2027-03-27',third_term_starts_on:'2027-03-28',third_term_ends_on:'2027-07-16',name:'2026-2027',starts_on:'2026-08-24',ends_on:'2027-07-16',admissions_open_on:'2026-02-01',admissions_close_on:'2026-04-30',reenrollment_open_on:'2026-05-01',reenrollment_close_on:'2026-06-30'};
describe('school cycle form validations',()=>{
 it('accepts independently ordered school, admission and reenrollment periods',()=>{expect(validateCycle(good)).toEqual({});});
 it('shows errors under each empty field using field labels',()=>{const errors=validateCycle({...good,name:'',admissions_open_on:''});expect(errors.name).toBe('Nombre del ciclo no puede estar vacío.');expect(errors.admissions_open_on).toBe('Inscripciones: apertura no puede estar vacío.');});
 it('rejects inverted periods and a one-day school year',()=>{const errors=validateCycle({...good,ends_on:good.starts_on,reenrollment_close_on:'2026-04-01'});expect(errors.ends_on).toBe('Fin de clases debe ser posterior al inicio de clases.');expect(errors.reenrollment_close_on).toContain('Reinscripciones: cierre');});
});

describe('evaluation trimesters',()=>{
 it('rejects overlapping evaluation dates',()=>{
  expect(validateCycle({...good,second_term_starts_on:'2026-11-28'}).second_term_starts_on).toContain('posterior');
 });
 it('rejects a trimester outside the school year',()=>{
  expect(validateCycle({...good,third_term_ends_on:'2027-08-01'}).third_term_ends_on).toContain('dentro del ciclo escolar');
 });
});

describe('administratively controlled lifecycle',()=>{
 it('checks chronological administrative closure and archival dates',()=>{
  expect(validateCycle({...good,administrative_closes_on:'2027-07-15'}).administrative_closes_on).toContain('anterior');
  expect(validateCycle({...good,administrative_closes_on:'2027-08-20',archive_on:'2027-08-01'}).archive_on).toContain('preceder');
 });
});
