import {expect,it} from 'vitest';
import {userInitials} from './userInitials';

it('uses the first and last significant name initials',()=>{
 expect(userInitials('María González')).toBe('MG');
 expect(userInitials('Ana María López')).toBe('AL');
 expect(userInitials('José de la Cruz')).toBe('JC');
 expect(userInitials('Juan del Río')).toBe('JR');
});

it('handles extra whitespace, punctuation, hyphens and diacritics',()=>{
 expect(userInitials('  Álvaro   Núñez  ')).toBe('ÁN');
 expect(userInitials('Ana-María Pérez')).toBe('AP');
 expect(userInitials("  O'Connor  Muñoz ")).toBe('OM');
 expect(userInitials('Élodie')).toBe('ÉL');
});

it('handles one-letter names and missing names safely',()=>{
 expect(userInitials('A')).toBe('A');
 expect(userInitials('')).toBe('US');
 expect(userInitials(null)).toBe('US');
 expect(userInitials(undefined)).toBe('US');
});
