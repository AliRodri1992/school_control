// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import * as React from 'react';
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
 expect(screen.getByRole('button',{name:'Home'})).toBeTruthy();
 expect(localStorage.getItem('school-locale')).toBe('en');
});

it('opens the compact menu beside the selected group with readable module labels',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const group=screen.getByRole('button',{name:'Alumnos'});
 expect(group.getAttribute('aria-expanded')).toBe('false');
 await userEvent.click(group);
 expect(group.getAttribute('aria-expanded')).toBe('true');
 const flyout=screen.getByRole('region',{name:'Alumnos'});
 expect(flyout.querySelector('.sc-nav-label')?.textContent).toBe('Alumnos y expedientes');
 expect(flyout.querySelector('.sc-nav-mark svg')).toBeTruthy();
 await userEvent.keyboard('{Escape}');
 expect(screen.queryByRole('region',{name:'Alumnos'})).toBeNull();
});

it('always shows complete navigation when opening mobile after a collapsed desktop session',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 const onMobile=vi.fn();
 const {rerender}=render(<PortalChrome {...props} mobile onMobile={onMobile}><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Navegación principal'});
 expect(nav.querySelector('.sc-nav-label')?.textContent).toBe('Alumnos y expedientes');
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
 const academic=screen.getByRole('button',{name:'Académico'});
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
 expect(trail.textContent).toContain('Inicio');
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
 expect(crumbs.textContent).toContain('Inicio');
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
it('does not display the removed New button',()=>{render(<PortalChrome {...props}><div>Página</div></PortalChrome>);expect(screen.queryByRole('button',{name:'Nuevo registro'})).toBeNull();});
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

it('preserves search while New is removed',async()=>{render(<PortalChrome {...props}><div>Página</div></PortalChrome>);await userEvent.click(screen.getByRole('button',{name:'Buscar en School Control'}));expect(screen.getByRole('searchbox',{name:'Buscar en School Control'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Nuevo registro'})).toBeNull();});

it('renders the authorized school profile image instead of fallback initials when supplied',()=>{
 const {container}=render(<PortalChrome {...props} user={{...user,avatar_url:'/school-avatar.png'}}><div>Página</div></PortalChrome>);
 const img=container.querySelector<HTMLImageElement>('.sc-topbar-avatar img');
 expect(img?.getAttribute('src')).toBe('/school-avatar.png');
 expect(img?.getAttribute('alt')).toBe('');
});

it('closes the search panel when clicking outside and retains a visible trigger',async()=>{
 render(<PortalChrome {...props}><button type="button">Outside search</button></PortalChrome>);
 const search=screen.getByRole('button',{name:'Buscar en School Control'});
 await userEvent.click(search);
 expect(search.getAttribute('aria-expanded')).toBe('true');
 await userEvent.click(screen.getByRole('button',{name:'Outside search'}));
 expect(search.getAttribute('aria-expanded')).toBe('false');
});

it('shows category navigation like the design and omits the old workspace chip',()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const nav=container.querySelector('.sc-sidebar-nav')!;
 expect(screen.getByRole('button',{name:'Inicio'}).getAttribute('aria-current')).toBe('page');
 expect(Array.from(nav.querySelectorAll('.sc-nav-section-title')).map(x=>x.getAttribute('aria-label'))).toEqual(['Inicio','Alumnos','Matrícula','Académico','Asistencia','Comunicación','Documentos','Reportes','Configuración']);
 expect(container.querySelector('.sc-workspace')).toBeNull();
 expect(container.querySelector('.sc-sidebar-brand-text strong')?.textContent).toBe('School Control');
});
it('places the portrait before the user name and role at the far right of the navbar',()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const account=container.querySelector('.sc-topbar .sc-account-button')!;
 expect(account.children[0].classList.contains('sc-topbar-avatar')).toBe(true);
 expect(account.children[1].classList.contains('sc-account-identity')).toBe(true);
 expect(account.children[1].querySelector('strong')?.textContent).toBe('María González');
 expect(account.children[1].querySelector('small')?.textContent).toBe('Administración');
 expect(account.querySelector('img')?.getAttribute('src')).toBe('/images/default-account-avatar.svg');
});

it('keeps institution identity available without repeating it in the new brand heading',()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const brand=container.querySelector('.sc-sidebar .sc-shell-brand');
 expect(brand?.getAttribute('title')).toBe('Primaria Hidalgo');
 expect(brand?.querySelector('strong')?.textContent).toBe('School Control');
 expect(brand?.querySelector('small')?.textContent).toBe('Gestión escolar inteligente');
});

it('keeps the portrait first and profile details readable when an actual photo is available',()=>{
 const {container}=render(<PortalChrome {...props} user={{...user,avatar_url:'/real-avatar.jpg'}}><div>Página</div></PortalChrome>);
 const button=container.querySelector('.sc-topbar .sc-account-button')!;
 expect(button.children[0].querySelector('img')?.getAttribute('src')).toBe('/real-avatar.jpg');
 expect(button.children[1].querySelector('strong')?.textContent).toBe('María González');
 expect(button.children[1].querySelector('small')?.textContent).toBe('Administración');
 expect(screen.queryByRole('button',{name:'Nuevo registro'})).toBeNull();
});

it('shows design one breadcrumbs with compact icons and a blue student-profile label',()=>{
 const {container}=render(<PortalChrome {...props} page="student_details"><div>Página</div></PortalChrome>);
 const crumbs=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(container.querySelector('.sc-breadcrumb-design-one')).toBeTruthy();
 expect(crumbs.querySelector('.sc-crumb-home-label')?.textContent).toBe('Inicio');
 expect(crumbs.querySelectorAll('.sc-crumb-link .sc-crumb-icon')).toHaveLength(2);
 expect(crumbs.textContent).toContain('Alumnos');
 expect(crumbs.textContent).toContain('Expedientes');
 expect(crumbs.querySelector('.sc-crumb-current-label')?.textContent).toBe('Ficha del alumno');
 expect(crumbs.querySelector('.sc-crumb-current-label')?.getAttribute('aria-current')).toBe('page');
});
it('navigates from the virtual records breadcrumb to its existing students route',async()=>{
 const navigate=vi.fn();
 render(<PortalChrome {...props} page="student_details" onNavigate={navigate}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Expedientes'}));
 expect(navigate).toHaveBeenCalledWith('students');
});
it('translates the breadcrumb layout without losing navigation',async()=>{
 render(<PortalChrome {...props} page="student_details"><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 await userEvent.click(screen.getByRole('button',{name:'English · EN'}));
 const crumbs=screen.getByRole('navigation',{name:'Breadcrumbs'});
 expect(crumbs.textContent).toContain('Home');
 expect(crumbs.textContent).toContain('Records');
 expect(crumbs.querySelector('[aria-current=page]')?.textContent).toBe('Student profile');
});
it('retains the accessible mobile ancestor menu for the design-one student record',async()=>{
 render(<PortalChrome {...props} page="student_details"><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Mostrar páginas anteriores'}));
 const menu=screen.getByRole('group',{name:'Páginas anteriores'});
 expect(Array.from(menu.querySelectorAll('button')).map(x=>x.textContent)).toEqual(['Alumnos','Expedientes']);
});

it('retains normal active route links alongside the illustrated breadcrumb icons',async()=>{
 const navigate=vi.fn();
 const {container}=render(<PortalChrome {...props} page="courses" onNavigate={navigate}><div>Página</div></PortalChrome>);
 const links=container.querySelectorAll<HTMLButtonElement>('.sc-breadcrumb-design-one .sc-crumb-link');
 expect(links).toHaveLength(2);
 expect(links[0].querySelector('.sc-crumb-icon svg')).toBeTruthy();
 expect(links[1].querySelector('.sc-crumb-icon svg')).toBeTruthy();
 await userEvent.click(links[1]);
 expect(navigate).toHaveBeenCalledWith('groups');
});
it('shows the original virtual student-record label in the guardian breadcrumb',()=>{
 render(<PortalChrome {...props} user={{...user,role:'guardian'}} page="student_details"><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(nav.textContent).toContain('Mis hijos');
 expect(nav.textContent).toContain('Expedientes');
 expect(nav.querySelector('[aria-current=page]')?.textContent).toBe('Ficha del alumno');
});

it('collapses intermediate breadcrumb steps instead of creating a horizontal scrollbar',async()=>{
 const {container}=render(<PortalChrome {...props} page="courses"><div>Página</div></PortalChrome>);
 const crumbs=container.querySelector<HTMLElement>('.sc-breadcrumb-design-one .sc-crumbs')!;
 Object.defineProperty(crumbs,'scrollWidth',{configurable:true,get:()=>710});
 Object.defineProperty(crumbs,'clientWidth',{configurable:true,get:()=>370});
 await import('@testing-library/react').then(({act})=>act(()=>window.dispatchEvent(new Event('resize'))));
 expect(crumbs.classList.contains('sc-crumbs-condensed')).toBe(true);
 expect(screen.getByRole('button',{name:'Mostrar páginas anteriores'})).toBeTruthy();
 expect(crumbs.querySelectorAll('.sc-crumb-ancestor')).toHaveLength(2);
 expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe('Clases');
});

it('restores all breadcrumb ancestors when there is enough room',async()=>{
 const {container}=render(<PortalChrome {...props} page="courses"><div>Página</div></PortalChrome>);
 const crumbs=container.querySelector<HTMLElement>('.sc-breadcrumb-design-one .sc-crumbs')!;
 let full=710;
 Object.defineProperty(crumbs,'scrollWidth',{configurable:true,get:()=>full});
 Object.defineProperty(crumbs,'clientWidth',{configurable:true,get:()=>370});
 const {act}=await import('@testing-library/react');
 act(()=>window.dispatchEvent(new Event('resize')));
 expect(crumbs.classList.contains('sc-crumbs-condensed')).toBe(true);
 full=280;
 act(()=>window.dispatchEvent(new Event('resize')));
 expect(crumbs.classList.contains('sc-crumbs-condensed')).toBe(false);
});

it('aligns the sidebar brand in a dedicated header row across desktop states',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const sidebar=container.querySelector('#school-sidebar');
 const brand=sidebar?.firstElementChild;
 expect(brand?.tagName).toBe('HEADER');
 expect(brand?.classList.contains('sc-shell-brand')).toBe(true);
 expect(brand?.getAttribute('aria-label')).toBe('School Control · Primaria Hidalgo');
 expect(brand?.getAttribute('data-compact')).toBe('false');
 expect(brand?.querySelector('.sc-sidebar-system-mark svg')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Colapsar barra lateral'}));
 expect(container.querySelector('.sc-shell-collapsed .sc-sidebar > .sc-shell-brand[data-compact="true"]')).toBeTruthy();
});

it('keeps the aligned brand and mobile close control in the drawer',async()=>{
 const onMobile=vi.fn();
 const {container}=render(<PortalChrome {...props} mobile onMobile={onMobile}><div>Página</div></PortalChrome>);
 expect(container.querySelector('.sc-sidebar.open > header.sc-shell-brand[data-compact="false"]')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar menú'}));
 expect(onMobile).toHaveBeenCalledWith(false);
});

it('keeps the main sidebar scrollable and keyboard-focusable without changing its role',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Navegación principal'});
 expect(nav.getAttribute('tabindex')).toBe('0');
 expect(nav.getAttribute('aria-keyshortcuts')).toContain('PageDown');
 expect(nav.classList.contains('sc-sidebar-nav')).toBe(true);
 const scrollable=container.querySelectorAll('.sc-sidebar-nav');
 expect(scrollable).toHaveLength(1);
 Object.defineProperty(nav,'clientHeight',{configurable:true,value:200});
 Object.defineProperty(nav,'scrollHeight',{configurable:true,value:1200});
 nav.focus();
 await userEvent.keyboard('{End}');
 expect(nav.scrollTop).toBe(1000);
 await userEvent.keyboard('{Home}');
 expect(nav.scrollTop).toBe(0);
});
it('preserves access to the lower navigation categories with keyboard scrolling',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Navegación principal'});
 Object.defineProperty(nav,'clientHeight',{configurable:true,value:160});
 Object.defineProperty(nav,'scrollHeight',{configurable:true,value:1100});
 nav.focus();
 await userEvent.keyboard('{PageDown}');
 expect(nav.scrollTop).toBeGreaterThan(0);
 expect(container.querySelector('.sc-sidebar .sc-nav-section:last-child .sc-section-label')?.textContent).toBe('Configuración');
});

it('reveals the active navigation destination inside the scrollbar-free rail',async()=>{
 const reveal=vi.fn();
 const original=HTMLElement.prototype.scrollIntoView;
 HTMLElement.prototype.scrollIntoView=reveal;
 try{
  render(<PortalChrome {...props} page="courses"><div>Página</div></PortalChrome>);
  expect(reveal).toHaveBeenCalledWith({block:'nearest',inline:'nearest'});
  expect(screen.getByRole('button',{name:'Clases'}).getAttribute('aria-current')).toBe('page');
 }finally{
  if(original)HTMLElement.prototype.scrollIntoView=original;
  else Reflect.deleteProperty(HTMLElement.prototype,'scrollIntoView');
 }
});

it('keeps navigation actions functional after scrolling without a visible scrollbar',async()=>{
 const navigate=vi.fn();
 render(<PortalChrome {...props} onNavigate={navigate}><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Navegación principal'});
 Object.defineProperty(nav,'clientHeight',{configurable:true,value:140});
 Object.defineProperty(nav,'scrollHeight',{configurable:true,value:1200});
 nav.focus();
 await userEvent.keyboard('{End}');
 expect(nav.scrollTop).toBe(1060);
 await userEvent.click(screen.getByRole('button',{name:'Configuración'}));
 expect(screen.getByRole('button',{name:'Usuarios'})).toBeTruthy();
 expect(nav.scrollTop).toBe(1060);
});

it('updates breadcrumb labels when the actual route changes without remounting PortalChrome',()=>{
 const cases=[
  ['dashboard','Resumen',1],
  ['students','Alumnos y expedientes',1],
  ['admissions','Admisiones',1],
  ['groups','Grupos',2],
  ['courses','Clases',3],
  ['reports','Reportes',1],
  ['email_templates','Plantillas de correo',1],
  ['preferences','Preferencias',1],
  ['student_details','Ficha del alumno',3]
 ] as const;
 const {rerender}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 for(const [route,title,levels] of cases){
  rerender(<PortalChrome {...props} page={route}><div>Página</div></PortalChrome>);
  const trail=screen.getByRole('navigation',{name:'Ruta de navegación'});
  expect(trail.getAttribute('data-current-page')).toBe(route);
  expect(trail.querySelectorAll('.sc-crumb-step')).toHaveLength(levels);
  expect(trail.querySelector('[aria-current="page"]')?.textContent).toBe(title);
  expect(trail.querySelector('.sc-crumb-home-label')?.textContent).toBe('Inicio');
 }
});

it('navigates from the sidebar to a different module and updates the breadcrumb immediately',async()=>{
 function PageFixture(){
  const [current,setCurrent]=React.useState('dashboard');
  return <PortalChrome {...props} page={current} onNavigate={setCurrent}><div>Página</div></PortalChrome>;
 }
 render(<PageFixture/>);
 const trail=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(trail.querySelector('[aria-current="page"]')?.textContent).toBe('Resumen');
 await userEvent.click(screen.getByRole('button',{name:'Alumnos y expedientes'}));
 expect(trail.querySelector('[aria-current="page"]')?.textContent).toBe('Alumnos y expedientes');
 expect(trail.getAttribute('data-current-page')).toBe('students');
 await userEvent.click(screen.getByRole('button',{name:'Ir al inicio'}));
 expect(trail.querySelector('[aria-current="page"]')?.textContent).toBe('Resumen');
});

it('updates breadcrumbs on mobile when changing between nested school modules',()=>{
 const {rerender}=render(<PortalChrome {...props} mobile page="dashboard"><div>Página</div></PortalChrome>);
 const breadcrumb=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(breadcrumb.querySelector('[aria-current=page]')?.textContent).toBe('Resumen');
 rerender(<PortalChrome {...props} mobile page="courses"><div>Página</div></PortalChrome>);
 expect(breadcrumb.querySelector('[aria-current=page]')?.textContent).toBe('Clases');
 expect(breadcrumb.querySelectorAll('.sc-crumb-ancestor')).toHaveLength(2);
 expect(screen.getByRole('button',{name:'Mostrar páginas anteriores'})).toBeTruthy();
 rerender(<PortalChrome {...props} mobile page="reports"><div>Página</div></PortalChrome>);
 expect(breadcrumb.querySelector('[aria-current=page]')?.textContent).toBe('Reportes');
 expect(breadcrumb.querySelectorAll('.sc-crumb-ancestor')).toHaveLength(0);
});

it('keeps the breadcrumb left-to-right hierarchy after navigation in the teacher portal',()=>{
 const userAsTeacher={...user,role:'teacher'};
 const {rerender}=render(<PortalChrome {...props} user={userAsTeacher} page="dashboard"><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(nav.querySelector('[aria-current=page]')?.textContent).toBe('Mi día');
 rerender(<PortalChrome {...props} user={userAsTeacher} page="groups"><div>Página</div></PortalChrome>);
 expect(nav.querySelector('[aria-current=page]')?.textContent).toBe('Mis grupos');
 expect(nav.querySelector('.sc-crumb-home-label')?.textContent).toBe('Inicio');
});

it('renders the slim footer inside the main column and never inside the sidebar',()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const main=container.querySelector('.sc-main')!;
 const foot=main.querySelector('.sc-portal-footer')!;
 expect(foot).toBeTruthy();
 expect(container.querySelector('.sc-sidebar .sc-portal-footer')).toBeNull();
 expect(main.lastElementChild).toBe(foot);
 expect(foot.querySelector('.sc-portal-footer-version')?.textContent).toBe('v1.0.0');
});
it('navigates to actual support and legal screens from its footer buttons',async()=>{
 const onNavigate=vi.fn();
 render(<PortalChrome {...props} onNavigate={onNavigate}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Soporte'}));
 await userEvent.click(screen.getByRole('button',{name:'Aviso de privacidad'}));
 await userEvent.click(screen.getByRole('button',{name:'Términos de uso'}));
 expect(onNavigate.mock.calls.map(call=>call[0])).toEqual(['help','privacy','terms']);
});
it('shows a readable compact footer with language switching',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 await userEvent.click(screen.getByRole('button',{name:'English · EN'}));
 const footer=screen.getByRole('contentinfo',{name:'Portal footer'});
 expect(footer).toBeTruthy();
 expect(screen.getByRole('button',{name:'Privacy notice'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Terms of use'})).toBeTruthy();
});

it('shows the signed-in user initials rather than an image in the sidebar account circle',async()=>{
 const {container}=render(<PortalChrome {...props} user={{...user,name:'Ana María López',avatar_url:'/real-avatar.jpg'}}><div>Página</div></PortalChrome>);
 const sidebarButton=container.querySelector<HTMLButtonElement>('.sc-sidebar .sc-sidebar-account')!;
 const avatar=sidebarButton.querySelector('.sc-sidebar-avatar')!;
 expect(avatar.textContent).toBe('AL');
 expect(avatar.getAttribute('aria-hidden')).toBe('true');
 expect(avatar.querySelector('img')).toBeNull();
 expect(sidebarButton.querySelector('.sc-sidebar-user strong')?.textContent).toBe('Ana María López');
 expect(container.querySelector('.sc-topbar-avatar img')?.getAttribute('src')).toBe('/real-avatar.jpg');
 await userEvent.click(sidebarButton);
 expect(screen.getByRole('button',{name:'Mi perfil y seguridad'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
});

it('keeps the circular account initials in the centered rail when the sidebar collapses',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const shell=container.querySelector('.sc-shell')!;
 expect(shell.classList.contains('sc-shell-collapsed')).toBe(true);
 const sidebarButton=container.querySelector<HTMLButtonElement>('.sc-sidebar .sc-sidebar-account')!;
 expect(sidebarButton.querySelector('.sc-sidebar-avatar')?.textContent).toBe('MG');
 expect(sidebarButton.querySelector('.sc-sidebar-user')).toBeTruthy();
 await userEvent.click(sidebarButton);
 expect(screen.getByRole('button',{name:'Preferencias'})).toBeTruthy();
});

it('keeps the initials readable in the mobile sidebar profile area',()=>{
 const {container}=render(<PortalChrome {...props} mobile><div>Página</div></PortalChrome>);
 expect(container.querySelector('.sc-sidebar.open .sc-sidebar-avatar')?.textContent).toBe('MG');
});

it('renders full-row language options and updates the selected state through the dropdown',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getByRole('button',{name:'Idioma'}));
 const menu=screen.getByRole('group',{name:'Idiomas disponibles'});
 expect(menu.classList.contains('sc-language-menu')).toBe(true);
 const spanish=screen.getByRole('button',{name:'Español · ES'});
 const english=screen.getByRole('button',{name:'English · EN'});
 expect(spanish.classList.contains('sc-language-option')).toBe(true);
 expect(english.classList.contains('sc-language-option')).toBe(true);
 expect(spanish.getAttribute('aria-pressed')).toBe('true');
 await userEvent.click(english);
 expect(localStorage.getItem('school-locale')).toBe('en');
 expect(screen.queryByRole('group',{name:'Idiomas disponibles'})).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Language'}));
 expect(screen.getByRole('button',{name:'English · EN'}).getAttribute('aria-pressed')).toBe('true');
});

it('shows a legible account panel outside the dark sidebar clipping context',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const avatar=container.querySelector<HTMLButtonElement>('.sc-sidebar-account')!;
 await userEvent.click(avatar);
 const panel=screen.getByRole('group',{name:'Menú de cuenta'});
 expect(panel.id).toBe('sc-sidebar-account-panel');
 expect(panel.classList.contains('sc-sidebar-account-panel')).toBe(true);
 expect(container.querySelector('#school-sidebar .sc-sidebar-account-panel')).toBeNull();
 expect(panel.parentElement).toBe(document.body);
 expect(panel.querySelector('.sc-sam-identity strong')?.textContent).toBe('María González');
 expect(panel.querySelector('.sc-sam-identity small')?.textContent).toBe('maria@example.test');
 expect(panel.querySelector('.sc-sam-role')?.textContent).toBe('Administración');
 expect(panel.querySelector('.sc-sam-avatar')?.textContent).toBe('MG');
 expect(panel.querySelectorAll('.sc-sam-action')).toHaveLength(5);
 expect(avatar.getAttribute('aria-controls')).toBe(panel.id);
});
it('supports sidebar popover navigation, outside dismissal and Escape focus',async()=>{
 const onNavigate=vi.fn();
 const {container}=render(<PortalChrome {...props} onNavigate={onNavigate}><div>Página</div></PortalChrome>);
 const trigger=container.querySelector<HTMLButtonElement>('.sc-sidebar-account')!;
 await userEvent.click(trigger);
 await userEvent.click(screen.getByRole('button',{name:'Mi perfil y seguridad'}));
 expect(onNavigate).toHaveBeenCalledWith('profile');
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
 await userEvent.click(trigger);
 await userEvent.keyboard('{Escape}');
 expect(document.activeElement).toBe(trigger);
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
 await userEvent.click(trigger);
 await userEvent.click(document.body);
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
});
it('opens compact sidebar avatar options in a fixed viewport overlay',async()=>{
 localStorage.setItem('school-sidebar-collapsed','true');
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(container.querySelector<HTMLButtonElement>('.sc-sidebar-account')!);
 const panel=screen.getByRole('group',{name:'Menú de cuenta'}) as HTMLElement;
 expect(panel.style.position).toBe('fixed');
 expect(panel.style.visibility).not.toBe('hidden');
 expect(container.querySelector('.sc-sidebar .sc-sidebar-account-panel')).toBeNull();
});

it('returns keyboard focus to the language selector after an edge-to-edge option is chosen',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const trigger=screen.getByRole('button',{name:'Idioma'});
 await userEvent.click(trigger);
 const english=screen.getByRole('button',{name:'English · EN'});
 expect(english.classList.contains('sc-language-option')).toBe(true);
 await userEvent.click(english);
 expect(document.activeElement).toBe(trigger);
 expect(screen.queryByRole('group',{name:'Idiomas disponibles'})).toBeNull();
 expect(localStorage.getItem('school-locale')).toBe('en');
});

it('uses the option title as the accessible name while keeping descriptive help text',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})[0]);
 const profile=screen.getByRole('button',{name:'Mi perfil y seguridad'});
 const preferences=screen.getByRole('button',{name:'Preferencias'});
 expect(profile.textContent).toContain('Datos personales y acceso');
 expect(preferences.textContent).toContain('Idioma y apariencia');
 expect(screen.getByRole('button',{name:'Centro de notificaciones'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Ayuda y guía de uso'})).toBeTruthy();
});

it('closes the detached account panel when the mobile drawer is dismissed',async()=>{
 const onMobile=vi.fn();
 render(<PortalChrome {...props} mobile onMobile={onMobile}><div>Página</div></PortalChrome>);
 await userEvent.click(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})[0]);
 expect(screen.getByRole('group',{name:'Menú de cuenta'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar menú lateral'}));
 expect(onMobile).toHaveBeenCalledWith(false);
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
});

it('uses the same professional account menu in navbar and sidebar, with one active menu',async()=>{
 const onNavigate=vi.fn();
 const {container}=render(<PortalChrome {...props} onNavigate={onNavigate}><div>Página</div></PortalChrome>);
 const triggers=screen.getAllByRole('button',{name:'Opciones de cuenta de María González'});
 await userEvent.click(triggers[0]);
 expect(screen.getByRole('group',{name:'Menú de cuenta'}).id).toBe('sc-sidebar-account-panel');
 await userEvent.click(triggers[1]);
 const panel=screen.getByRole('group',{name:'Menú de cuenta'});
 expect(panel.id).toBe('sc-topbar-account-panel');
 expect(panel.classList.contains('sc-sidebar-account-panel')).toBe(true);
 expect(panel.classList.contains('sc-navbar-account-panel')).toBe(true);
 expect(panel.parentElement).toBe(document.body);
 expect(panel.querySelectorAll('.sc-sam-action')).toHaveLength(5);
 expect(panel.querySelector('.sc-sam-identity strong')?.textContent).toBe('María González');
 expect(triggers[1].getAttribute('aria-controls')).toBe(panel.id);
 expect(container.querySelector('.sc-topbar .sc-account-menu')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Preferencias'}));
 expect(onNavigate).toHaveBeenCalledWith('preferences');
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
});
it('keeps navbar avatar menu interactive and returns focus on Escape',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const trigger=container.querySelector<HTMLButtonElement>('.sc-topbar .sc-account-button')!;
 await userEvent.click(trigger);
 const panel=screen.getByRole('group',{name:'Menú de cuenta'});
 await userEvent.click(panel);
 expect(screen.getByRole('button',{name:'Mi perfil y seguridad'})).toBeTruthy();
 screen.getByRole('button',{name:'Mi perfil y seguridad'}).focus();
 await userEvent.keyboard('{Escape}');
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
 expect(document.activeElement).toBe(trigger);
});
it('supports arrow and Home/End keyboard navigation in navbar avatar options',async()=>{
 const {container}=render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const trigger=container.querySelector<HTMLButtonElement>('.sc-topbar .sc-account-button')!;
 trigger.focus();
 await userEvent.keyboard('{ArrowDown}');
 const menu=screen.getByRole('group',{name:'Menú de cuenta'});
 const actions=Array.from(menu.querySelectorAll<HTMLButtonElement>('button'));
 expect(actions).toHaveLength(5);
 expect(document.activeElement).toBe(actions[0]);
 await userEvent.keyboard('{End}');
 expect(document.activeElement).toBe(actions[4]);
 await userEvent.keyboard('{ArrowDown}');
 expect(document.activeElement).toBe(actions[0]);
 await userEvent.keyboard('{ArrowUp}');
 expect(document.activeElement).toBe(actions[4]);
 await userEvent.keyboard('{Home}');
 expect(document.activeElement).toBe(actions[0]);
});
it('keeps only the active topbar flyout when another menu opens',async()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 const triggers=screen.getAllByRole('button',{name:'Opciones de cuenta de María González'});
 await userEvent.click(triggers[1]);
 expect(screen.getByRole('group',{name:'Menú de cuenta'}).id).toBe('sc-topbar-account-panel');
 await userEvent.click(screen.getByRole('button',{name:'Notificaciones: 0 sin leer'}));
 expect(screen.queryByRole('group',{name:'Menú de cuenta'})).toBeNull();
});
it('shows a compact photo-only avatar when the navbar has limited width',async()=>{
 const {container}=render(<PortalChrome {...props} user={{...user,avatar_url:'/account-photo.jpg'}}><div>Página</div></PortalChrome>);
 const trigger=container.querySelector<HTMLButtonElement>('.sc-topbar .sc-account-button')!;
 expect(trigger.querySelector('.sc-topbar-avatar img')?.getAttribute('src')).toBe('/account-photo.jpg');
 expect(trigger.getAttribute('aria-haspopup')).toBe('true');
 await userEvent.click(trigger);
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Ayuda y guía de uso'})).toBeTruthy();
});
