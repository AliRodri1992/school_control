// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PortalChrome} from './PortalChrome';

vi.mock('../api',()=>({api:vi.fn(async(path:string)=>{
 if(path==='languages')return [{id:1,code:'es',name:'Español',native_name:'Español',status:'active',text_direction:'ltr'},
  {id:2,code:'en',name:'English',native_name:'English',status:'active',text_direction:'ltr'}];
 if(path==='preferences')return {locale:'es',theme:'light'};
 if(path.includes('/bundle'))return {translations:{}};
 if(path==='notifications')return {unread_count:0,items:[]};
 return {};
})}));
afterEach(()=>{cleanup();localStorage.removeItem('school-locale');localStorage.removeItem('school-sidebar-collapsed');document.body.style.overflow='';});
const user={id:15,name:'María González',email:'maria@example.test',role:'admin'};
const props={user,school:{name:'Primaria Hidalgo',logo_url:'/logo.svg',timezone:'America/Mexico_City'},
 page:'dashboard',mobile:false,onMobile:vi.fn(),can:()=>true,pendingAdmissions:0,
 onNavigate:vi.fn(),onSignOut:vi.fn(async()=>undefined)};
it('shows school branding and an icon-only language menu without search',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 expect(screen.getByRole('button',{name:'Ir al inicio de Primaria Hidalgo'})).toBeTruthy();
 expect(screen.queryByRole('searchbox',{name:'Buscar módulos'})).toBeNull();
 const language=screen.getByRole('button',{name:'Idioma'});
 expect(language.getAttribute('aria-expanded')).toBe('false');
 await userEvent.click(language);
 expect(language.getAttribute('aria-expanded')).toBe('true');
 expect(screen.getByRole('button',{name:'Español · ES'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'English · EN'})).toBeTruthy();
 expect(screen.queryByRole('searchbox',{name:/idioma/i})).toBeNull();
 expect(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})).toHaveLength(2);
});
it('makes logout and preferences accessible from the sidebar avatar and topbar avatar',async()=>{
 const signingOut=vi.fn(async()=>undefined);
 render(<PortalChrome {...props} onSignOut={signingOut}><div>Página</div></PortalChrome>);
 const account=screen.getAllByRole('button',{name:'Opciones de cuenta de María González'});
 await userEvent.click(account[0]);
 expect(screen.getByRole('button',{name:'Preferencias'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 await userEvent.click(account[1]);
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar sesión'}));
 expect(signingOut).toHaveBeenCalledOnce();
});

it('changes the navigation language immediately when English is selected',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 await userEvent.click(screen.getByRole('button',{name:'English · EN'}));
 expect(screen.getByRole('button',{name:'Language'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Overview'})).toBeTruthy();
 expect(localStorage.getItem('school-locale')).toBe('en');
});

it('opens the compact menu beside the selected group with readable module labels',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const group=screen.getByRole('button',{name:'Gestión escolar'});
 expect(group.getAttribute('aria-expanded')).toBe('false');
 await userEvent.click(group);
 expect(group.getAttribute('aria-expanded')).toBe('true');
 const flyout=screen.getByRole('region',{name:'Gestión escolar'});
 expect(flyout.querySelector('.sc-nav-label')?.textContent).toBe('Alumnos y expedientes');
 expect(flyout.querySelector('.sc-nav-mark svg')).toBeTruthy();
 await userEvent.keyboard('{Escape}');
 expect(screen.queryByRole('region',{name:'Gestión escolar'})).toBeNull();
});

it('always shows complete navigation when opening mobile after a collapsed desktop session',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 const onMobile=vi.fn();
 const {rerender}=render(<PortalChrome {...props} mobile onMobile={onMobile}><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Navegación principal'});
 expect(nav.querySelector('.sc-nav-label')?.textContent).toBe('Resumen');
 expect(screen.getByRole('button',{name:'Alumnos y expedientes'})).toBeTruthy();
 expect(document.querySelector('.sc-shell')?.classList.contains('sc-shell-collapsed')).toBe(false);
 expect(document.body.style.overflow).toBe('hidden');
 await userEvent.click(screen.getByRole('button',{name:'Cerrar menú lateral'}));
 expect(onMobile).toHaveBeenCalledWith(false);
 rerender(<PortalChrome {...props} mobile={false} onMobile={onMobile}><div>Página</div></PortalChrome>);
 expect(document.body.style.overflow).toBe('');
});

it('closes the mobile drawer using Escape and returns keyboard focus to the menu opener',async()=>{
 const onMobile=vi.fn();
 render(<PortalChrome {...props} mobile onMobile={onMobile}><div>Página</div></PortalChrome>);
 await userEvent.keyboard('{Escape}');
 expect(onMobile).toHaveBeenCalledWith(false);
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'Abrir menú'}));
});

it('highlights the parent section and expands ancestors for deeply nested routes',async()=>{
 render(<PortalChrome {...props} page="courses"><div>Página</div></PortalChrome>);
 const academic=screen.getByRole('button',{name:'Gestión académica'});
 expect(academic.closest('.sc-nav-section')?.classList.contains('has-active-item')).toBe(true);
 expect(academic.getAttribute('aria-expanded')).toBe('true');
 const classes=await screen.findByRole('button',{name:'Clases'});
 expect(classes.getAttribute('aria-current')).toBe('page');
});

it('displays profile and signout in the mobile sidebar avatar menu',async()=>{
 render(<PortalChrome {...props} mobile><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})[0]);
 expect(screen.getByRole('button',{name:'Mi perfil y seguridad'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
});
