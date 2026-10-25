// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PortalFooter} from './PortalFooter';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('renders a compact institutional footer with real local destinations',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true})));
 const navigate=vi.fn();
 const {container}=render(<PortalFooter locale="es" onNavigate={navigate}/>);
 expect(container.querySelectorAll('.sc-portal-footer')).toHaveLength(1);
 expect(screen.getByText(/School Control\. Todos los derechos reservados/)).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Soporte'}));
 await userEvent.click(screen.getByRole('button',{name:'Aviso de privacidad'}));
 await userEvent.click(screen.getByRole('button',{name:'Términos de uso'}));
 expect(navigate.mock.calls.map(c=>c[0])).toEqual(['help','privacy','terms']);
 expect(screen.getByText('v1.0.0')).toBeTruthy();
 await waitFor(()=>expect(screen.getByRole('status',{name:'Servidor disponible'})).toBeTruthy());
});
it('does not claim the system is operational when health is unavailable',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:false})));
 render(<PortalFooter locale="en" onNavigate={vi.fn()}/>);
 await waitFor(()=>expect(screen.getByRole('status',{name:'Status unavailable'})).toBeTruthy());
 expect(screen.queryByRole('status',{name:'Server available'})).toBeNull();
 expect(screen.getByRole('button',{name:'Privacy notice'})).toBeTruthy();
});
it('handles a health fetch error without affecting navigation',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>{throw Error('offline');}));
 render(<PortalFooter locale="es" onNavigate={vi.fn()}/>);
 await waitFor(()=>expect(screen.getByRole('status',{name:'Estado no disponible'})).toBeTruthy());
 expect(screen.getByRole('button',{name:'Soporte'})).toBeTruthy();
});
it('aborts its health request when removed',()=>{
 const abort=vi.fn(),controller=globalThis.AbortController;
 class FakeController extends controller{
  abort(){abort();super.abort();}
 }
 vi.stubGlobal('AbortController',FakeController);
 vi.stubGlobal('fetch',vi.fn(()=>new Promise(()=>undefined)));
 const {unmount}=render(<PortalFooter locale="es" onNavigate={vi.fn()}/>);
 unmount();
 expect(abort).toHaveBeenCalledOnce();
});
