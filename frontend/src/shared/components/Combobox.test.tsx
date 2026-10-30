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

it('renders options above clipped cards instead of inside the clipped container',async()=>{
 const changed=vi.fn();
 render(<div data-testid="clipped" style={{overflow:'hidden',height:65}}>
  <Combobox label="Tipo de contacto" value="" onChange={changed} searchable={false}
   options={[{value:'family',label:'Familiar'},{value:'emergency',label:'Emergencia'}]}/>
 </div>);
 await userEvent.click(screen.getByRole('combobox',{name:'Tipo de contacto'}));
 expect(screen.getByRole('listbox',{name:'Tipo de contacto'})).toBeTruthy();
 expect(screen.getByTestId('clipped').querySelector('.sc-combobox-panel')).toBeNull();
 expect(document.body.querySelector('.sc-combobox-panel-portal')).toBeTruthy();
 expect(screen.queryByRole('searchbox',{name:'Buscar en Tipo de contacto'})).toBeNull();
 await userEvent.click(screen.getByRole('option',{name:'Emergencia'}));
 expect(changed).toHaveBeenCalledWith('emergency');
});

it('opens above the trigger near the viewport bottom',async()=>{
 const original=HTMLElement.prototype.getBoundingClientRect;
 HTMLElement.prototype.getBoundingClientRect=function(){
  if(this.getAttribute('role')==='combobox')return {x:20,y:690,left:20,top:690,right:240,bottom:735,width:220,height:45,toJSON:()=>({})} as DOMRect;
  return original.call(this);
 };
 try{
  render(<Combobox label="Estado" value="" onChange={vi.fn()} searchable={false}
   options={[{value:'active',label:'Activo'}]}/>);
  await userEvent.click(screen.getByRole('combobox',{name:'Estado'}));
  const panel=document.body.querySelector('.sc-combobox-panel-portal') as HTMLElement;
  expect(panel.style.top).toBe('auto');
  expect(panel.style.bottom).not.toBe('auto');
 }finally{HTMLElement.prototype.getBoundingClientRect=original;}
});

it('closes when clicking outside a portaled menu',async()=>{
 render(<><Combobox label="Grado" value="" onChange={vi.fn()} options={[{value:'1',label:'Primero'}]}/><button type="button">Exterior</button></>);
 await userEvent.click(screen.getByRole('combobox',{name:'Grado'}));
 await userEvent.click(screen.getByRole('button',{name:'Exterior'}));
 expect(screen.getByRole('combobox',{name:'Grado'}).getAttribute('aria-expanded')).toBe('false');
 expect(screen.queryByRole('listbox',{name:'Grado'})).toBeNull();
});
