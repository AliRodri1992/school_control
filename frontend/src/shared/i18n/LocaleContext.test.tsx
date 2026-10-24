// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {LocaleProvider} from './LocaleContext';
vi.mock('../../Dashboard',()=>({default:()=> <div>Dashboard</div>}));
import PortalHome from '../../features/portal/PortalHome';
afterEach(cleanup);
it('renders published language strings on a teacher home',()=>{
 render(<LocaleProvider locale="en" translations={{'portal.teacher.headline':'Welcome, teacher!','portal.shortcuts':'Quick access'}}>
  <PortalHome user={{id:12,name:'Alex',role:'teacher'}} summary={{}} data={{}} can={()=>false} onNavigate={()=>{}}/>
 </LocaleProvider>);
 expect(screen.getByText('Welcome, teacher!')).toBeTruthy();
 expect(screen.getByText('Quick access')).toBeTruthy();
});
