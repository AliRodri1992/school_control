// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationPopover,{notificationTime} from './NotificationPopover';

afterEach(cleanup);
const items=[
 {id:1,title:'Se actualizó una inscripción',page:'enrollments',read_at:null,created_at:'2026-10-25T10:00:00Z'},
 {id:2,title:'Hay una actualización de calificaciones',page:'grades',read_at:'2026-10-24T10:00:00Z',created_at:'2026-10-24T09:00:00Z'},
 {id:3,title:'Tienes un mensaje institucional',page:'messages',read_at:null,created_at:'2026-10-24T08:00:00Z'}
];
function show(options:Partial<Parameters<typeof NotificationPopover>[0]>={}){
 const onRead=vi.fn(),onReadAll=vi.fn(),onClose=vi.fn(),onViewAll=vi.fn();
 render(<NotificationPopover locale="es" items={items} unread={2} onRead={onRead}
  onReadAll={onReadAll} onClose={onClose} onViewAll={onViewAll} {...options}/>);
 return {onRead,onReadAll,onClose,onViewAll};
}
it('shows a school-branded header, unread status and dated notice rows',()=>{
 show();
 const panel=screen.getByRole('region',{name:'Notificaciones'});
 expect(within(panel).getByText('Novedades de tu comunidad escolar')).toBeTruthy();
 expect(panel.querySelector('.sc-np-status strong')?.textContent).toBe('2');
 expect(within(panel).getAllByRole('button',{name:/Abrir notificación:/})).toHaveLength(3);
 expect(panel.querySelectorAll('.sc-np-item.is-unread')).toHaveLength(2);
 expect(panel.querySelectorAll('.sc-np-unread-dot')).toHaveLength(2);
 expect(panel.querySelectorAll('time')).toHaveLength(3);
});
it('filters between all and unread without changing the original order',async()=>{
 show();
 await userEvent.click(screen.getByRole('tab',{name:'Sin leer 2'}));
 expect(screen.getByRole('tab',{name:'Sin leer 2'}).getAttribute('aria-selected')).toBe('true');
 expect(screen.getAllByRole('button',{name:/Abrir notificación:/})).toHaveLength(2);
 expect(screen.queryByText('Hay una actualización de calificaciones')).toBeNull();
 await userEvent.click(screen.getByRole('tab',{name:'Todas 3'}));
 expect(screen.getAllByRole('button',{name:/Abrir notificación:/})).toHaveLength(3);
});
it('supports reading, marking all, visiting the full center and closing',async()=>{
 const {onRead,onReadAll,onClose,onViewAll}=show();
 await userEvent.click(screen.getByRole('button',{name:'Abrir notificación: Se actualizó una inscripción'}));
 expect(onRead).toHaveBeenCalledWith(items[0]);
 await userEvent.click(screen.getByRole('button',{name:'Marcar todas como leídas'}));
 expect(onReadAll).toHaveBeenCalledOnce();
 await userEvent.click(screen.getByRole('button',{name:'Ir al centro de notificaciones'}));
 expect(onViewAll).toHaveBeenCalledOnce();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar notificaciones'}));
 expect(onClose).toHaveBeenCalledOnce();
});
it('blocks duplicated actions while busy and surfaces network errors',()=>{
 const {rerender}=render(<NotificationPopover locale="es" items={items} unread={2} busy
  error="Servidor no disponible" onRead={vi.fn()} onReadAll={vi.fn()} onClose={vi.fn()} onViewAll={vi.fn()}/>);
 expect(screen.getByRole('alert').textContent).toContain('Servidor no disponible');
 expect(screen.getByRole('button',{name:'Marcar todas como leídas'}).hasAttribute('disabled')).toBe(true);
 expect(screen.getAllByRole('button',{name:/Abrir notificación:/})[0].hasAttribute('disabled')).toBe(true);
 rerender(<NotificationPopover locale="es" items={[]} unread={0} loading onRead={vi.fn()}
  onReadAll={vi.fn()} onClose={vi.fn()} onViewAll={vi.fn()}/>);
 expect(screen.getByRole('status').textContent).toContain('Cargando notificaciones');
 expect(screen.queryByRole('button',{name:'Marcar todas como leídas'})).toBeNull();
});
it('explains an empty unread inbox without hiding navigation to the full center',async()=>{
 show({items:items.map(item=>({...item,read_at:'2026-10-25T11:00:00Z'})),unread:0});
 await userEvent.click(screen.getByRole('tab',{name:'Sin leer 0'}));
 expect(screen.getByText('Ya revisaste todas tus notificaciones')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Ir al centro de notificaciones'})).toBeTruthy();
});
it('supports English labels and handles invalid timestamps gracefully',()=>{
 show({locale:'en',items:[],unread:0});
 expect(screen.getByRole('region',{name:'Notifications'})).toBeTruthy();
 expect(screen.getByText('All caught up')).toBeTruthy();
 expect(screen.getByText('No recent notifications')).toBeTruthy();
 expect(notificationTime('not-a-date','es')).toBe('');
 expect(notificationTime(null,'en')).toBe('');
 expect(notificationTime('2026-10-25T10:00:00Z','en',Date.parse('2026-10-25T10:04:00Z'))).toContain('4');
});
