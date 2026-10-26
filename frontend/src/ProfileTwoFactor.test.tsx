// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileTwoFactor from './ProfileTwoFactor';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(text:string)=>text})}));
const request=vi.mocked(api);
beforeEach(()=>{
 request.mockReset();
 request.mockImplementation(async(path:string)=>{
  if(path==='profile/two_factor')return {enabled:false};
  if(path==='profile/two_factor/setup')return {secret:'ABCDEFGHIJKLMNOP',provisioning_uri:'otpauth://totp/example'};
  if(path==='profile/two_factor/confirm')return {enabled:true,recovery_codes:['AAAA111111','BBBB222222']};
  return {};
 });
});
afterEach(cleanup);

it('requires a password, confirms an authenticator code and displays one-time recovery codes',async()=>{
 render(<ProfileTwoFactor onSignedOut={vi.fn()}/>);
 await screen.findByText('Protección adicional desactivada');
 await userEvent.type(screen.getByLabelText('Contraseña actual'),'Current-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Configurar segundo factor'}));
 expect(await screen.findByText('ABCDEFGHIJKLMNOP')).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Código de seis dígitos'),'123456');
 await userEvent.click(screen.getByRole('button',{name:'Confirmar y activar'}));
 expect(await screen.findByText('AAAA111111')).toBeTruthy();
 expect(screen.getByText('BBBB222222')).toBeTruthy();
 expect(request).toHaveBeenCalledWith('profile/two_factor/confirm','POST',{code:'123456'});
});
