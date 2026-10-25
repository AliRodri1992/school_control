// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LocaleProvider,useInterfaceLocale,useSchoolLocale} from './LocaleContext';
import {localizedModules} from '../../modules';
import {translateUiText} from './english';
import TableAction from '../components/TableAction';

afterEach(()=>{cleanup();localStorage.removeItem('school-locale');});

function LocalizedSchool(){
 const {locale,ui,t}=useSchoolLocale();
 const meta=localizedModules(ui);
 return <div>
  <h1>{meta.students.title}</h1>
  <p>{meta.students.subtitle}</p>
  <span>{meta.students.fields[0].label}</span>
  <span>{meta.students.columns[0][1]}</span>
  <span>{t('portal.shortcuts','Accesos rápidos')}</span>
  <span>{locale}</span>
  <TableAction kind="edit"/>
 </div>;
}

it('translates module descriptions, fields, table headers and actions in English',()=>{
 render(<LocaleProvider locale="en" translations={{}}><LocalizedSchool/></LocaleProvider>);
 expect(screen.getByRole('heading',{name:'Student records'})).toBeTruthy();
 expect(screen.getByText('A complete school journey, from first through sixth grade.')).toBeTruthy();
 expect(screen.getByText('First name(s)')).toBeTruthy();
 expect(screen.getByText('Student')).toBeTruthy();
 expect(screen.getByText('Quick access')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Edit'}).getAttribute('title')).toBe('Edit');
});

it('keeps Mexican Spanish as the default and prioritizes published translations',()=>{
 render(<LocaleProvider locale="es" translations={{'portal.shortcuts':'Accesos institucionales'}}><LocalizedSchool/></LocaleProvider>);
 expect(screen.getByRole('heading',{name:'Expedientes'})).toBeTruthy();
 expect(screen.getByText('Nombre(s)')).toBeTruthy();
 expect(screen.getByText('Accesos institucionales')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Editar'}).getAttribute('title')).toBe('Editar');
});

function LanguageSwitch(){
 const {locale,ui}=useInterfaceLocale();
 return <><p>{locale}:{ui('Editar')}</p>
  <button type="button" onClick={()=>{localStorage.setItem('school-locale','en');window.dispatchEvent(new Event('school-locale-changed'));}}>Switch language</button></>;
}

it('refreshes the interface when the user changes language without reloading',async()=>{
 localStorage.setItem('school-locale','es');
 render(<LanguageSwitch/>);
 expect(screen.getByText('es:Editar')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Switch language'}));
 expect(screen.getByText('en:Edit')).toBeTruthy();
});

it('localizes role-aware KPI categories, units, descriptions and pending statuses',()=>{
 const phrases=[
  'Familia','Comunidad escolar','Matrícula','Admisiones','Organización',
  'Mi jornada','Evaluación','Documentación',
  'Hijos vinculados a tu cuenta','Clases previstas en tu horario para hoy',
  'Clases de los grupos de tus hijos','Clases programadas de tus grupos para hoy',
  'Expedientes dentro de tu alcance','Inscripciones con estado activo',
  'Solicitudes que esperan revisión','Clases programadas para hoy',
  'Requiere seguimiento','Sin pendientes','Información actual','hijos'
 ];
 for(const phrase of phrases){
  expect(translateUiText('en',phrase)).not.toBe(phrase);
  expect(translateUiText('es',phrase)).toBe(phrase);
 }
});
