import type {Row} from '../../modules';

export type ModuleLoadError = {message:string;status?:number};
export type PortalCollections = {
  data:Record<string,Row[]>;
  errors:Record<string,ModuleLoadError>;
};

/**
 * A failing endpoint must not discard records returned by unrelated modules.
 * Only an actual, successful empty array represents "no records".
 */
export async function loadPortalCollections(
  keys:readonly string[],
  request:(key:string)=>Promise<unknown>
):Promise<PortalCollections> {
  const results=await Promise.allSettled(keys.map(key=>request(key)));
  const data:Record<string,Row[]>={};
  const errors:Record<string,ModuleLoadError>={};

  results.forEach((result,index)=>{
    const key=keys[index];
    if(result.status==='fulfilled'&&Array.isArray(result.value)){
      data[key]=result.value as Row[];
      return;
    }

    const reason:unknown=result.status==='rejected'
      ?result.reason:new Error('La API devolvió un formato inesperado para '+key+'.');
    const message=reason instanceof Error?reason.message:'No fue posible consultar este módulo.';
    const status=reason&&typeof reason==='object'&&'status' in reason
      ?(reason as {status?:unknown}).status:undefined;
    errors[key]={message,...(typeof status==='number'?{status}:{})};
  });
  return {data,errors};
}
