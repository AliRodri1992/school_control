// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from './Profile';
import {api} from './api';
import {notify} from './notifications';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(value:string)=>value})}));
vi.mock('./AccountSecurity',()=>({default:()=> <div data-testid="security-controls"/>}));
const request=vi.mocked(api);
const initial={id:7,name:'María González',email:'maria@school.test',role:'teacher',email_notifications:false};
beforeEach(()=>{request.mockReset();vi.mocked(notify).mockReset();request.mockImplementation(async()=>({...initial}));});
afterEach(cleanup);

it('renders the school-branded identity and real editable profile fields',async()=>{
 const onChange=vi.fn();
 const {container}=render(<Profile onChange={onChange} onSignedOut={vi.fn()}/>);
 expect(await screen.findByRole('heading',{name:'María González'})).toBeTruthy();
 expect(container.querySelector('.sc-profile-avatar')?.textContent).toBe('MG');
 expect(screen.getByText('Docente')).toBeTruthy();
 expect(screen.getByRole('textbox',{name:/Nombre completo/})).toHaveProperty('value','María González');
 const email=screen.getByRole('textbox',{name:'Correo de acceso'}) as HTMLInputElement;
 expect(email.value).toBe('maria@school.test');
 expect(email.readOnly).toBe(true);
 expect(screen.getByRole('switch',{name:'Avisos por correo electrónico'})).toHaveProperty('checked',false);
 expect(screen.getByTestId('security-controls')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Guardar cambios'})).toHaveProperty('disabled',true);
 expect(onChange).not.toHaveBeenCalled();
});

it('saves real data, trims the name and passes updated identity to the portal',async()=>{
 const onChange=vi.fn();
 request.mockImplementation(async (resource:string,method?:string,data?:any)=>{
  if(resource==='profile'&&method==='PATCH')return {...initial,...data};
  return {...initial};
 });
 const {container}=render(<Profile onChange={onChange} onSignedOut={vi.fn()}/>);
 const name=await screen.findByRole('textbox',{name:/Nombre completo/});
 await userEvent.clear(name);
 await userEvent.type(name,'  Carmen Rivera  ');
 await userEvent.click(screen.getByRole('switch',{name:'Avisos por correo electrónico'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile','PATCH',
  {name:'Carmen Rivera',email_notifications:true}));
 await waitFor(()=>expect(notify).toHaveBeenCalledWith('Perfil actualizado correctamente.'));
 expect(screen.queryByText('Cambios guardados correctamente.')).toBeNull();
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({name:'Carmen Rivera',email:'maria@school.test'}));
 expect(container.querySelector('.sc-profile-avatar')?.textContent).toBe('CR');
 expect(screen.getByRole('button',{name:'Guardar cambios'})).toHaveProperty('disabled',true);
 expect(notify).toHaveBeenCalledTimes(1);
});

it('discards edits without issuing a request',async()=>{
 render(<Profile onChange={vi.fn()} onSignedOut={vi.fn()}/>);
 const name=await screen.findByRole('textbox',{name:/Nombre completo/});
 await userEvent.clear(name);
 await userEvent.type(name,'Cambio temporal');
 await userEvent.click(screen.getByRole('switch',{name:'Avisos por correo electrónico'}));
 await userEvent.click(screen.getByRole('button',{name:'Descartar cambios'}));
 expect(name).toHaveProperty('value','María González');
 expect(screen.getByRole('switch',{name:'Avisos por correo electrónico'})).toHaveProperty('checked',false);
 expect(screen.getByRole('button',{name:'Guardar cambios'})).toHaveProperty('disabled',true);
 expect(request).toHaveBeenCalledTimes(1);
});

it('preserves the unsaved name and does not update portal identity on an API failure',async()=>{
 const onChange=vi.fn();
 request.mockImplementation(async(resource:string,method?:string)=>{
  if(resource==='profile'&&method==='PATCH')throw new Error('No pudimos guardar los cambios.');
  return {...initial};
 });
 render(<Profile onChange={onChange} onSignedOut={vi.fn()}/>);
 const name=await screen.findByRole('textbox',{name:/Nombre completo/});
 await userEvent.clear(name);await userEvent.type(name,'Otro nombre');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','No pudimos guardar los cambios.');
 expect(name).toHaveProperty('value','Otro nombre');
 expect(onChange).not.toHaveBeenCalled();
 expect(screen.getByRole('button',{name:'Guardar cambios'})).toHaveProperty('disabled',false);
});

it('shows a distinct failure state when profile loading fails',async()=>{
 request.mockRejectedValue(new Error('Sin conexión con la escuela'));
 render(<Profile onChange={vi.fn()} onSignedOut={vi.fn()}/>);
 expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Sin conexión con la escuela'));
 expect(screen.queryByRole('textbox',{name:/Nombre completo/})).toBeNull();
});

it('retries loading the profile inside the page without resetting the whole portal',async()=>{
 request.mockRejectedValueOnce(new Error('Servidor temporalmente ocupado')).mockResolvedValue({...initial});
 render(<Profile onChange={vi.fn()} onSignedOut={vi.fn()}/>);
 expect((await screen.findByRole('alert')).textContent).toContain('Servidor temporalmente ocupado');
 await userEvent.click(screen.getByRole('button',{name:'Reintentar'}));
 expect(await screen.findByRole('heading',{name:'María González'})).toBeTruthy();
 expect(request).toHaveBeenCalledTimes(2);
 expect(screen.queryByRole('alert')).toBeNull();
});
