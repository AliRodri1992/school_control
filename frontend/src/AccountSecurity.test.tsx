// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSecurity from './AccountSecurity';
import PasswordRecovery from './PasswordRecovery';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./ProfileTwoFactor',()=>({default:()=> <div data-testid="mfa-settings"/>}));
vi.mock('./ProfileDevices',()=>({default:()=> <div data-testid="device-sessions"/>}));
const request=vi.mocked(api);
beforeEach(()=>{request.mockReset();request.mockResolvedValue({message:'Solicitud procesada.'});});
afterEach(cleanup);

it('requests recovery without revealing account status',async()=>{
  render(<PasswordRecovery schoolName="Primaria" onClose={vi.fn()}/>);
  await userEvent.type(screen.getByLabelText('Correo electrónico'),'familia@school.test');
  await userEvent.click(screen.getByRole('button',{name:'Enviar enlace'}));
  expect(request).toHaveBeenCalledWith('password_reset','POST',{email:'familia@school.test'});
  expect(await screen.findByRole('status')).toHaveProperty('textContent','Solicitud procesada.');
});

it('requires matching passwords and sends the recovery token in the body',async()=>{
  const onClose=vi.fn();
  render(<PasswordRecovery schoolName="Primaria" token="recovery-token" onClose={onClose}/>);
  await userEvent.type(screen.getByLabelText('Nueva contraseña'),'New-school-password-26');
  await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'),'Other-school-password-26');
  await userEvent.click(screen.getByRole('button',{name:'Guardar nueva contraseña'}));
  expect(screen.getByRole('alert').textContent).toBe('Confirmar nueva contraseña no coincide.');
  expect(request).not.toHaveBeenCalled();
  await userEvent.clear(screen.getByLabelText('Confirmar nueva contraseña'));
  await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'),'New-school-password-26');
  await userEvent.click(screen.getByRole('button',{name:'Guardar nueva contraseña'}));
  await waitFor(()=>expect(onClose).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith('password_reset','PATCH',{token:'recovery-token',password:'New-school-password-26',password_confirmation:'New-school-password-26'});
});

it('shows expired link errors without claiming success',async()=>{
  const onClose=vi.fn();request.mockRejectedValue(new Error('El enlace expiró.'));
  render(<PasswordRecovery schoolName="Primaria" token="expired" onClose={onClose}/>);
  await userEvent.type(screen.getByLabelText('Nueva contraseña'),'New-school-password-26');
  await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'),'New-school-password-26');
  await userEvent.click(screen.getByRole('button',{name:'Guardar nueva contraseña'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','El enlace expiró.');
  expect(onClose).not.toHaveBeenCalled();
});

it('clears the signed-in UI only after the server revokes sessions',async()=>{
  const signedOut=vi.fn();request.mockRejectedValueOnce(new Error('Contraseña incorrecta.'));
  render(<AccountSecurity onSignedOut={signedOut}/>);
  await userEvent.type(screen.getByLabelText('Confirma tu contraseña actual'),'School-test-password-26');
  await userEvent.click(screen.getByRole('button',{name:'Cerrar todas mis sesiones'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Contraseña incorrecta.');
  expect(signedOut).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button',{name:'Cerrar todas mis sesiones'}));
  await waitFor(()=>expect(signedOut).toHaveBeenCalledOnce());
  expect(request).toHaveBeenLastCalledWith('profile/sessions','DELETE',{current_password:'School-test-password-26'});
});

it('changes a password with current-password verification',async()=>{
  const signedOut=vi.fn();render(<AccountSecurity onSignedOut={signedOut}/>);
  await userEvent.type(screen.getByLabelText('Contraseña actual'),'School-test-password-26');
  await userEvent.type(screen.getByLabelText('Nueva contraseña'),'New-school-password-26');
  await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'),'New-school-password-26');
  await userEvent.click(screen.getByRole('button',{name:'Actualizar contraseña y cerrar sesiones'}));
  await waitFor(()=>expect(signedOut).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith('profile/password','PATCH',{current_password:'School-test-password-26',password:'New-school-password-26',password_confirmation:'New-school-password-26'});
});

it('shows missing recovery email under the email field without calling Rails',async()=>{
 render(<PasswordRecovery schoolName="Primaria" onClose={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Enviar enlace'}));
 expect(screen.getByText('Correo electrónico no puede estar vacío.')).toBeTruthy();
 expect(request).not.toHaveBeenCalled();
});

it('toggles new password visibility without revealing the current password',async()=>{
 const signedOut=vi.fn();
 render(<AccountSecurity onSignedOut={signedOut}/>);
 const current=screen.getByLabelText('Contraseña actual') as HTMLInputElement;
 const newPassword=screen.getByLabelText('Nueva contraseña') as HTMLInputElement;
 const confirmation=screen.getByLabelText('Confirmar nueva contraseña') as HTMLInputElement;
 expect(current.type).toBe('password');
 expect(newPassword.type).toBe('password');
 await userEvent.click(screen.getByRole('button',{name:'Mostrar contraseñas'}));
 expect(newPassword.type).toBe('text');
 expect(confirmation.type).toBe('text');
 expect(current.type).toBe('password');
 await userEvent.click(screen.getByRole('button',{name:'Ocultar contraseñas'}));
 expect(newPassword.type).toBe('password');
 expect(confirmation.type).toBe('password');
 expect(request).not.toHaveBeenCalled();
 expect(signedOut).not.toHaveBeenCalled();
});

it('blocks password updates when confirmation differs and preserves the session',async()=>{
 const signedOut=vi.fn();
 render(<AccountSecurity onSignedOut={signedOut}/>);
 await userEvent.type(screen.getByLabelText('Contraseña actual'),'School-test-password-26');
 await userEvent.type(screen.getByLabelText('Nueva contraseña'),'New-school-password-26');
 await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'),'Different-school-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Actualizar contraseña y cerrar sesiones'}));
 expect(screen.getByRole('alert').textContent).toContain('Las contraseñas no coinciden.');
 expect(request).not.toHaveBeenCalled();
 expect(signedOut).not.toHaveBeenCalled();
});
