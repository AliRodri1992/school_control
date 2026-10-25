// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {metricKinds,defaultConfig,type DashboardRole} from './dashboardConfig';
import DashboardMetricCard from './DashboardMetricCard';

afterEach(cleanup);

const identity=(text:string)=>text;

it.each(['admin','teacher','guardian','student'] as DashboardRole[])('renders a branded yet consistent KPI card for the %s portal',role=>{
 const {container}=render(<DashboardMetricCard kind="today_classes" title="Clases de hoy"
  value={12} role={role} locale="es" translate={identity}/>);
 const card=screen.getByRole('article',{name:'Clases de hoy: 12'});
 expect(card.getAttribute('data-portal')).toBe(role);
 expect(card.getAttribute('data-metric')).toBe('today_classes');
 expect(card.classList.contains('sc-kpi-card')).toBe(true);
 expect(container.querySelector('.sc-kpi-icon svg')).toBeTruthy();
 expect(screen.getByText('Mi jornada')).toBeTruthy();
 expect(screen.getByText('Clases programadas para hoy')).toBeTruthy();
 expect(screen.getByText('Información actual')).toBeTruthy();
 expect(screen.getByText('12')).toBeTruthy();
});

it.each(metricKinds)('defines a real indicator presentation for %s',kind=>{
 const {container}=render(<DashboardMetricCard kind={kind} title={kind}
  value={3} role="admin" locale="es" translate={identity}/>);
 expect(screen.getByRole('article',{name:kind+': 3'})).toBeTruthy();
 expect(container.querySelector('.sc-kpi-icon svg')).toBeTruthy();
 expect(container.querySelector('.sc-kpi-number')?.textContent).toBe('3');
});

it('formats large totals using the preferred locale without invented percent changes',()=>{
 const {container}=render(<DashboardMetricCard kind="students" title="Expedientes"
  value={12500} role="guardian" locale="es" translate={identity}/>);
 expect(container.querySelector('.sc-kpi-number')?.textContent).toBe(
  new Intl.NumberFormat('es-MX').format(12500)
 );
 expect(container.textContent).not.toMatch(/\d+%/);
 expect(container.querySelector('.sc-kpi-accent')).toBeTruthy();
 expect(container.querySelector('.sc-kpi-corner')).toBeNull();
});

it('treats zero as a valid metric and distinguishes pending versus current work',()=>{
 const {rerender}=render(<DashboardMetricCard kind="pending_admissions" title="Solicitudes pendientes"
  value={0} role="admin" locale="es" translate={identity}/>);
 expect(screen.getByText('Sin pendientes')).toBeTruthy();
 expect(screen.queryByText('Requiere seguimiento')).toBeNull();
 rerender(<DashboardMetricCard kind="pending_admissions" title="Solicitudes pendientes"
  value={4} role="admin" locale="es" translate={identity}/>);
 expect(screen.getByText('Requiere seguimiento')).toBeTruthy();
 expect(screen.getByText('4')).toBeTruthy();
});

it('handles missing or corrupt summary values without displaying NaN',()=>{
 const {rerender,container}=render(<DashboardMetricCard kind="groups" title="Grupos"
  value={undefined} role="teacher" locale="es" translate={identity}/>);
 expect(container.querySelector('.sc-kpi-number')?.textContent).toBe('0');
 rerender(<DashboardMetricCard kind="groups" title="Grupos"
  value={'not-a-number'} role="teacher" locale="es" translate={identity}/>);
 expect(container.querySelector('.sc-kpi-number')?.textContent).toBe('0');
});

it('preserves dashboard editing, drag handle and accessible action controls',()=>{
 const onClick=vi.fn();
 const {container}=render(<DashboardMetricCard kind="students" title="Mis expedientes"
  value={9} role="admin" locale="en" translate={identity} editing
  actions={<button type="button" onClick={onClick}>Remove widget</button>}/>);
 expect(container.querySelector('.widget-handle')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Remove widget'})).toBeTruthy();
 expect(screen.getByText('Mis expedientes')).toBeTruthy();
});

it('includes compact KPI widgets in all four initial role presets',()=>{
 for(const role of ['admin','teacher','guardian','student'] as DashboardRole[]){
  const config=defaultConfig(role);
  expect(config.widgets.some(widget=>metricKinds.some(kind=>kind===widget.kind))).toBe(true);
 }
});
