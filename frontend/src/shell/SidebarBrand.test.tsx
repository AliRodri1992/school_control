// @vitest-environment jsdom
import {createRef} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SidebarBrand} from './SidebarBrand';

afterEach(cleanup);

it('renders system identity in an independent sidebar header',()=>{
 const {container}=render(<SidebarBrand schoolName="Primaria Hidalgo" locale="es"
   closeRef={createRef<HTMLButtonElement>()} onClose={()=>undefined}/>);
 const header=container.querySelector('header.sc-shell-brand');
 expect(header?.getAttribute('title')).toBe('Primaria Hidalgo');
 expect(header?.querySelector('.sc-sidebar-system-mark svg')).toBeTruthy();
 expect(header?.querySelector('strong')?.textContent).toBe('School Control');
 expect(header?.querySelector('small')?.textContent).toBe('Gestión escolar inteligente');
});

it('retains the mobile menu close control and forwards its button ref',async()=>{
 const close=vi.fn();
 const ref=createRef<HTMLButtonElement>();
 render(<SidebarBrand schoolName="Primaria Hidalgo" locale="es" closeRef={ref} onClose={close}/>);
 const button=screen.getByRole('button',{name:'Cerrar menú'});
 expect(ref.current).toBe(button);
 await userEvent.click(button);
 expect(close).toHaveBeenCalledOnce();
});

it('translates the brand subtitle for English without changing its structure',()=>{
 const {container}=render(<SidebarBrand schoolName="Primaria Hidalgo" locale="en"
   closeRef={createRef<HTMLButtonElement>()} onClose={()=>undefined}/>);
 expect(container.querySelector('.sc-sidebar-brand-text small')?.textContent).toBe('Smart school management');
 expect(container.querySelector('header.sc-shell-brand')).toBeTruthy();
});

it('labels compact branding without requiring a second logo',()=>{
 const {container}=render(<SidebarBrand schoolName="Primaria Hidalgo" locale="es" compact
   closeRef={createRef<HTMLButtonElement>()} onClose={()=>undefined}/>);
 const brand=container.querySelector('.sc-shell-brand');
 expect(brand?.getAttribute('data-compact')).toBe('true');
 expect(brand?.querySelectorAll('.sc-sidebar-system-mark')).toHaveLength(1);
});
