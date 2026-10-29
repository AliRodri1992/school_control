// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
vi.mock('../../Dashboard',()=>({default:({selectedChildId}:{selectedChildId?:string})=> <div data-testid="dashboard-grid" data-selected-child={selectedChildId}>Widgets</div>}));
import PortalHome from './PortalHome';
afterEach(cleanup);
it('shows a teacher-specific welcome and only authorized shortcuts',()=>{
 render(<PortalHome user={{id:1,name:'Maestra Carmen',role:'teacher'}} summary={{}} data={{}}
 can={value=>value==='attendances.index'} onNavigate={()=>{}}/>);
 expect(screen.getByText(/Cada clase cuenta/)).toBeTruthy();
 expect(screen.getByRole('button',{name:/Pasar asistencia/})).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Aula virtual/})).toBeNull();
});
it('lets guardians distinguish their own children',()=>{
 render(<PortalHome user={{id:2,name:'Familia',role:'guardian'}} summary={{}} data={{students:[{id:9,full_name:'Lucía García',enrollment_stage:'enrolled'}]}}
 can={()=>true} onNavigate={()=>{}} selectedChildId="9" onSelectChild={()=>{}}/>);
 expect(screen.getByRole('button',{name:/Lucía García/}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByTestId('dashboard-grid').getAttribute('data-selected-child')).toBe('9');
});

it('does not offer applicants as enrolled children in the family academic selector',()=>{
 render(<PortalHome user={{id:2,name:'Familia',role:'guardian'}} summary={{}} data={{students:[{id:11,full_name:'María Aspirante',enrollment_stage:'applicant'}]}}
 can={()=>true} onNavigate={()=>{}} selectedChildId="" onSelectChild={()=>{}}/>);
 expect(screen.queryByRole('button',{name:/María Aspirante/})).toBeNull();
 expect(screen.getByRole('button',{name:/Mis aspirantes y solicitudes/})).toBeTruthy();
});
