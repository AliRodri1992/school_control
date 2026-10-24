// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentRowActions from './StudentRowActions';

afterEach(cleanup);

it('renders distinct SVG icon actions with accessible labels and tooltips',async()=>{
 const onView=vi.fn(),onReport=vi.fn(),onEdit=vi.fn();
 render(<StudentRowActions student={{id:1,full_name:'Alex Ejemplo'}} canView canReport canEdit
  onView={onView} onReport={onReport} onEdit={onEdit}/>);
 const actions=[
  {name:'Ver expediente de Alex Ejemplo',title:'Ver expediente',click:onView},
  {name:'Ver boleta e historial de Alex Ejemplo',title:'Boleta e historial',click:onReport},
  {name:'Editar alumno Alex Ejemplo',title:'Editar alumno',click:onEdit}
 ];
 for(const action of actions){
  const button=screen.getByRole('button',{name:action.name});
  expect(button.getAttribute('title')).toBe(action.title);
  expect(button.querySelector('svg')).toBeTruthy();
  expect(button.textContent).toBe('');
  await userEvent.click(button);
  expect(action.click).toHaveBeenCalledOnce();
 }
});

it('does not expose unauthorized student actions',()=>{
 render(<StudentRowActions student={{first_name:'Alex',last_name:'Ejemplo'}} canView canReport={false} canEdit={false}
  onView={vi.fn()} onReport={vi.fn()} onEdit={vi.fn()}/>);
 expect(screen.getAllByRole('button')).toHaveLength(1);
 expect(screen.queryByRole('button',{name:/boleta|editar/i})).toBeNull();
});
