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
 const links=container.querySelectorAll('.sc-breadcrumb-design-one .sc-crumb-link');
 expect(links).toHaveLength(2);
 expect(links[0].querySelector('.sc-crumb-icon svg')).toBeTruthy();
 expect(links[1].querySelector('.sc-crumb-icon svg')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Grupos'}));
 expect(navigate).toHaveBeenCalledWith('groups');
});
it('shows the original virtual student-record label in the guardian breadcrumb',()=>{
 render(<PortalChrome {...props} user={{...user,role:'guardian'}} page="student_details"><div>Página</div></PortalChrome>);
 const nav=screen.getByRole('navigation',{name:'Ruta de navegación'});
 expect(nav.textContent).toContain('Mis hijos');
 expect(nav.textContent).toContain('Expedientes');
 expect(nav.querySelector('[aria-current=page]')?.textContent).toBe('Ficha del alumno');
});
