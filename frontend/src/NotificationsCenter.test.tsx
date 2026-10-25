// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Notifications from './NotificationsCenter';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(v:string)=>v,locale:'es'})}));
afterEach(cleanup);
const notices=[{id:1,title:'Reunión de bienvenida',page:'calendar_events',read_at:null,created_at:'2026-10-25T10:00:00Z'},
 {id:2,title:'Calificaciones disponibles',page:'grades',read_at:'2026-10-25T11:00:00Z',created_at:'2026-10-24T09:00:00Z'}];
it('renders all, unread and read filters and searches notifications',async()=>{
 vi.mocked(api).mockResolvedValue({items:notices,unread_count:1});
 render(<Notifications navigate={vi.fn()}/>);
 await screen.findByText('Reunión de bienvenida');
 expect(screen.getByText('Calificaciones disponibles')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Sin leer 1'}));
 expect(screen.queryByText('Calificaciones disponibles')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Leídas 1'}));
 expect(screen.getByText('Calificaciones disponibles')).toBeTruthy();
 await userEvent.type(screen.getByPlaceholderText('Buscar notificaciones...'),'nada');
 expect(screen.getByText('No encontramos coincidencias')).toBeTruthy();
});
it('marks every notification as read using the existing API',async()=>{
 vi.mocked(api).mockImplementation(async(path:string)=>path==='notifications/read_all'?{}:{items:notices,unread_count:1});
 render(<Notifications navigate={vi.fn()}/>);
 await screen.findByText('Reunión de bienvenida');
 await userEvent.click(screen.getByRole('button',{name:'Marcar todas como leídas'}));
 await waitFor(()=>expect(api).toHaveBeenCalledWith('notifications/read_all','POST'));
});
it('opens a notification and navigates to its destination',async()=>{
 vi.mocked(api).mockResolvedValue({items:notices,unread_count:1});
 const navigate=vi.fn();
 render(<Notifications navigate={navigate}/>);
 await screen.findByText('Reunión de bienvenida');
 await userEvent.click(screen.getByRole('button',{name:/Reunión de bienvenida/}));
 await waitFor(()=>expect(api).toHaveBeenCalledWith('notifications/1/read','POST'));
 expect(navigate).toHaveBeenCalledWith('calendar_events');
});
