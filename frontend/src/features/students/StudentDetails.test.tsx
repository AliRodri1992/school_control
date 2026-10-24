// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('../../api',()=>({api:vi.fn(async()=>[])}));
import StudentDetails from './StudentDetails';
afterEach(cleanup);
it('renders a complete student record page instead of a dialog',async()=>{
 const close=vi.fn();
 render(<StudentDetails student={{id:42,full_name:'Ana Pérez',first_name:'Ana',curp:'PERA200101MDFRNN01',birth_date:'2020-01-01'}}
   onClose={close} canEdit={false} canWriteNotes={false}/>);
 expect(screen.getByRole('heading',{name:'Ana Pérez'})).toBeTruthy();
 expect(screen.queryByRole('dialog')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Contactos'}));
 expect(screen.getByRole('heading',{name:'Contactos'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Volver a alumnos'}));
 expect(close).toHaveBeenCalledOnce();
});
