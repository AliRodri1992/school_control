// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
vi.mock('../../Dashboard',()=>({default:()=> <div data-testid="dashboard-grid">Widgets</div>}));
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
 render(<PortalHome user={{id:2,name:'Familia',role:'guardian'}} summary={{}} data={{students:[{id:9,full_name:'Lucía García'}]}}
 can={()=>true} onNavigate={()=>{}} selectedChildId="9" onSelectChild={()=>{}}/>);
 expect(screen.getByRole('button',{name:/Lucía García/}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByTestId('dashboard-grid')).toBeTruthy();
});
