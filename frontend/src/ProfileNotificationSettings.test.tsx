// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileNotificationSettings from './ProfileNotificationSettings';
import {api} from './api';
import {notify} from './notifications';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
vi.mock('./shared/i18n/LocaleContext',()=>({useSchoolLocale:()=>({ui:(t:string)=>t})}));
const request=vi.mocked(api);
const saved={notification_school:true,notification_grades:true,notification_attendance:true,notification_events:true};
beforeEach(()=>{
 request.mockReset();vi.mocked(notify).mockReset();
 request.mockImplementation(async(path:string,method?:string,body?:any)=>{
  if(path==='preferences'&&method==='PATCH')return {...saved,...body};
  return {...saved};
 });
});
afterEach(cleanup);

it('loads four actual school notification categories and persists only chosen categories',async()=>{
 render(<ProfileNotificationSettings/>);
 await screen.findByRole('heading',{name:'Mis notificaciones'});
 expect(await screen.findByRole('switch',{name:'Calificaciones'})).toHaveProperty('checked',true);
 expect(screen.getByRole('switch',{name:'Asistencia'})).toHaveProperty('checked',true);
 expect(screen.getByRole('button',{name:'Guardar avisos'})).toHaveProperty('disabled',true);
 await userEvent.click(screen.getByRole('switch',{name:'Calificaciones'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar avisos'}));
 await waitFor(()=>expect(request).toHaveBeenCalledWith('preferences','PATCH',{
  notification_school:true,notification_grades:false,notification_attendance:true,notification_events:true
 }));
 expect(notify).toHaveBeenCalledOnce();
});

it('preserves unsaved notification categories if the server rejects the update',async()=>{
 request.mockImplementation(async(path:string,method?:string)=>{
  if(method==='PATCH')throw new Error('No se pudo guardar.');
  return {...saved};
 });
 render(<ProfileNotificationSettings/>);
 await userEvent.click(await screen.findByRole('switch',{name:'Asistencia'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar avisos'}));
 expect((await screen.findByRole('alert')).textContent).toContain('No se pudo guardar');
 expect(screen.getByRole('switch',{name:'Asistencia'})).toHaveProperty('checked',false);
 expect(notify).not.toHaveBeenCalled();
});
