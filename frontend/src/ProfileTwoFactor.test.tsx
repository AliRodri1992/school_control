// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileTwoFactor from './ProfileTwoFactor';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(s:string)=>s})}));
afterEach(cleanup);
it('shows an authenticator setup and one-time recovery codes only after server confirmation',async()=>{
 const request=vi.mocked(api);request.mockReset();
 request.mockImplementation(async path=>{
  if(path==='profile/two_factor')return {enabled:false};
  if(path==='profile/two_factor/setup')return {secret:'ABCDEF234567',provisioning_uri:'otpauth://totp/SchoolControl?secret=ABCDEF234567'};
  return {enabled:true,recovery_codes:['ABCD1234','EFGH5678']};
 });
 render(<ProfileTwoFactor onSignedOut={vi.fn()}/>);
 expect(await screen.findByText('Protección no activada')).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Contraseña actual'),'Sample-account-phrase');
 await userEvent.click(screen.getByRole('button',{name:'Configurar autenticador'}));
 expect(await screen.findByText('ABCDEF234567')).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Código de seis dígitos'),'123456');
 await userEvent.click(screen.getByRole('button',{name:'Activar verificación en dos pasos'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile/two_factor/confirm','POST',{code:'123456'}));
 expect(await screen.findByText('ABCD1234')).toBeTruthy();
});
