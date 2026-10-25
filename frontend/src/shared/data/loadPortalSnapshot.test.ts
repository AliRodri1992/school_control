import {describe,expect,it,vi} from 'vitest';
import {loadPortalSnapshot} from './loadPortalSnapshot';

describe('portal session hydration',()=>{
 it('loads authorized collections and dashboard before the portal can be shown',async()=>{
   const request=vi.fn(async(path:string)=>{
     if(path==='students')return [{id:1,name:'Estudiante'}];
     if(path==='dashboard')return {students:1};
     throw new Error('Unexpected '+path);
   });
   const snapshot=await loadPortalSnapshot({
     id:1,permissions:{'students.index':['institution'],'dashboard.show':['institution']}
   },request,['students','users']);
   expect(request.mock.calls.map(([path])=>path)).toEqual(['students','dashboard']);
   expect(snapshot.data.students).toHaveLength(1);
   expect(snapshot.summary).toEqual({students:1});
   expect(snapshot.summaryError).toBeNull();
 });
 it('does not request dashboard or collections without permission',async()=>{
   const request=vi.fn();
   const snapshot=await loadPortalSnapshot({permissions:{}},request,['students','users']);
   expect(request).not.toHaveBeenCalled();
   expect(snapshot).toEqual({data:{},errors:{},summary:{},summaryError:null});
 });
 it('fetches schedules once, even if the module list contains them',async()=>{
   const request=vi.fn(async()=>[]);
   await loadPortalSnapshot({permissions:{'schedule_slots.index':['institution']}},request,['schedule_slots','students']);
   expect(request).toHaveBeenCalledTimes(1);
   expect(request).toHaveBeenCalledWith('schedule_slots');
 });
 it('keeps available collections if a module or dashboard endpoint fails',async()=>{
   const request=vi.fn(async(path:string)=>{
     if(path==='students')return [{id:7}];
     throw new Error('Sin conexión');
   });
   const snapshot=await loadPortalSnapshot({
     permissions:{'students.index':['institution'],'users.index':['institution'],'dashboard.show':['institution']}
   },request,['students','users']);
   expect(snapshot.data.students).toEqual([{id:7}]);
   expect(snapshot.errors.users.message).toBe('Sin conexión');
   expect(snapshot.summary).toEqual({});
   expect(snapshot.summaryError).toBe('No se pudo cargar el resumen: Sin conexión');
 });
 it('rejects malformed dashboard responses without discarding module data',async()=>{
   const request=vi.fn(async(path:string)=>path==='dashboard'?null:[]);
   const snapshot=await loadPortalSnapshot({
     permissions:{'students.index':['institution'],'dashboard.show':['institution']}
   },request,['students']);
   expect(snapshot.data.students).toEqual([]);
   expect(snapshot.summaryError).toContain('resumen no válido');
 });
});
