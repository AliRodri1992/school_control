// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileEmailChange from './ProfileEmailChange';
import {api} from './api';
import {notify} from './notifications';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(t:string)=>t})}));
const request=vi.mocked(api);
beforeEach(()=>{
 request.mockReset();vi.mocked(notify).mockReset();
 window.history.replaceState(null,'','/');
 request.mockResolvedValue({message:'Solicitud procesada.'});
});
afterEach(()=>{cleanup();window.history.replaceState(null,'','/');});

it('requires current password and sends a request without directly changing the email',async()=>{
 const signOut=vi.fn();
 render(<ProfileEmailChange currentEmail="old@school.test" onSignedOut={signOut}/>);
 await userEvent.type(screen.getByLabelText('Nuevo correo electrónico'),'new@school.test');
 await userEvent.type(screen.getByLabelText('Confirma tu contraseña actual'),'Valid-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Enviar enlace de verificación'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile/email_change','POST',{
  email:'new@school.test',current_password:'Valid-password-26'
 }));
 expect(await screen.findByText('Revisa tu nuevo correo')).toBeTruthy();
 expect(signOut).not.toHaveBeenCalled();
});

it('keeps the signed-in account after an incorrect current password',async()=>{
 request.mockRejectedValue(new Error('La contraseña actual es incorrecta.'));
 const onSignedOut=vi.fn();
 render(<ProfileEmailChange currentEmail="old@school.test" onSignedOut={onSignedOut}/>);
 await userEvent.type(screen.getByLabelText('Nuevo correo electrónico'),'new@school.test');
 await userEvent.type(screen.getByLabelText('Confirma tu contraseña actual'),'Wrong-password');
 await userEvent.click(screen.getByRole('button',{name:'Enviar enlace de verificación'}));
 expect((await screen.findByRole('alert')).textContent).toContain('La contraseña actual es incorrecta.');
 expect(onSignedOut).not.toHaveBeenCalled();
});

it('consumes a verification token from the link and signs out only on success',async()=>{
 window.history.replaceState(null,'','/?verify_email=signed-one-use-token');
 const onSignedOut=vi.fn();
 render(<ProfileEmailChange currentEmail="old@school.test" onSignedOut={onSignedOut}/>);
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile/email_change/confirm','POST',{
  token:'signed-one-use-token'
 }));
 await waitFor(()=>expect(onSignedOut).toHaveBeenCalledOnce());
 expect(window.location.search).not.toContain('verify_email');
});

it('does not sign out when the verification token is invalid',async()=>{
 window.history.replaceState(null,'','/?verify_email=expired-token');
 request.mockRejectedValue(new Error('El enlace es inválido o ha caducado.'));
 const onSignedOut=vi.fn();
 render(<ProfileEmailChange currentEmail="old@school.test" onSignedOut={onSignedOut}/>);
 expect((await screen.findByRole('alert')).textContent).toContain('El enlace es inválido');
 expect(window.location.search).not.toContain('verify_email');
 expect(onSignedOut).not.toHaveBeenCalled();
});

it('does not send a verification email when the proposed address matches the current one',async()=>{
 const onSignedOut=vi.fn();
 render(<ProfileEmailChange currentEmail="old@school.test" onSignedOut={onSignedOut}/>);
 await userEvent.type(screen.getByLabelText('Nuevo correo electrónico'),'OLD@school.test');
 await userEvent.type(screen.getByLabelText('Confirma tu contraseña actual'),'Correct-account-password');
 expect(screen.getByRole('button',{name:'Enviar enlace de verificación'})).toHaveProperty('disabled',true);
 expect(request).not.toHaveBeenCalled();
 expect(onSignedOut).not.toHaveBeenCalled();
});
