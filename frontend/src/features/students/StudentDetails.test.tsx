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
 await userEvent.click(screen.getByRole('button',{name:'Volver al directorio'}));
 expect(close).toHaveBeenCalledOnce();
});

it('shows an actionable empty state and meaningful contact cards',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockImplementation(async path=>path.endsWith('/contacts')?[]:[]);
 render(<StudentDetails student={{id:44,full_name:'Luis García'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Direcciones'}));
 expect(await screen.findByRole('heading',{name:'Aún no hay direcciones registradas'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Agregar dirección'}));
 expect(screen.getByText('Calle y número')).toBeTruthy();
});

it('offers a dedicated new-note form and hides searching on small option lists',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockResolvedValue([]);
 render(<StudentDetails student={{id:55,full_name:'Ana Pérez'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Notas'}));
 await userEvent.click(await screen.findByRole('button',{name:'Agregar nota'}));
 expect(screen.getByRole('heading',{name:'Agregar nota'})).toBeTruthy();
 await userEvent.click(screen.getByRole('combobox',{name:'Visibilidad'}));
 expect(screen.queryByRole('searchbox',{name:'Buscar en Visibilidad'})).toBeNull();
});
