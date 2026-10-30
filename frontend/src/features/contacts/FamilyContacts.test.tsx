// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FamilyContacts,{filterFamilyContacts} from './FamilyContacts';
afterEach(cleanup);
const contacts=[{id:1,student_id:2,student_name:'Ana Gómez',name:'María López',relationship:'Madre',phone:'5512345678',emergency:true,pickup_authorized:false},{id:2,student_id:2,student_name:'Ana Gómez',name:'Pedro López',relationship:'Tío',phone:'5587654321',emergency:false,pickup_authorized:true}];
const base={contacts,students:[{id:2,full_name:'Ana Gómez'}],canCreate:true,canEdit:true,canDelete:true,busy:false,onRetry:vi.fn(),onCreate:vi.fn(),onEdit:vi.fn(),onDelete:vi.fn()};
it('filters by emergency role, authorized pickup and student without truthy string mistakes',()=>{
 expect(filterFamilyContacts(contacts,'','emergency','')).toHaveLength(1);
 expect(filterFamilyContacts(contacts,'Pedro','pickup','2')).toHaveLength(1);
 expect(filterFamilyContacts(contacts,'','pickup','3')).toHaveLength(0);
 expect(filterFamilyContacts([{...contacts[0],emergency:'false'}],'','emergency','')).toHaveLength(0);
});
it('shows professional contact cards and functional actions',async()=>{
 const onEdit=vi.fn(),onDelete=vi.fn();
 render(<FamilyContacts {...base} onEdit={onEdit} onDelete={onDelete}/>);
 expect(screen.getByText('María López')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Editar contacto María López'}));
 expect(onEdit).toHaveBeenCalledWith(contacts[0]);
 await userEvent.click(screen.getByRole('button',{name:'Eliminar contacto Pedro López'}));
 expect(onDelete).toHaveBeenCalledWith(contacts[1]);
 await userEvent.click(screen.getByRole('button',{name:/Emergencia/}));
 expect(screen.queryByText('Pedro López')).toBeNull();
});

it('renders student filter as branded combobox with search only for larger lists',async()=>{
 const students=Array.from({length:10},(_,i)=>({id:i+1,full_name:'Alumno '+(i+1)}));
 render(<FamilyContacts {...base} students={students}/>);
 await userEvent.click(screen.getByRole('combobox',{name:'Filtrar contactos por alumno'}));
 expect(screen.getByRole('searchbox',{name:'Buscar en Filtrar contactos por alumno'})).toBeTruthy();
});
