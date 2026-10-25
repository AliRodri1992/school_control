// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {ReactNode} from 'react';
import Dashboard from './Dashboard';
import {api} from './api';
import {notify} from './notifications';
import {appendWidget,defaultConfig} from './dashboardConfig';

vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./DashboardChart',()=>({default:({title}:{title:string})=><div data-testid="analytics-chart">{title}</div>}));
vi.mock('./shared/i18n/LocaleContext',()=>({
 useSchoolLocale:()=>({ui:(text:string)=>text,locale:'es'})
}));
vi.mock('./shared/components/Combobox',()=>({
 default:({value,onChange,options,label}:{value:string;onChange:(value:string)=>void;
  options:{value:string;label:string}[];label:string})=><select
  aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>
  {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
}));
vi.mock('react-grid-layout/legacy',()=>({
 Responsive:({children,onLayoutChange}:{children:ReactNode;onLayoutChange:(layout:unknown,all:Record<string,unknown>)=>void})=>
  <div data-testid="grid">
   {children}
   <button type="button" data-testid="grid-layout-event" onClick={()=>onLayoutChange([],{
    lg:[{i:'obsolete',x:0,y:0,w:4,h:6}]
   })}>Emit intermediate layout</button>
  </div>,
 WidthProvider:(Component:unknown)=>Component
}));
vi.mock('recharts',()=>({
 ResponsiveContainer:({children}:{children:ReactNode})=><div>{children}</div>,
 BarChart:({children}:{children:ReactNode})=><div>{children}</div>,
 Bar:()=>null,XAxis:()=>null,YAxis:()=>null,Tooltip:()=>null
}));
const custom=appendWidget(defaultConfig('admin'),'announcements','Mi widget adicional','my-extra');

beforeEach(()=>{
 vi.mocked(api).mockReset().mockImplementation(async (resource:string,method?:string)=>{
  if(resource==='dashboard_preference'&&method==='PUT')return {configuration:defaultConfig('admin'),lock_version:2};
  if(resource==='dashboard_preference')return {configuration:custom,lock_version:1};
  return {};
 });
 vi.mocked(notify).mockReset();
});
afterEach(cleanup);

async function personalize(){
 const button=await screen.findByRole('button',{name:'Personalizar'}) as HTMLButtonElement;
 await waitFor(()=>expect(button.disabled).toBe(false));
 await userEvent.click(button);
}

it('groups Restore and Save as adjacent dashboard actions, with Save primary',async()=>{
 const {container}=render(<Dashboard summary={{}} data={{}}/>);
 await personalize();
 const actions=container.querySelector('.dashboard-control-actions')!;
 expect(screen.getByRole('group',{name:'Acciones del dashboard'})).toBe(actions);
 const buttons=Array.from(actions.querySelectorAll('button'));
 expect(buttons.map(button=>button.textContent)).toEqual(['Restablecer plantilla','Guardar dashboard']);
 expect(buttons[0].classList.contains('dashboard-action-reset')).toBe(true);
 expect(buttons[1].classList.contains('dashboard-action-primary')).toBe(true);
});

it('restores the factory widgets visibly and saves exactly that template',async()=>{
 render(<Dashboard summary={{}} data={{}}/>);
 await personalize();
 expect(screen.getByText('Mi widget adicional')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Restablecer plantilla'}));
 expect(screen.queryByText('Mi widget adicional')).toBeNull();
 expect(screen.getByRole('status').textContent).toContain('Pulsa Guardar dashboard');
 await userEvent.click(screen.getByTestId('grid-layout-event'));
 await userEvent.click(screen.getByRole('button',{name:'Guardar dashboard'}));
 await waitFor(()=>expect(vi.mocked(api).mock.calls.some(call=>call[0]==='dashboard_preference'&&call[1]==='PUT')).toBe(true));
 const call=vi.mocked(api).mock.calls.find(call=>call[0]==='dashboard_preference'&&call[1]==='PUT');
 expect(call?.[2]).toEqual({configuration:defaultConfig('admin'),lock_version:1});
 expect(screen.queryByRole('status')).toBeNull();
 expect(await screen.findByRole('button',{name:'Personalizar'})).toBeTruthy();
 expect(notify).toHaveBeenCalledWith('Dashboard guardado correctamente.');
});

it('waits for Save before persisting a restored template',async()=>{
 render(<Dashboard summary={{}} data={{}}/>);
 await personalize();
 await userEvent.click(screen.getByRole('button',{name:'Restablecer plantilla'}));
 expect(vi.mocked(api).mock.calls.filter(call=>call[1]==='PUT')).toHaveLength(0);
 expect(screen.getByRole('status')).toBeTruthy();
});

it('keeps editing enabled if saving the factory template fails',async()=>{
 vi.mocked(api).mockImplementation(async (resource:string,method?:string)=>{
  if(resource==='dashboard_preference'&&method==='PUT')throw new Error('Conflicto de versión');
  if(resource==='dashboard_preference')return {configuration:custom,lock_version:1};
  return {};
 });
 render(<Dashboard summary={{}} data={{}}/>);
 await personalize();
 await userEvent.click(screen.getByRole('button',{name:'Restablecer plantilla'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar dashboard'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Conflicto de versión');
 expect(screen.getByRole('status')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Guardar dashboard'})).toBeTruthy();
});

it.each(['admin','teacher','guardian','student'] as const)('integrates real KPI cards for the %s portal without changing chart widgets',async role=>{
 vi.mocked(api).mockImplementation(async(resource:string)=>{
  if(resource==='dashboard_preference')return {configuration:defaultConfig(role),lock_version:1};
  return {};
 });
 const summary={students:4,enrollments:4,pending_admissions:4,pending_documents:4,
  today_classes:4,grade_drafts:4,groups:4,attendance_chart:{}};
 const {container}=render(<Dashboard summary={summary} data={{}} role={role} userId={9}/>);
 const expected=defaultConfig(role).widgets.filter(widget=>!widget.kind.endsWith('_chart')&&
  ['students','enrollments','pending_admissions','pending_documents','today_classes','grade_drafts','groups'].includes(widget.kind));
 await waitFor(()=>expect(container.querySelectorAll('.sc-kpi-card')).toHaveLength(expected.length));
 for(const widget of expected){
  expect(screen.getByRole('article',{name:widget.title+': 4'})).toBeTruthy();
 }
 if(role==='guardian'){
  expect(screen.getByText('Hijos vinculados a tu cuenta')).toBeTruthy();
  expect(screen.getByText('Familia')).toBeTruthy();
 }
 if(role==='student')expect(screen.getByText('Clases previstas en tu horario para hoy')).toBeTruthy();
 expect(container.querySelector('.sc-kpi-corner')).toBeNull();
 expect(screen.getByRole('heading',{name:'Asistencia · últimos 30 días'})).toBeTruthy();
});

it('mounts each KPI inside a real grid item so the grid reserves space above the footer',async()=>{
 vi.mocked(api).mockImplementation(async resource=>
  resource==='dashboard_preference'?{configuration:defaultConfig('admin'),lock_version:1}:{}
 );
 const {container}=render(<Dashboard summary={{students:10,enrollments:6,pending_admissions:2,pending_documents:1}}
  data={{}} role="admin" userId={1}/>);
 await waitFor(()=>expect(container.querySelectorAll('.sc-kpi-grid-item')).toHaveLength(4));
 const grid=screen.getByTestId('grid');
 const wrappers=Array.from(grid.querySelectorAll('.sc-kpi-grid-item'));
 expect(wrappers.map(item=>item.getAttribute('data-widget'))).toEqual([
  'students','enrollments','pending_admissions','pending_documents'
 ]);
 expect(wrappers.every(item=>item.children.length===1&&item.firstElementChild?.classList.contains('sc-kpi-card'))).toBe(true);
 expect(grid.querySelectorAll(':scope > article.dashboard-widget')).toHaveLength(defaultConfig('admin').widgets.length-4);
});

it('restores widget builder fields alongside the default layout',async()=>{
 render(<Dashboard summary={{}} data={{}}/>);
 await personalize();
 const kind=screen.getByRole('combobox',{name:'Tipo de widget'}) as HTMLSelectElement;
 const title=screen.getByRole('textbox',{name:'Título del widget'}) as HTMLInputElement;
 await userEvent.selectOptions(kind,'calendar');
 await userEvent.type(title,'Evento temporal');
 expect(kind.value).toBe('calendar');
 expect(title.value).toBe('Evento temporal');
 await userEvent.click(screen.getByRole('button',{name:'Restablecer plantilla'}));
 expect(kind.value).toBe('attendance_chart');
 expect(title.value).toBe('');
 expect(screen.getByRole('status').textContent).toContain('Plantilla original restaurada');
});

it('shows three purpose-specific empty states in the administrative dashboard',async()=>{
 vi.mocked(api).mockImplementation(async resource=>
  resource==='dashboard_preference'?{configuration:defaultConfig('admin'),lock_version:1}:{}
 );
 const {container}=render(<Dashboard role="admin" userId={1}
  summary={{attendance_chart:{},alerts:[]}} data={{calendar_events:[]}}/>);
 await waitFor(()=>expect(container.querySelectorAll('.sc-dashboard-empty')).toHaveLength(3));
 expect(container.querySelector('[data-empty-kind="attendance"]')).toBeTruthy();
 expect(container.querySelector('[data-empty-kind="alerts"]')).toBeTruthy();
 expect(container.querySelector('[data-empty-kind="calendar"]')).toBeTruthy();
 expect(screen.getByText('Aún no hay registros de asistencia')).toBeTruthy();
 expect(screen.getByText('Sin alertas por revisar')).toBeTruthy();
 expect(screen.getByText('No hay eventos próximos')).toBeTruthy();
 expect(container.querySelectorAll('.widget-body > .sc-dashboard-empty')).toHaveLength(3);
 expect(container.querySelectorAll('.sc-kpi-grid-item')).toHaveLength(4);
});

it('does not render an empty attendance chart when only zero-count status buckets exist',async()=>{
 vi.mocked(api).mockImplementation(async resource=>
  resource==='dashboard_preference'?{configuration:defaultConfig('admin'),lock_version:1}:{}
 );
 const {container}=render(<Dashboard role="admin" userId={1}
  summary={{attendance_chart:{present:0,absent:0},alerts:[]}} data={{calendar_events:[]}}/>);
 await waitFor(()=>expect(container.querySelectorAll('.sc-dashboard-empty')).toHaveLength(3));
 expect(container.querySelector('[data-empty-kind="attendance"]')).toBeTruthy();
 expect(container.querySelector('.widget-chart')).toBeNull();
});

it('preserves charts, student alerts and future events when real data is present',async()=>{
 vi.mocked(api).mockImplementation(async resource=>
  resource==='dashboard_preference'?{configuration:defaultConfig('admin'),lock_version:1}:{}
 );
 const nextMonth=new Date(Date.now()+30*86400000).toISOString();
 const {container}=render(<Dashboard role="admin" userId={1} summary={{
  attendance_chart:{present:12,absent:1},
  alerts:[{student_name:'María López',message:'3 inasistencias en 30 días'}]
 }} data={{calendar_events:[{id:8,title:'Reunión de seguimiento',starts_at:nextMonth,ends_at:nextMonth}]}}/>);
 await waitFor(()=>expect(container.querySelector('.widget-chart')).toBeTruthy());
 expect(container.querySelectorAll('.sc-dashboard-empty')).toHaveLength(0);
 expect(screen.getByText('María López')).toBeTruthy();
 expect(screen.getByText('Reunión de seguimiento')).toBeTruthy();
 expect(screen.getByText('Presente: 12 · Ausente: 1')).toBeTruthy();
});

it('shows the attendance empty state with a learner-specific explanation',async()=>{
 vi.mocked(api).mockImplementation(async resource=>
  resource==='dashboard_preference'?{configuration:defaultConfig('student'),lock_version:1}:{}
 );
 const {container}=render(<Dashboard role="student" userId={4}
  summary={{attendance_chart:{}}} data={{calendar_events:[]}}/>);
 await waitFor(()=>expect(container.querySelector('[data-empty-kind="attendance"]')).toBeTruthy());
 expect(screen.getByText('Tu resumen de asistencias aparecerá aquí cuando haya registros.')).toBeTruthy();
 expect(container.querySelector('[data-empty-kind="calendar"]')).toBeTruthy();
});

it('shows role-specific analytics and preserves them in the default reset',async()=>{
 vi.mocked(api).mockImplementation(async resource=>resource==='dashboard_preference'?
  {configuration:null,lock_version:null}:{attendance_rate:[{label:'Asistencias',value:12},{label:'Faltas',value:3}]});
 const {container}=render(<Dashboard role="guardian" userId={8} summary={{}} data={{}} selectedChildId="9"/>);
 await waitFor(()=>expect(container.querySelectorAll('[data-testid="analytics-chart"]').length).toBeGreaterThan(2));
 expect(screen.getAllByText('Entregas de tareas').length).toBeGreaterThan(0);
 expect(screen.queryByText('Matrícula por ciclo')).toBeNull();
 await personalize();
 await userEvent.click(screen.getByRole('button',{name:'Restablecer plantilla'}));
 expect(screen.getAllByText('Distribución de asistencia').length).toBeGreaterThan(0);
});

it('requests guardian statistics only for the selected child and chosen period',async()=>{
 vi.mocked(api).mockImplementation(async resource=>resource==='dashboard_preference'?
  {configuration:null,lock_version:null}:{});
 const {rerender}=render(<Dashboard role="guardian" userId={8} summary={{}} data={{}} selectedChildId="9"/>);
 await waitFor(()=>expect(vi.mocked(api).mock.calls.some(call=>String(call[0]).includes('student_id=9'))).toBe(true));
 rerender(<Dashboard role="guardian" userId={8} summary={{}} data={{}} selectedChildId="10"/>);
 await waitFor(()=>expect(vi.mocked(api).mock.calls.some(call=>String(call[0]).includes('student_id=10'))).toBe(true));
 await userEvent.selectOptions(screen.getByRole('combobox',{name:'Periodo de análisis'}),'30');
 await waitFor(()=>expect(vi.mocked(api).mock.calls.some(call=>String(call[0]).includes('student_id=10')&&String(call[0]).includes('from='))).toBe(true));
});

it('keeps the initial portal summary without an unnecessary dashboard refetch',async()=>{
 vi.mocked(api).mockImplementation(async resource=>resource==='dashboard_preference'?
  {configuration:defaultConfig('admin'),lock_version:1}:{});
 const {container}=render(<Dashboard role="admin" userId={1} summary={{students:42}} data={{}}/>);
 await waitFor(()=>expect(container.querySelector('.sc-kpi-number')).toBeTruthy());
 expect(container.querySelector('.sc-kpi-number')?.textContent).toBe('42');
 expect(vi.mocked(api).mock.calls.filter(call=>String(call[0]).startsWith('dashboard?'))).toHaveLength(0);
});

it('only offers school years returned by the authorized analytics scope',async()=>{
 vi.mocked(api).mockImplementation(async resource=>resource==='dashboard_preference'?
  {configuration:null,lock_version:null}:{});
 render(<Dashboard role="guardian" userId={12} summary={{available_years:[{id:7,name:'Ciclo autorizado'}]}}
  data={{academic_years:[{id:1,name:'Ciclo ajeno'},{id:7,name:'Ciclo autorizado'}]}}/>);
 await waitFor(()=>expect(screen.getByRole('combobox',{name:'Ciclo escolar'})).toBeTruthy());
 const year=screen.getByRole('combobox',{name:'Ciclo escolar'}) as HTMLSelectElement;
 expect(Array.from(year.options).map(x=>x.textContent)).toEqual(['Todos los ciclos autorizados','Ciclo autorizado']);
 await userEvent.selectOptions(year,'7');
 await waitFor(()=>expect(vi.mocked(api).mock.calls.some(call=>String(call[0]).includes('academic_year_id=7'))).toBe(true));
});
