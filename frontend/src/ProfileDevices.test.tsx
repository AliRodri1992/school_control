// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDevices from './ProfileDevices';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(text:string)=>text,locale:'es'})}));
const request=vi.mocked(api);
beforeEach(()=>{
 request.mockReset();
 request.mockImplementation(async(path:string,method?:string)=>{
  if(path==='profile/devices'&&!method)return {devices:[
   {id:1,name:'Chrome · macOS',last_seen_at:'2026-10-25T15:00:00Z',created_at:'2026-10-25T15:00:00Z',current:true},
   {id:2,name:'Firefox · Windows',last_seen_at:'2026-10-25T14:00:00Z',created_at:'2026-10-25T14:00:00Z',current:false}
  ]};
  if(path==='profile/devices/2')return {signed_out:false,message:'Cerrada'};
  return {signed_out:true};
 });
});
afterEach(cleanup);

it('lists actual sessions and revokes another device after password confirmation',async()=>{
 const onSignedOut=vi.fn();
 render(<ProfileDevices onSignedOut={onSignedOut}/>);
 expect(await screen.findByText('Firefox · Windows')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar sesión en Firefox · Windows'}));
 await userEvent.type(screen.getByLabelText('Confirma tu contraseña para cerrar esta sesión'),'Current-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Confirmar cierre'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile/devices/2','DELETE',{
  current_password:'Current-password-26'
 }));
 await waitFor(()=>expect(screen.queryByText('Firefox · Windows')).toBeNull());
 expect(onSignedOut).not.toHaveBeenCalled();
});

it('signs out the browser if its own session was revoked',async()=>{
 const onSignedOut=vi.fn();
 render(<ProfileDevices onSignedOut={onSignedOut}/>);
 await screen.findByText('Chrome · macOS');
 await userEvent.click(screen.getByRole('button',{name:'Cerrar sesión en Chrome · macOS'}));
 await userEvent.type(screen.getByLabelText('Confirma tu contraseña para cerrar esta sesión'),'Current-password-26');
 await userEvent.click(screen.getByRole('button',{name:'Confirmar cierre'}));
 await waitFor(()=>expect(onSignedOut).toHaveBeenCalledOnce());
});
