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
 const {rerender}=render(<DashboardChart kind="attendance_rate" data={null} title="Asistencia" translate={translate}/>);
 expect(screen.getByRole('status').textContent).toContain('Sin datos');
 rerender(<DashboardChart kind="grades_by_term" data={[{label:'P1',value:0}]} title="Calificaciones" translate={translate}/>);
 expect(screen.queryByRole('status')).toBeNull();
 expect(screen.getByRole('group',{name:'Calificaciones'})).toBeTruthy();
 rerender(<DashboardChart kind="attendance_trend" data={[{label:'P1',value:'inseguro'}]} title="Serie" translate={translate}/>);
 expect(screen.getByRole('status').textContent).toContain('Sin datos');
});
