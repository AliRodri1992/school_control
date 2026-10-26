// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopbarCommands from './TopbarCommands';
afterEach(cleanup);
it('exposes its quick-search combobox and result list with linked accessible controls',async()=>{
 const navigate=vi.fn();
 render(<TopbarCommands groups={[{title:'Inicio',items:[{key:'dashboard',title:'Dashboard'}]}]}
  records={{}} can={()=>true} locale="es" translate={(_key,text)=>text} onNavigate={navigate}
  onStudent={vi.fn()} onOpen={vi.fn()}/>);
 const open=screen.getByRole('button',{name:'Buscar en School Control'});
 await userEvent.click(open);
 const input=screen.getByRole('combobox',{name:'Buscar en School Control'});
 expect(input.getAttribute('aria-controls')).toBe('sc-global-search-results');
 expect(open.getAttribute('aria-controls')).toBe('sc-global-search-results');
 await userEvent.type(input,'Dashboard');
 await userEvent.click(screen.getByRole('option',{name:/Dashboard/}));
 expect(navigate).toHaveBeenCalledWith('dashboard',undefined);
});
