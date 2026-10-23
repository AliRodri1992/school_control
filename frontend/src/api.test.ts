import {describe,it,expect,vi} from 'vitest';
import {api,timeLabel,mean} from './api';
describe('academic display',()=>{
 it('renders school periods without losing zero minutes',()=>{expect(timeLabel(480)).toBe('08:00');expect(timeLabel(530)).toBe('08:50');});
 it('does not invent a grade when there are no marks',()=>{expect(mean([])).toBe('—');});
 it('calculates the displayed average',()=>{expect(mean([8,9,10])).toBe('9.0');});
});


it('preserves structured validation errors for each field',async()=>{
 const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce(
   new Response(JSON.stringify({error:'Revisa la información.',errors:{email:['ya está registrado']}}),
     {status:422,headers:{'Content-Type':'application/json'}}));
 try {
   await expect(api('registration','POST',{email:'test@example.com'})).rejects.toMatchObject({
     message:'Revisa la información.',
     fieldErrors:{email:['ya está registrado']}
   });
 } finally {fetcher.mockRestore();}
});
