// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessRoles from './AccessRoles';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));vi.mock('./notifications',()=>({notify:vi.fn()}));
const data={roles:[],users:[],catalog:[{key:'grades.index',scopes:['institution','assigned']},{key:'grades.create',scopes:['institution','assigned']}]};
beforeEach(()=>vi.mocked(api).mockReset().mockResolvedValue(data));afterEach(cleanup);
it('saves permission switches together with the required module access',async()=>{
 const changed=vi.fn().mockResolvedValue(undefined);render(<AccessRoles can={()=>true} onChanged={changed}/>);
 await waitFor(()=>expect(api).toHaveBeenCalledWith('access_roles'));
 await userEvent.click(screen.getByRole('button',{name:'Crear rol'}));
 await userEvent.type(screen.getByLabelText('Nombre del rol'),'Evaluación');
 await userEvent.type(screen.getByLabelText('Buscar permiso'),'Calificaciones');
 await userEvent.click(screen.getByRole('switch',{name:'Crear'}));
 expect(screen.getByRole('switch',{name:'Acceder y listar'})).toHaveProperty('checked',true);
 await userEvent.selectOptions(screen.getByLabelText('Ámbito grades.create'),'assigned');
 await userEvent.click(screen.getByRole('button',{name:'Guardar permisos'}));
 await waitFor(()=>expect(changed).toHaveBeenCalledOnce());
 expect(api).toHaveBeenCalledWith('access_roles','POST',expect.objectContaining({name:'Evaluación',permissions:expect.arrayContaining([{key:'grades.create',data_scope:'assigned'},{key:'grades.index',data_scope:'institution'}])}));
});
it('does not offer mutations without the matching permission',async()=>{
 render(<AccessRoles can={()=>false} onChanged={vi.fn()}/>);
 await waitFor(()=>expect(api).toHaveBeenCalled());
 expect(screen.queryByRole('button',{name:'Crear rol'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Guardar asignación'})).toBeNull();
});
