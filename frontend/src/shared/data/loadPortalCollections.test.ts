import {expect,it,vi} from 'vitest';
import {loadPortalCollections} from './loadPortalCollections';

it('keeps student records even when a different API fails',async()=>{
  const request=vi.fn(async(key:string)=>{
    if(key==='students')return [{id:1,first_name:'Alex',last_name:'Ejemplo'}];
    if(key==='groups')throw Object.assign(new Error('No fue posible consultar grupos'),{status:500});
    return [];
  });

  const result=await loadPortalCollections(['students','groups','subjects'],request);
  expect(result.data.students).toHaveLength(1);
  expect(result.data.students[0].first_name).toBe('Alex');
  expect(result.data.subjects).toEqual([]);
  expect(result.data.groups).toBeUndefined();
  expect(result.errors.students).toBeUndefined();
  expect(result.errors.groups).toEqual({message:'No fue posible consultar grupos',status:500});
  expect(request).toHaveBeenCalledTimes(3);
});

it('does not mistake a failed students request for an empty collection',async()=>{
  const request=vi.fn(async()=>{throw Object.assign(new Error('Acceso denegado'),{status:403});});
  const result=await loadPortalCollections(['students'],request);
  expect(result.data.students).toBeUndefined();
  expect(result.errors.students).toEqual({message:'Acceso denegado',status:403});
});

it('accepts a genuinely empty list and rejects malformed responses',async()=>{
  const result=await loadPortalCollections(['students','courses'],async key=>key==='students'?[]:{items:[]});
  expect(result.data.students).toEqual([]);
  expect(result.errors.students).toBeUndefined();
  expect(result.data.courses).toBeUndefined();
  expect(result.errors.courses.message).toContain('formato inesperado');
});
