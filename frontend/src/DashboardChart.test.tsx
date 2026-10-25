// @vitest-environment jsdom
import {expect,it,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
import type {ReactNode} from 'react';
import DashboardChart from './DashboardChart';
import type {AnalyticChartKind} from './dashboardConfig';

vi.mock('recharts',()=>{
 const Wrap=({children}:{children:ReactNode})=><div>{children}</div>;
 return {
  ResponsiveContainer:Wrap,PieChart:Wrap,Pie:Wrap,Cell:()=>null,Tooltip:()=>null,
  LineChart:Wrap,Line:()=>null,AreaChart:Wrap,Area:()=>null,BarChart:Wrap,
  Bar:()=>null,XAxis:()=>null,YAxis:()=>null,Legend:()=>null,CartesianGrid:()=>null
 };
});
afterEach(cleanup);
const translate=(value:string)=>value;

it.each(['attendance_rate','admission_status','assignment_progress'] as AnalyticChartKind[])(
 'renders %s with percentages calculated from the actual server totals',kind=>{
  const {container}=render(<DashboardChart kind={kind} title="Distribución"
   data={[{label:'Asistencias',value:3},{label:'Faltas',value:1}]} translate={translate}/>);
  expect(screen.getByRole('group',{name:'Distribución'})).toBeTruthy();
  expect(container.querySelectorAll('.sc-analytics-legend-item')).toHaveLength(2);
  expect(screen.getByText('75%')).toBeTruthy();
  expect(screen.getByText('25%')).toBeTruthy();
 });
it.each(['enrollment_trend','grades_by_term','attendance_trend','students_by_grade','grades_by_subject','grade_distribution','monthly_absences'] as AnalyticChartKind[])(
 'renders %s with real data and an accessible heading',kind=>{
  const data=kind==='monthly_absences'?[{label:'2026-10',absent:2,late:1}]:[{label:'2026-10',value:8}];
  const {container}=render(<DashboardChart kind={kind} data={data} title="Tendencia" translate={translate}/>);
  expect(screen.getByRole('group',{name:'Tendencia'})).toBeTruthy();
  expect(container.querySelector('.sc-analytics-canvas')).toBeTruthy();
  expect(screen.getByText('1 categoría · Datos reales del periodo seleccionado')).toBeTruthy();
 });
it('handles missing, malformed and zero-only statistics without generating fabricated values',()=>{
 const {rerender,container}=render(<DashboardChart kind="attendance_rate" data={null} title="Asistencia" translate={translate}/>);
 expect(container.querySelector('[data-empty-kind="attendance_rate"]')).toBeTruthy();
 rerender(<DashboardChart kind="grades_by_term" data={[{label:'P1',value:0}]} title="Calificaciones" translate={translate}/>);
 expect(screen.queryByRole('status')).toBeNull();
 expect(screen.getByRole('group',{name:'Calificaciones'})).toBeTruthy();
 rerender(<DashboardChart kind="attendance_trend" data={[{label:'P1',value:'inseguro'}]} title="Serie" translate={translate}/>);
 expect(screen.getByRole('status').textContent).toContain('Sin datos');
});

it.each([
 ['admission_status','Aún no hay admisiones'],
 ['attendance_rate','Sin datos de asistencia'],
 ['students_by_grade','Aún no hay alumnos por grado'],
 ['enrollment_trend','Sin matrícula para comparar']
] as [AnalyticChartKind,string][])(
 'renders a distinctive empty state for %s on missing and zero-only data',
 (kind,expectedTitle)=>{
  const {rerender,container}=render(<DashboardChart kind={kind} data={undefined} title="Mi gráfica" translate={translate}/>);
  expect(container.querySelector('[data-empty-kind="'+kind+'"]')).toBeTruthy();
  expect(screen.getByText(expectedTitle)).toBeTruthy();
  expect(container.querySelector('.sc-analytics-canvas')).toBeNull();
  expect(container.querySelector('.sc-dashboard-empty-art svg')).toBeTruthy();
  expect(container.querySelector('.sc-dashboard-empty-note')).toBeTruthy();
  rerender(<DashboardChart kind={kind} data={[{label:'Uno',value:0},{label:'Dos',value:0}]}
   title="Mi gráfica" translate={translate}/>);
  expect(container.querySelector('[data-empty-kind="'+kind+'"]')).toBeTruthy();
  expect(container.querySelector('.sc-analytics-canvas')).toBeNull();
 }
);
it.each([
 'admission_status','attendance_rate','students_by_grade','enrollment_trend'
] as AnalyticChartKind[])('preserves actual %s chart values',kind=>{
 const {container}=render(<DashboardChart kind={kind} data={[{label:'Periodo 1',value:9},{label:'Periodo 2',value:3}]}
  title="Datos registrados" translate={translate}/>);
 expect(container.querySelector('.sc-dashboard-empty')).toBeNull();
 expect(screen.getByRole('group',{name:'Datos registrados'})).toBeTruthy();
 expect(container.querySelector('.sc-analytics-canvas, .sc-analytics-plot')).toBeTruthy();
});
it.each([
 ['teacher','La proporción de asistencias y faltas de tus grupos aparecerá cuando haya registros.'],
 ['guardian','La proporción de asistencias y faltas de tus hijos aparecerá cuando haya registros.'],
 ['student','Tu distribución de asistencia y faltas aparecerá cuando haya registros.']
] as const)('scopes the empty attendance distribution to the %s portal',(role,description)=>{
 const {container}=render(<DashboardChart kind="attendance_rate" data={[]} title="Distribución"
  translate={translate} role={role}/>);
 expect(container.querySelector('[data-empty-kind="attendance_rate"]')).toBeTruthy();
 expect(screen.getByText(description)).toBeTruthy();
});
