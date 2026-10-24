// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableAction from './TableAction';

afterEach(cleanup);

it('renders an SVG icon and shows a short tooltip on hover and focus',async()=>{
 const onClick=vi.fn();
 render(<TableAction kind="edit" onClick={onClick} ariaLabel="Editar alumno Alex Ejemplo"/>);
 const button=screen.getByRole('button',{name:'Editar alumno Alex Ejemplo'});
 expect(button.querySelector('svg')).toBeTruthy();
 expect(button.textContent).toBe('');
 expect(button.getAttribute('title')).toBe('Editar');
 await userEvent.hover(button);
 expect(screen.getByRole('tooltip')).toHaveProperty('textContent','Editar');
 await userEvent.unhover(button);
 expect(screen.queryByRole('tooltip')).toBeNull();
 await userEvent.click(button);
 expect(onClick).toHaveBeenCalledOnce();
});

it('keeps a download link and destructive controls distinct',()=>{
 render(<><TableAction kind="download" href="/api/documents/3/download"/>
  <TableAction kind="delete" ariaLabel="Eliminar contacto" disabled/></>);
 expect(screen.getByRole('link',{name:'Descargar'}).getAttribute('href')).toBe('/api/documents/3/download');
 expect(screen.getByRole('button',{name:'Eliminar contacto'})).toHaveProperty('disabled',true);
});

it('shows the same tooltip when reached by keyboard',async()=>{
 render(<TableAction kind="edit"/>);
 await userEvent.tab();
 expect(screen.getByRole('button',{name:'Editar'})).toHaveProperty('type','button');
 expect(await screen.findByRole('tooltip')).toHaveProperty('textContent','Editar');
});

it('keeps the tooltip visible while hovering its SVG in a scrollable table',async()=>{
 const {container,unmount}=render(<div className="table-scroll"><table><tbody><tr><td>
   <TableAction kind="view" tooltip="Expediente"/>
 </td></tr></tbody></table></div>);
 const action=screen.getByRole('button',{name:'Expediente'});
 const svg=action.querySelector('svg')!;
 await userEvent.hover(svg);
 expect(screen.getByRole('tooltip').textContent).toBe('Expediente');
 expect(screen.getByRole('tooltip').parentElement).toBe(document.body);
 expect(action.getAttribute('title')).toBe('Expediente');
 expect(container.contains(screen.getByRole('tooltip'))).toBe(false);
 window.dispatchEvent(new Event('scroll'));
 expect(screen.getByRole('tooltip').textContent).toBe('Expediente');
 unmount();
 expect(screen.queryByRole('tooltip')).toBeNull();
});
