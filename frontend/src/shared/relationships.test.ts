import {describe,expect,it} from 'vitest';
import {FAMILY_RELATIONSHIPS,relationshipChoices} from './relationships';

describe('shared school contact relationships',()=>{
 it('includes close relatives, extended family and responsible adults',()=>{
  for(const value of ['Madre','Padre','Abuela','Abuelo','Tía','Tío','Hermana','Hermano','Tutora legal','Tutor legal','Persona cuidadora','Otro parentesco'])
   expect(FAMILY_RELATIONSHIPS).toContain(value);
 });
 it('preserves historical custom values on edit without changing the saved value',()=>{
  expect(relationshipChoices('Responsable autorizado')).toContainEqual({
   value:'Responsable autorizado',label:'Responsable autorizado (registrado anteriormente)'
  });
 });
 it('does not duplicate a standard relationship',()=>{
  expect(relationshipChoices('Madre').filter(option=>option.value==='Madre')).toHaveLength(1);
 });
});
