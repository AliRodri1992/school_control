// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDevices from './ProfileDevices';
import {api} from './api';
import {confirmDanger} from './notifications';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({confirmDanger:vi.fn(),notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(s:string)=>s})}));
afterEach(cleanup);
it('shows devices and revokes another session after password confirmation',async()=>{
 const request=vi.mocked(api);
 request.mockReset();
 request.mockImplementation(async (path:string)=>path==='profile/devices'?{devices:[
  {id:1,name:'Chrome · macOS',current:true,last_seen_at:'2026-10-25T10:00:00Z'},
  {id:2,name:'Firefox · Windows',current:false,last_seen_at:'2026-10-25T09:00:00Z'}]}:{signed_out:false,message:'Sesión cerrada'});
 vi.mocked(confirmDanger).mockResolvedValue(true);
 render(<ProfileDevices onSignedOut={vi.fn()}/>);
 expect(await screen.findByText('Firefox · Windows')).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Contraseña para cerrar un dispositivo'),'A-valid-passphrase');
 await userEvent.click(screen.getAllByRole('button',{name:'Cerrar sesión'})[1]);
 await waitFor(()=>expect(request).toHaveBeenCalledWith('profile/devices/2','DELETE',{current_password:'A-valid-passphrase'}));
 expect(screen.queryByText('Firefox · Windows')).toBeNull();
});

it('does not revoke a session when the user cancels the confirmation',async()=>{
 const request=vi.mocked(api);request.mockReset();
 request.mockImplementation(async path=>path==='profile/devices'?{devices:[
  {id:1,name:'Chrome · macOS',current:true,last_seen_at:'2026-10-25T10:00:00Z'},
  {id:2,name:'Firefox · Windows',current:false,last_seen_at:'2026-10-25T09:00:00Z'}
 ]}:{signed_out:false,message:'Sesión cerrada'});
 vi.mocked(confirmDanger).mockReset();
 vi.mocked(confirmDanger).mockResolvedValue(false);
 const signOut=vi.fn();
 render(<ProfileDevices onSignedOut={signOut}/>);
 await screen.findByText('Firefox · Windows');
 await userEvent.type(screen.getByLabelText('Contraseña para cerrar un dispositivo'),'Sample-passphrase');
 await userEvent.click(screen.getAllByRole('button',{name:'Cerrar sesión'})[1]);
 await waitFor(()=>expect(confirmDanger).toHaveBeenCalledOnce());
 expect(request.mock.calls.filter(([path])=>String(path).startsWith('profile/devices/') )).toHaveLength(0);
 expect(screen.getByText('Firefox · Windows')).toBeTruthy();
 expect(signOut).not.toHaveBeenCalled();
});
