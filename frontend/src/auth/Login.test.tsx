// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import {api} from '../api';

vi.mock('../api',()=>({api:vi.fn()}));
vi.mock('../notifications',()=>({notify:vi.fn()}));
const request=vi.mocked(api);
const school={name:'Primaria Ejemplo'};

beforeEach(()=>{request.mockReset();});
afterEach(cleanup);

it('shows accessible field-level errors before sending an empty login',async()=>{
 render(<Login school={school} initialError="" onLogin={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));
 expect(screen.getByText('Correo electrónico no puede estar vacío.')).toBeTruthy();
 expect(screen.getByText('Contraseña no puede estar vacía.')).toBeTruthy();
 expect(request).not.toHaveBeenCalled();
});

it('validates email format and clears the field error on correction',async()=>{
 render(<Login school={school} initialError="" onLogin={vi.fn()}/>);
 const email=screen.getByLabelText(/^Correo electrónico/);
 await userEvent.type(email,'correo-invalido');
 await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));
 expect(screen.getByText('Correo electrónico no tiene un formato válido.')).toBeTruthy();
 await userEvent.clear(email);
 await userEvent.type(email,'familia@school.test');
 expect(screen.queryByText('Correo electrónico no tiene un formato válido.')).toBeNull();
});

it('requires matching passwords when creating a family account',async()=>{
 render(<Login school={school} initialError="" onLogin={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Regístrate aquí'}));
 await userEvent.type(screen.getByLabelText(/^Nombre completo/),'Familia Ejemplo');
 await userEvent.type(screen.getByLabelText(/^Correo electrónico/),'familia@school.test');
 await userEvent.type(screen.getByLabelText(/^Contraseña/),'School-password-26');
 await userEvent.type(screen.getByLabelText(/^Confirmación de contraseña/),'Otra-contrasena-26');
 await userEvent.click(screen.getByRole('button',{name:'Crear cuenta familiar'}));
 expect(screen.getByText('Confirmación de contraseña no coincide.')).toBeTruthy();
 expect(request).not.toHaveBeenCalled();
});

it('shows server validation messages below the matching field',async()=>{
 request.mockRejectedValueOnce(Object.assign(new Error('Revisa los datos'),{fieldErrors:{email:['ya está registrado']}}));
 render(<Login school={school} initialError="" onLogin={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Regístrate aquí'}));
 await userEvent.type(screen.getByLabelText(/^Nombre completo/),'Familia Ejemplo');
 await userEvent.type(screen.getByLabelText(/^Correo electrónico/),'familia@school.test');
 await userEvent.type(screen.getByLabelText(/^Contraseña/),'School-password-26');
 await userEvent.type(screen.getByLabelText(/^Confirmación de contraseña/),'School-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Crear cuenta familiar'}));
 expect(await screen.findByText('Correo electrónico ya está registrado.')).toBeTruthy();
});

it('uses the existing Rails session and delegates success to the app',async()=>{
 const user={id:12,name:'Familia Ejemplo',role:'guardian'};
 request.mockResolvedValueOnce({user});
 const onLogin=vi.fn().mockResolvedValue(undefined);
 render(<Login school={school} initialError="" onLogin={onLogin}/>);
 await userEvent.type(screen.getByLabelText(/^Correo electrónico/),'familia@school.test');
 await userEvent.type(screen.getByLabelText(/^Contraseña/),'School-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));
 await waitFor(()=>expect(onLogin).toHaveBeenCalledWith(user));
 expect(request).toHaveBeenCalledWith('session','POST',{email:'familia@school.test',password:'School-password-26'});
});
