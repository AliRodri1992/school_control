import {describe,expect,it} from 'vitest';
import {translateUiText} from './english';
describe('admission status translation',()=>{
 it('shows backend status codes in Spanish UI',()=>{
  expect(translateUiText('es','approved')).toBe('Aprobada');
  expect(translateUiText('es-MX','correction_requested')).toBe('Correcciones solicitadas');
 });
 it('shows backend status codes in English UI',()=>{
  expect(translateUiText('en','approved')).toBe('Approved');
  expect(translateUiText('en','rejected')).toBe('Rejected');
 });
});
