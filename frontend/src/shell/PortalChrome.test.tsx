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
it('shows school branding, search and the language menu',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 expect(screen.getByRole('button',{name:'Ir al inicio de Primaria Hidalgo'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Buscar en School Control'})).toBeTruthy();
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

it('keeps the language icon, marks active language and closes sibling menus',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const language=screen.getByRole('button',{name:'Idioma'});
 expect(language.querySelector('svg')).toBeTruthy();
 await userEvent.click(language);
 expect(screen.getByRole('group',{name:'Idiomas disponibles'})).toBeTruthy();
 expect(screen.getByRole('button',{name:/Español · ES/}).querySelector('svg')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Notificaciones: 0 sin leer'}));
 expect(screen.queryByRole('group',{name:'Idiomas disponibles'})).toBeNull();
 expect(screen.getByRole('region',{name:'Notificaciones'})).toBeTruthy();
});
it('dismisses notification popover on outside click and Escape, restoring focus',async()=>{
 render(<PortalChrome {...props}><button type="button">Outside</button></PortalChrome>);
 const bell=screen.getByRole('button',{name:'Notificaciones: 0 sin leer'});
 await userEvent.click(bell);await userEvent.click(screen.getByRole('button',{name:'Outside'}));
 expect(screen.queryByRole('region',{name:'Notificaciones'})).toBeNull();
 await userEvent.click(bell);await userEvent.keyboard('{Escape}');
 expect(screen.queryByRole('region',{name:'Notificaciones'})).toBeNull();
 expect(document.activeElement).toBe(bell);
});
it('translates breadcrumbs and notification labels without restoring the duplicate heading',async()=>{
 const {container}=render(<PortalChrome {...props} page="grades"><div>Página</div></PortalChrome>);
 expect(container.querySelector('.sc-topbar-context')).toBeNull();
 expect(screen.getByRole('navigation',{name:'Ruta de navegación'}).textContent).toContain('Calificaciones');
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 await userEvent.click(screen.getByRole('button',{name:'English · EN'}));
 expect(container.querySelector('.sc-topbar-context')).toBeNull();
 expect(screen.getByRole('navigation',{name:'Breadcrumbs'}).textContent).toContain('Grades');
 expect(screen.getByRole('button',{name:'Notifications: 0 unread'})).toBeTruthy();
});
it('keeps the guardian child selector in the header',()=>{
 render(<PortalChrome {...props} user={{...user,role:'guardian'}} childrenList={[{id:3,full_name:'Alex Ejemplo'}]}>
 <div>Página</div></PortalChrome>);
 expect(screen.getByRole('combobox',{name:'Seleccionar hijo'})).toBeTruthy();
});

it('constrains a language dropdown to the visible viewport',async()=>{
 const width=vi.spyOn(window,'innerWidth','get').mockReturnValue(320);
 try{
  render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
  await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
  const popover=screen.getByRole('group',{name:'Idiomas disponibles'}) as HTMLElement;
  expect(Number.parseFloat(popover.style.left)).toBeGreaterThanOrEqual(12);
  expect(Number.parseFloat(popover.style.width)).toBeLessThanOrEqual(296);
 }finally{width.mockRestore();}
});

it('switches between account, language and notifications without stacking menus',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})[1]);
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 expect(screen.queryByRole('button',{name:'Cerrar sesión'})).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Notificaciones: 0 sin leer'}));
 expect(screen.queryByRole('group',{name:'Idiomas disponibles'})).toBeNull();
});

it('removes the redundant portal/page heading while preserving breadcrumbs',()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const header=container.querySelector('.sc-topbar');
 expect(header?.querySelector('.sc-topbar-context')).toBeNull();
 expect(header?.querySelector('.sc-collapse-toggle')).toBeTruthy();
 const trail=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(trail.textContent).toContain('Administración');
 expect(trail.textContent).toContain('Resumen');
});

it('keeps the sidebar collapse button as the first desktop control',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const header=container.querySelector('.sc-topbar');
 const collapse=screen.getByRole('button',{name:'Colapsar barra lateral'});
 expect(header?.querySelector('.sc-collapse-toggle')).toBe(collapse);
 expect(collapse.previousElementSibling?.getAttribute('aria-label')).toBe('Abrir menú');
 await userEvent.click(collapse);
 expect(screen.getByRole('button',{name:'Expandir barra lateral'})).toBeTruthy();
 expect(header?.querySelector('.sc-topbar-context')).toBeNull();
});

it('avoids repeating the current page on the guardian mobile header',()=>{
 const {container}=render(<PortalChrome {...props} user={{...user,role:'guardian'}} mobile
   childrenList={[{id:3,full_name:'Alex Ejemplo'}]}><div>Página</div></PortalChrome>);
 expect(container.querySelector('.sc-topbar-context')).toBeNull();
 expect(screen.getByRole('combobox',{name:'Seleccionar hijo'})).toBeTruthy();
 expect(screen.getByRole('navigation',{name:'Ruta de navegación'})).toBeTruthy();
});

it('localizes account, home and child-picker accessibility labels when switching languages',async()=>{
 const {rerender}=render(<PortalChrome {...props} user={{...user,role:'guardian'}}
   childrenList={[{id:3,full_name:'Alex Ejemplo'}]}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 await userEvent.click(screen.getByRole('button',{name:'English · EN'}));
 expect(screen.getByRole('button',{name:'Go to home of Primaria Hidalgo'})).toBeTruthy();
 expect(screen.getAllByRole('button',{name:'Account options for María González'})).toHaveLength(2);
 expect(screen.getByRole('combobox',{name:'Select child'})).toBeTruthy();
 rerender(<PortalChrome {...props} user={{...user,role:'guardian'}} mobile
   childrenList={[{id:3,full_name:'Alex Ejemplo'}]}><div>Página</div></PortalChrome>);
 expect(screen.getByRole('combobox',{name:'Select child'})).toBeTruthy();
});

it('shows the complete hierarchy with a compact home shortcut',async()=>{
 const navigate=vi.fn();
 render(<PortalChrome {...props} page="courses" onNavigate={navigate}><div>Página</div></PortalChrome>);
 const crumbs=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(crumbs.textContent).toContain('Administración');
 expect(crumbs.textContent).toContain('Ciclos escolares');
 expect(crumbs.textContent).toContain('Grupos');
 expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe('Clases');
 await userEvent.click(screen.getByRole('button',{name:'Ir al inicio'}));
 expect(navigate).toHaveBeenCalledWith('dashboard');
});
it('provides mobile access to hidden breadcrumb ancestors',async()=>{
 const navigate=vi.fn();
 render(<PortalChrome {...props} page="courses" onNavigate={navigate}><div>Página</div></PortalChrome>);
 const more=screen.getByRole('button',{name:'Mostrar páginas anteriores'});
 expect(more.getAttribute('aria-expanded')).toBe('false');
 await userEvent.click(more);
 expect(more.getAttribute('aria-expanded')).toBe('true');
 const menu=screen.getByRole('group',{name:'Páginas anteriores'});
 const groups=Array.from(menu.querySelectorAll('button'));
 expect(groups.map(item=>item.textContent)).toEqual(['Ciclos escolares','Grupos']);
 await userEvent.click(groups[1]);
 expect(navigate).toHaveBeenCalledWith('groups');
 expect(screen.queryByRole('group',{name:'Páginas anteriores'})).toBeNull();
});
it('identifies standalone account pages in the breadcrumb',()=>{
 render(<PortalChrome {...props} page="preferences"><div>Página</div></PortalChrome>);
 const crumbs=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe('Preferencias');
});

it('searches authorized school modules',async()=>{
 const searchNavigate=vi.fn();
 render(<PortalChrome {...props} onSearchNavigate={searchNavigate}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Buscar en School Control'}));
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en School Control'}),'Calificaciones');
 await userEvent.click(screen.getByRole('option',{name:/Calificaciones/}));
 expect(searchNavigate).toHaveBeenCalledWith('grades',undefined);
});
it('shows only authorized quick actions and dispatches the requested module',async()=>{
 const quick=vi.fn();
 render(<PortalChrome {...props} onQuickAction={quick} can={p=>['dashboard.show','students.index','students.create'].includes(p)}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Nuevo registro'}));
 expect(screen.getByRole('button',{name:'Agregar alumno'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Crear grupo'})).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Agregar alumno'}));
 expect(quick).toHaveBeenCalledWith(expect.objectContaining({page:'students',mode:'create'}));
});
it('offers Ctrl+K keyboard navigation for search',async()=>{
 const navigate=vi.fn();
 render(<PortalChrome {...props} onSearchNavigate={navigate}><div>Página</div></PortalChrome>);
 await userEvent.keyboard('{Control>}k{/Control}');
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en School Control'}),'Alumnos');
 await userEvent.keyboard('{Enter}');
 expect(navigate).toHaveBeenCalledWith('students',undefined);
});

it('does not reveal student records to a role without record access',async()=>{
 const records={students:[{id:4,full_name:'Registro Confidencial'}]};
 render(<PortalChrome {...props} searchCollections={records} can={p=>p==='dashboard.show'||p==='students.index'}>
  <div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Buscar en School Control'}));
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en School Control'}),'Registro Confidencial');
 expect(screen.queryByRole('option',{name:/Registro Confidencial/})).toBeNull();
});

it('opens an authorized student from global search',async()=>{
 const student={id:4,full_name:'Alex Ejemplo'};
 const selected=vi.fn();
 render(<PortalChrome {...props} onSearchStudent={selected} searchCollections={{students:[student]}}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Buscar en School Control'}));
 await userEvent.type(screen.getByRole('searchbox',{name:'Buscar en School Control'}),'Alex Ejemplo');
 await userEvent.click(screen.getByRole('option',{name:/Alex Ejemplo/}));
 expect(selected).toHaveBeenCalledWith(student);
});

it('closes the quick action dropdown using Escape',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const trigger=screen.getByRole('button',{name:'Nuevo registro'});
 await userEvent.click(trigger);
 expect(trigger.getAttribute('aria-expanded')).toBe('true');
 await userEvent.keyboard('{Escape}');
 expect(trigger.getAttribute('aria-expanded')).toBe('false');
 expect(document.activeElement).toBe(trigger);
});
