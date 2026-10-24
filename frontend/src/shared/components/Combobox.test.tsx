// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Combobox from './Combobox';

afterEach(cleanup);

it('moves through filtered choices with arrow keys and confirms with Enter',async()=>{
 const changed=vi.fn();
 render(<Combobox label="Grupo" value="" onChange={changed} options={[
  {value:'1',label:'Primero A'}, {value:'2',label:'Segundo B'}
 ]}/>);
 await userEvent.click(screen.getByRole('combobox',{name:'Grupo'}));
 const search=screen.getByRole('searchbox',{name:'Buscar en Grupo'});
 await userEvent.type(search,'{ArrowDown}{Enter}');
 expect(changed).toHaveBeenCalledWith('2');
});

it('supports Escape and keeps the validation description connected to the control',async()=>{
 const changed=vi.fn();
 render(<Combobox label="Materia" value="" onChange={changed} invalid describedBy="error-materia"
 options={[{value:'m',label:'Matemáticas'}]}/>);
 const trigger=screen.getByRole('combobox',{name:'Materia'});
 expect(trigger.getAttribute('aria-describedby')).toBe('error-materia');
 await userEvent.click(trigger);
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en Materia'}),'{Escape}');
 expect(trigger.getAttribute('aria-expanded')).toBe('false');
 expect(changed).not.toHaveBeenCalled();
});
