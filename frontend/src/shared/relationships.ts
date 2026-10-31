import type {Choice} from './components/Combobox';

// Shared school-contact relationships. Keep the recorded value stable across modules.
export const FAMILY_RELATIONSHIPS = [
 'Madre','Padre','Madrastra','Padrastro','Madre adoptiva','Padre adoptivo',
 'Madre de acogida','Padre de acogida',
 'Abuela','Abuelo','Bisabuela','Bisabuelo','Tatarabuela','Tatarabuelo',
 'Hermana','Hermano','Media hermana','Medio hermano','Hermanastra','Hermanastro',
 'Tía','Tío','Tía abuela','Tío abuelo','Prima','Primo',
 'Sobrina','Sobrino','Nieta','Nieto',
 'Madrina','Padrino','Tutora legal','Tutor legal','Representante legal',
 'Responsable de crianza','Persona cuidadora','Familia de acogida',
 'Pareja de la madre','Pareja del padre','Amiga de la familia','Amigo de la familia',
 'Vecina','Vecino','Otra persona de confianza','Otro parentesco'
] as const;

export function relationshipChoices(current=''):Choice[]{
 const choices:Choice[]=FAMILY_RELATIONSHIPS.map(name=>({value:name,label:name}));
 const legacy=current.trim();
 if(legacy&&!choices.some(option=>option.value===legacy))
  choices.push({value:legacy,label:legacy+' (registrado anteriormente)'});
 return choices;
}
