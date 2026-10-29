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

import {admissionHistoryLabel} from './english';
it('translates admission history actions to Spanish and English',()=>{
 expect(translateUiText('es',admissionHistoryLabel('admission.approved'))).toBe('Solicitud aprobada');
 expect(translateUiText('en',admissionHistoryLabel('admission.approved'))).toBe('Application approved');
 expect(translateUiText('en',admissionHistoryLabel('admission.formalized'))).toBe('Enrollment finalized');
});
it('maps school status codes consistently in both interface languages',()=>{
 expect(translateUiText('es','published')).toBe('Publicada');
 expect(translateUiText('en','published')).toBe('Published');
 expect(translateUiText('es','absent')).toBe('Ausente');
 expect(translateUiText('en','absent')).toBe('Absent');
});
