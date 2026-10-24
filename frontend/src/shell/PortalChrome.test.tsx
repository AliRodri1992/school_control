// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PortalChrome} from './PortalChrome';

vi.mock('../api',()=>({api:vi.fn(async(path:string)=>{
 if(path==='languages')return [{id:1,code:'es',name:'Español',native_name:'Español',status:'active',text_direction:'ltr'},
  {id:2,code:'en',name:'English',native_name:'English',status:'active',text_direction:'ltr'}];
 if(path==='preferences')return {locale:'es',theme:'light'};
 if(path.includes('/bundle'))return {translations:{}};
 if(path==='notifications')return {unread_count:0,items:[]};
 return {};
})}));
afterEach(cleanup);
const user={id:15,name:'María González',email:'maria@example.test',role:'admin'};
const props={user,school:{name:'Primaria Hidalgo',logo_url:'/logo.svg',timezone:'America/Mexico_City'},
 page:'dashboard',mobile:false,onMobile:vi.fn(),can:()=>true,pendingAdmissions:0,
 onNavigate:vi.fn(),onSignOut:vi.fn(async()=>undefined)};
it('shows the school brand, removes sidebar search, and uses a language dropdown',()=>{
 render(<PortalChrome {...props}><div>Página</div></PortalChrome>);
 expect(screen.getByRole('button',{name:'Ir al inicio de Primaria Hidalgo'})).toBeTruthy();
 expect(screen.queryByRole('searchbox',{name:'Buscar módulos'})).toBeNull();
 expect(screen.getByRole('combobox',{name:'Idioma'})).toBeTruthy();
 expect(screen.getAllByRole('button',{name:'Opciones de cuenta de María González'})).toHaveLength(2);
});
it('makes logout and preferences accessible from the sidebar avatar and topbar avatar',async()=>{
 const signingOut=vi.fn(async()=>undefined);
 render(<PortalChrome {...props} onSignOut={signingOut}><div>Página</div></PortalChrome>);
 const account=screen.getAllByRole('button',{name:'Opciones de cuenta de María González'});
 await userEvent.click(account[0]);
 expect(screen.getByRole('button',{name:'Preferencias'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 await userEvent.click(account[1]);
 expect(screen.getByRole('button',{name:'Cerrar sesión'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Cerrar sesión'}));
 expect(signingOut).toHaveBeenCalledOnce();
});
