// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Preferences from './Preferences';
import {api} from '../../api';
import {notify} from '../../notifications';

vi.mock('../../api',()=>({api:vi.fn()}));
vi.mock('../../notifications',()=>({notify:vi.fn()}));
vi.mock('../../shared/i18n/LocaleContext',()=>({
 useSchoolLocale:()=>({ui:(text:string)=>text,locale:'es'})
}));

const fetchApi=vi.mocked(api);
const initial={locale:'es',theme:'system',rows_per_page:15,selected_child_id:24};
const languages=[
 {code:'es',native_name:'Español',status:'active'},
 {code:'en',native_name:'English',status:'active'},
 {code:'ko',native_name:'한국어',status:'disabled'}
];
beforeEach(()=>{
 fetchApi.mockReset();
 vi.mocked(notify).mockReset();
 fetchApi.mockImplementation(async(resource:string)=>{
  if(resource==='preferences')return {...initial};
  if(resource==='languages')return languages;
  return {};
 });
 localStorage.removeItem('school-locale');
 document.documentElement.removeAttribute('data-school-theme');
});
afterEach(cleanup);

it('uses the whole content width with separate settings and preview columns',async()=>{
 const {container}=render(<Preferences/>);
 expect(await screen.findByRole('heading',{name:'Preferencias del sistema'})).toBeTruthy();
 const workspace=container.querySelector('.sc-pref-workspace') as HTMLElement;
 expect(workspace).toBeTruthy();
 expect(workspace.querySelector('.sc-pref-grid')).toBeTruthy();
 expect(workspace.querySelector('.sc-pref-primary')).toBeTruthy();
 expect(workspace.querySelector('.sc-pref-secondary')).toBeTruthy();
 expect(workspace.querySelector('.sc-pref-preview-screen')).toHaveProperty('dataset',expect.objectContaining({previewTheme:'system',density:'15'}));
 expect(screen.getByRole('button',{name:'Guardar preferencias'})).toHaveProperty('disabled',true);
 expect(screen.getByRole('status').textContent).toContain('Configuración al día');
});

it('previews theme changes without applying them before saving, then persists the existing family selection',async()=>{
 const onSaved=vi.fn();
 fetchApi.mockImplementation(async(resource:string,method?:string,data?:any)=>{
  if(resource==='preferences'&&method==='PATCH')return {...data};
  if(resource==='preferences')return {...initial};
  if(resource==='languages')return languages;
  return {};
 });
 const {container}=render(<Preferences onSaved={onSaved}/>);
 await screen.findByRole('heading',{name:'Tema visual'});
 await userEvent.click(screen.getByRole('button',{name:/Oscuro/}));
 await userEvent.click(screen.getByRole('button',{name:/25 registros/}));
 const preview=container.querySelector('.sc-pref-preview-screen') as HTMLElement;
 expect(preview.dataset.previewTheme).toBe('dark');
 expect(preview.dataset.density).toBe('25');
 expect(screen.getByRole('status').textContent).toContain('Cambios sin guardar');
 expect(document.documentElement.dataset.schoolTheme).toBeUndefined();
 expect(onSaved).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));
 await waitFor(()=>expect(fetchApi).toHaveBeenCalledWith('preferences','PATCH',{
  locale:'es',theme:'dark',rows_per_page:25,selected_child_id:24
 }));
 await waitFor(()=>expect(onSaved).toHaveBeenCalledWith({
  locale:'es',theme:'dark',rows_per_page:25,selected_child_id:24
 }));
 expect(document.documentElement.dataset.schoolTheme).toBe('dark');
 expect(localStorage.getItem('school-locale')).toBe('es');
 expect(notify).toHaveBeenCalledExactlyOnceWith('Preferencias actualizadas correctamente.');
 expect(screen.getByRole('button',{name:'Guardar preferencias'})).toHaveProperty('disabled',true);
 expect(screen.queryByText('Preferencias actualizadas correctamente.')).toBeNull();
});

it('offers only the school-enabled languages and applies the selection on save',async()=>{
 fetchApi.mockImplementation(async(resource:string,method?:string,data?:any)=>{
  if(resource==='preferences'&&method==='PATCH')return {...data};
  if(resource==='preferences')return {...initial};
  if(resource==='languages')return languages;
  return {};
 });
 render(<Preferences/>);
 const picker=await screen.findByRole('combobox',{name:'Idioma preferido'});
 await userEvent.click(picker);
 expect(screen.getByRole('option',{name:'English'})).toBeTruthy();
 expect(screen.queryByRole('option',{name:'한국어'})).toBeNull();
 await userEvent.click(screen.getByRole('option',{name:'English'}));
 expect(screen.getByRole('combobox',{name:'Idioma preferido'}).textContent).toContain('English');
 await userEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));
 await waitFor(()=>expect(fetchApi).toHaveBeenCalledWith('preferences','PATCH',
  expect.objectContaining({locale:'en'})));
 expect(localStorage.getItem('school-locale')).toBe('en');
});

it('discards changes and leaves server data, theme and locale untouched',async()=>{
 render(<Preferences/>);
 await screen.findByRole('heading',{name:'Tema visual'});
 await userEvent.click(screen.getByRole('button',{name:/Claro/}));
 await userEvent.click(screen.getByRole('button',{name:/50 registros/}));
 expect(screen.getByRole('status').textContent).toContain('Cambios sin guardar');
 await userEvent.click(screen.getByRole('button',{name:'Descartar cambios'}));
 expect(screen.getByRole('status').textContent).toContain('Configuración al día');
 expect(screen.getByRole('button',{name:/Automático/}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByRole('button',{name:'Guardar preferencias'})).toHaveProperty('disabled',true);
 expect(fetchApi).not.toHaveBeenCalledWith('preferences','PATCH',expect.anything());
 expect(document.documentElement.dataset.schoolTheme).toBeUndefined();
});

it('shows API errors without false success messages or discarding unsaved choices',async()=>{
 fetchApi.mockImplementation(async(resource:string,method?:string)=>{
  if(resource==='preferences'&&method==='PATCH')throw new Error('No fue posible guardar.');
  if(resource==='preferences')return {...initial};
  if(resource==='languages')return languages;
  return {};
 });
 render(<Preferences/>);
 await screen.findByRole('heading',{name:'Tema visual'});
 await userEvent.click(screen.getByRole('button',{name:/Oscuro/}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));
 expect((await screen.findByRole('alert')).textContent).toContain('No fue posible guardar.');
 expect(screen.getByRole('button',{name:/Oscuro/}).getAttribute('aria-pressed')).toBe('true');
 expect(screen.getByRole('button',{name:'Guardar preferencias'})).toHaveProperty('disabled',false);
 expect(notify).not.toHaveBeenCalled();
});

it('retries an initial loading failure without reloading the entire portal',async()=>{
 fetchApi.mockRejectedValueOnce(new Error('Servicio no disponible'))
  .mockImplementation(async(resource:string)=>resource==='preferences'?{...initial}:languages);
 render(<Preferences/>);
 expect((await screen.findByRole('alert')).textContent).toContain('Servicio no disponible');
 await userEvent.click(screen.getByRole('button',{name:'Reintentar'}));
 expect(await screen.findByRole('heading',{name:'Tema visual'})).toBeTruthy();
 expect(screen.queryByRole('alert')).toBeNull();
});

it('respects the existing school theme until Save and shows clear selected-button states',async()=>{
 document.documentElement.dataset.schoolTheme='dark';
 render(<Preferences/>);
 const theme=await screen.findByRole('group',{name:'Tema preferido'});
 expect(within(theme).getByRole('button',{name:/Automático/}).getAttribute('aria-pressed')).toBe('true');
 await userEvent.click(within(theme).getByRole('button',{name:/Claro/}));
 expect(within(theme).getByRole('button',{name:/Claro/}).getAttribute('aria-pressed')).toBe('true');
 expect(document.documentElement.dataset.schoolTheme).toBe('dark');
});

it('explains the difference between the live illustrative preview and unapplied settings',async()=>{
 render(<Preferences/>);
 const preview=await screen.findByLabelText('Vista previa ilustrativa del sistema');
 expect(preview).toBeTruthy();
 expect(screen.getByText('La vista previa cambia mientras eliges opciones; los ajustes solo se aplican cuando guardas.')).toBeTruthy();
 expect(document.documentElement.dataset.schoolTheme).toBeUndefined();
 await userEvent.click(screen.getByRole('button',{name:/Oscuro/}));
 expect(screen.getByRole('status').textContent).toContain('Cambios sin guardar');
 expect(document.documentElement.dataset.schoolTheme).toBeUndefined();
});
