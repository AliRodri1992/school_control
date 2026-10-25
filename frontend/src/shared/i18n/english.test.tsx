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

it('translates each purpose-built dashboard empty state into English',()=>{
 const phrases=[
  'SEGUIMIENTO ESCOLAR','Sin alertas por revisar',
  'No se detectaron casos con tres o más inasistencias durante los últimos 30 días.',
  'Criterio: 3 faltas en 30 días',
  'ÚLTIMOS 30 DÍAS','Aún no hay registros de asistencia',
  'Cuando se registren asistencias, verás aquí su distribución por estado.',
  'Las asistencias de tus grupos aparecerán aquí cuando se registren.',
  'Las asistencias de tus hijos aparecerán aquí cuando se registren.',
  'Tu resumen de asistencias aparecerá aquí cuando haya registros.',
  'El gráfico se actualiza con nuevos registros',
  'AGENDA ESCOLAR','No hay eventos próximos',
  'Las siguientes actividades del calendario escolar aparecerán en este espacio.',
  'Calendario institucional'
 ];
 for(const phrase of phrases){
  expect(translateUiText('en',phrase)).not.toBe(phrase);
  expect(translateUiText('es',phrase)).toBe(phrase);
 }
});

it('translates all four redesigned analytics empty states, including role-aware attendance',()=>{
 const phrases=[
  'PROCESO DE ADMISIÓN','Aún no hay admisiones',
  'Cuando haya solicitudes registradas en tu ámbito autorizado, verás la distribución de sus estados.',
  'Estados: enviadas, aprobadas y rechazadas',
  'PANORAMA DE ASISTENCIA','Sin datos de asistencia',
  'La proporción de asistencias y faltas aparecerá cuando existan registros en el periodo.',
  'Resumen del periodo seleccionado',
  'La proporción de asistencias y faltas de tus grupos aparecerá cuando haya registros.',
  'La proporción de asistencias y faltas de tus hijos aparecerá cuando haya registros.',
  'Tu distribución de asistencia y faltas aparecerá cuando haya registros.',
  'DISTRIBUCIÓN ESCOLAR','Aún no hay alumnos por grado',
  'Aquí podrás comparar alumnos por grado cuando existan inscripciones en los grupos autorizados.',
  'Grados del ciclo escolar disponible',
  'EVOLUCIÓN DE MATRÍCULA','Sin matrícula para comparar',
  'La evolución de inscripciones aparecerá cuando existan registros en los ciclos escolares disponibles.',
  'Comparativo de ciclos escolares'
 ];
 for(const phrase of phrases){
  expect(translateUiText('en',phrase)).not.toBe(phrase);
  expect(translateUiText('es',phrase)).toBe(phrase);
 }
});

it('translates the restoration notice and its save action for customized dashboards',()=>{
 for(const phrase of [
  'Recuperamos las gráficas que faltaban sin modificar tus tarjetas personalizadas.',
  'Guardar gráficas recuperadas'
 ]){
  expect(translateUiText('en',phrase)).not.toBe(phrase);
  expect(translateUiText('es',phrase)).toBe(phrase);
 }
});

it('translates the notice explaining repaired multi-column dashboard rows',()=>{
 for(const phrase of [
  'Organizamos las gráficas en filas, sin cambiar las posiciones de tus otras tarjetas.',
  'Guardar distribución corregida'
 ]){
  expect(translateUiText('en',phrase)).not.toBe(phrase);
  expect(translateUiText('es',phrase)).toBe(phrase);
 }
});

it('translates the single profile-save toast correctly',()=>{
 expect(translateUiText('en','Perfil actualizado correctamente.')).toBe('Profile updated successfully.');
 expect(translateUiText('es','Perfil actualizado correctamente.')).toBe('Perfil actualizado correctamente.');
});


it('localizes the full-width preference workspace, the single save toast, and selected settings',()=>{
 const phrases=[
  'PERSONALIZACIÓN',
  'Adapta tu espacio de trabajo y configura cómo utilizas School Control cada día.',
  'Cambios sin guardar','Configuración al día',
  'TU ESPACIO, TUS REGLAS','Una experiencia hecha para ti',
  'Idioma de la interfaz','Solo se muestran idiomas habilitados por la escuela. El cambio se aplicará cuando guardes.',
  '02 · APARIENCIA','Se adapta a tu dispositivo','Espacios luminosos','Menos brillo en pantalla',
  '03 · VISUALIZACIÓN','Decide cuántos registros se muestran en los listados del sistema.',
  'Vista previa de preferencias','Representación ilustrativa del tema y la densidad seleccionados.',
  'Vista ilustrativa · No representa información real de la escuela',
  'Resumen de tu configuración','Los cambios se aplicarán a tu cuenta al guardarlos.',
  'Tus ajustes están actualizados','Guardar preferencias','Preferencias actualizadas correctamente.'
 ];
 for(const text of phrases){
  expect(translateUiText('en',text)).not.toBe(text);
  expect(translateUiText('es',text)).toBe(text);
 }
});
