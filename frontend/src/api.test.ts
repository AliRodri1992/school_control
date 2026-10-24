// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {api} from './api';

afterEach(()=>vi.unstubAllGlobals());

it('requests same-origin session data as JSON',async()=>{
 const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({user:null,csrf_token:'example'}),{
  status:200,headers:{'Content-Type':'application/json; charset=utf-8'}
 }));
 vi.stubGlobal('fetch',fetch);
 expect(await api('session')).toEqual({user:null,csrf_token:'example'});
 expect(fetch).toHaveBeenCalledWith('/api/session',expect.objectContaining({
  method:'GET',credentials:'same-origin',headers:expect.objectContaining({Accept:'application/json'})
 }));
});

it('preserves correct Rails JSON authentication errors',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(
  JSON.stringify({error:'Correo o contraseña incorrectos'}),{status:401,headers:{'Content-Type':'application/json'}}
 )));
 await expect(api('session','POST',{email:'test@example.test',password:'incorrect'}))
  .rejects.toMatchObject({message:'Correo o contraseña incorrectos',status:401});
});

it('identifies an HTML proxy response without leaking markup',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<!DOCTYPE html><html>Rails exception</html>',{
  status:502,headers:{'Content-Type':'text/html'}
 })));
 await expect(api('session','POST',{})).rejects.toMatchObject({
  message:expect.stringContaining('/api/session (HTTP 502)'),status:502
 });
 await expect(api('session')).rejects.not.toThrow(/Unexpected token|<!DOCTYPE|Rails exception/);
});

it('detects HTML even when mislabeled as application/json',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<!DOCTYPE html>',{
  status:200,headers:{'Content-Type':'application/json'}
 })));
 await expect(api('school')).rejects.toThrow('/api/school (HTTP 200)');
});

it('explains when the API container is not reachable',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
 await expect(api('session')).rejects.toThrow('No se pudo conectar con la API');
});

it('accepts an empty successful response for delete actions',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:204})));
 expect(await api('session','DELETE')).toBeNull();
});


it('accepts a valid JSON array returned by list endpoints',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([{id:1,name:'Contacto familiar'}]),{
  status:200,headers:{'Content-Type':'application/json; charset=utf-8'}
 })));
 await expect(api('student_contacts')).resolves.toEqual([{id:1,name:'Contacto familiar'}]);
});

it('accepts empty JSON arrays returned by list endpoints',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('[]',{
  status:200,headers:{'Content-Type':'application/json'}
 })));
 await expect(api('student_contacts')).resolves.toEqual([]);
});
