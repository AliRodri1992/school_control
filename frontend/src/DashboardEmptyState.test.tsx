// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import DashboardEmptyState,{type DashboardEmptyKind} from './DashboardEmptyState';
import type {DashboardRole} from './dashboardConfig';

afterEach(cleanup);
const translate=(value:string)=>value;

it.each([
 ['alerts','Sin alertas por revisar','Criterio: 3 faltas en 30 días'],
 ['attendance','Aún no hay registros de asistencia','El gráfico se actualiza con nuevos registros'],
 ['calendar','No hay eventos próximos','Calendario institucional']
] as [DashboardEmptyKind,string,string][])(
 'renders a dedicated and accessible empty state for %s',
 (kind,title,note)=>{
  const {container}=render(<DashboardEmptyState kind={kind} role="admin" translate={translate}/>);
  const state=container.querySelector('.sc-dashboard-empty')!;
  expect(state.getAttribute('data-empty-kind')).toBe(kind);
  expect(state.getAttribute('aria-label')).toBe(title);
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.getByText(note)).toBeTruthy();
  expect(container.querySelector('.sc-dashboard-empty-icon svg')).toBeTruthy();
  expect(container.querySelector('.sc-dashboard-empty-description')).toBeTruthy();
  expect(container.querySelector('button')).toBeNull();
 }
);

it('shows an all-clear symbol for resolved monitoring only, not when school data is missing',()=>{
 const alerts=render(<DashboardEmptyState kind="alerts" role="admin" translate={translate}/>);
 expect(alerts.container.querySelector('.sc-dashboard-empty-check')).toBeTruthy();
 alerts.unmount();
 const attendance=render(<DashboardEmptyState kind="attendance" role="admin" translate={translate}/>);
 expect(attendance.container.querySelector('.sc-dashboard-empty-check')).toBeNull();
 attendance.unmount();
 const calendar=render(<DashboardEmptyState kind="calendar" role="admin" translate={translate}/>);
 expect(calendar.container.querySelector('.sc-dashboard-empty-check')).toBeNull();
});

it.each([
 ['admin','Cuando se registren asistencias, verás aquí su distribución por estado.'],
 ['teacher','Las asistencias de tus grupos aparecerán aquí cuando se registren.'],
 ['guardian','Las asistencias de tus hijos aparecerán aquí cuando se registren.'],
 ['student','Tu resumen de asistencias aparecerá aquí cuando haya registros.']
] as [DashboardRole,string][])(
 'uses appropriately scoped attendance guidance for %s',
 (role,description)=>{
  render(<DashboardEmptyState kind="attendance" role={role} translate={translate}/>);
  expect(screen.getByText(description)).toBeTruthy();
 }
);

it('applies a distinct, restrained theme to each empty state',()=>{
 const variants:[DashboardEmptyKind,string][]=[
  ['alerts','mint'],['attendance','blue'],['calendar','violet']
 ];
 for(const [kind,tone] of variants){
  const view=render(<DashboardEmptyState kind={kind} role="admin" translate={translate}/>);
  expect(view.container.querySelector('.sc-dashboard-empty-'+tone)).toBeTruthy();
  view.unmount();
 }
});

it.each([
 ['admission_status','Aún no hay admisiones','amber','Estados: enviadas, aprobadas y rechazadas'],
 ['attendance_rate','Sin datos de asistencia','cyan','Resumen del periodo seleccionado'],
 ['students_by_grade','Aún no hay alumnos por grado','indigo','Grados del ciclo escolar disponible'],
 ['enrollment_trend','Sin matrícula para comparar','teal','Comparativo de ciclos escolares']
] as [DashboardEmptyKind,string,string,string][])(
 'shows a role-safe, custom illustration and help text for %s',
 (kind,title,tone,note)=>{
  const {container}=render(<DashboardEmptyState kind={kind} role="admin" translate={translate}/>);
  const card=container.querySelector('.sc-dashboard-empty')!;
  expect(card.getAttribute('aria-label')).toBe(title);
  expect(card.classList.contains('sc-dashboard-empty-'+tone)).toBe(true);
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.getByText(note)).toBeTruthy();
  expect(container.querySelector('.sc-dashboard-empty-icon svg')).toBeTruthy();
  expect(container.querySelector('.sc-dashboard-empty-check')).toBeNull();
  expect(container.querySelectorAll('button')).toHaveLength(0);
 }
);
it.each([
 ['teacher','La proporción de asistencias y faltas de tus grupos aparecerá cuando haya registros.'],
 ['guardian','La proporción de asistencias y faltas de tus hijos aparecerá cuando haya registros.'],
 ['student','Tu distribución de asistencia y faltas aparecerá cuando haya registros.']
] as [DashboardRole,string][])(
 'uses attendance distribution guidance relevant to the %s portal',
 (role,description)=>{
  render(<DashboardEmptyState kind="attendance_rate" role={role} translate={translate}/>);
  expect(screen.getByText(description)).toBeTruthy();
 }
);
