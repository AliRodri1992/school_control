// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('../../api',()=>({api:vi.fn(async()=>[])}));
import ImportWizard from './ImportWizard';
afterEach(cleanup);
it('offers account and academic imports through searchable choices',async()=>{
 render(<ImportWizard/>);
 await userEvent.click(screen.getByRole('combobox',{name:'Tipo de datos'}));
 expect(screen.getByRole('option',{name:'Padres y tutores'})).toBeTruthy();
 await userEvent.click(screen.getByRole('option',{name:'Calificaciones (borrador)'}));
 expect(screen.getByText(/no se publican automáticamente|se importan como borradores/i)).toBeTruthy();
});
