import type {Row} from '../../modules';
import {loadPortalCollections,type ModuleLoadError} from './loadPortalCollections';

export type PortalSnapshot={
 data:Record<string,Row[]>;
 errors:Record<string,ModuleLoadError>;
 summary:Row;
 summaryError:string|null;
};

/** Reuse the same authorized hydration after login and when restoring an existing session. */
export async function loadPortalSnapshot(
 user:Row,
 request:(path:string)=>Promise<unknown>,
 moduleKeys:readonly string[]
):Promise<PortalSnapshot>{
 const keys=moduleKeys.filter(key=>!!user.permissions?.[`${key}.index`]?.length);
 if(user.permissions?.['schedule_slots.index']?.length&&!keys.includes('schedule_slots'))keys.push('schedule_slots');
 const loaded=await loadPortalCollections(keys,request);
 if(!user.permissions?.['dashboard.show']?.length){
   return {...loaded,summary:{},summaryError:null};
 }
 try{
   const summary=await request('dashboard');
   if(!summary||typeof summary!=='object'||Array.isArray(summary)){
     throw new Error('La API devolvió un resumen no válido.');
   }
   return {...loaded,summary:summary as Row,summaryError:null};
 }catch(cause){
   const reason=cause instanceof Error?cause.message:'No se pudo consultar el resumen.';
   return {...loaded,summary:{},summaryError:'No se pudo cargar el resumen: '+reason};
 }
}
