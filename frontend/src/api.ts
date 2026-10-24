let csrf = '';

type ApiError = Error & {status?:number;fieldErrors?:Record<string,string[]>};

function apiError(message:string,status?:number,fieldErrors?:Record<string,string[]>):ApiError {
  return Object.assign(new Error(message),{status,fieldErrors});
}

function unexpectedResponse(path:string,status:number):ApiError {
  return apiError(
    'El servidor no devolvió una respuesta JSON para /api/'+path+' (HTTP '+status+'). '+
    'Comprueba que abriste School Control en el puerto configurado (predeterminado http://localhost:5173). '+
    'Revisa el error original del backend con: docker compose logs --tail=100 backend. '+
    'Comprueba también docker compose ps.',
    status
  );
}

export async function api(path:string,method='GET',data?:unknown):Promise<any> {
  const multipart=data instanceof FormData;
  let response:Response;
  try {
    response=await fetch('/api/'+path,{
      method,credentials:'same-origin',
      headers:{Accept:'application/json',...(multipart?{}:{'Content-Type':'application/json'}),'X-CSRF-Token':csrf},
      body:data?(multipart?data:JSON.stringify(data)):undefined
    });
  } catch {
    throw apiError('No se pudo conectar con la API de School Control. Comprueba que los servicios frontend y backend estén encendidos mediante docker compose ps.');
  }

  if(response.status===204)return null;

  // API routes must never return a React index page or a Rails HTML exception.
  // Do not reveal raw HTML or debug traces on the login screen.
  const type=response.headers.get('content-type')?.toLowerCase()||'';
  if(!type.includes('application/json')&&!type.includes('+json')){
    throw unexpectedResponse(path,response.status);
  }

  let result:any;
  try {
    result=await response.json();
    if(result===null||typeof result!=='object')throw new Error('Invalid JSON response');
  } catch {
    throw unexpectedResponse(path,response.status);
  }

  if(!Array.isArray(result)&&typeof result.csrf_token==='string')csrf=result.csrf_token;
  if(!response.ok){
    const fields=!Array.isArray(result) && result.errors && typeof result.errors==='object' && !Array.isArray(result.errors)
      ? result.errors as Record<string,string[]> : undefined;
    throw apiError(typeof result.error==='string'?result.error:'No se pudo completar la operación.',response.status,fields);
  }
  return result;
}
export const timeLabel = (minute: number) => `${Math.floor(minute / 60).toString().padStart(2, '0')}:${(minute % 60).toString().padStart(2, '0')}`;
export const mean = (values: number[]) => values.length ? (values.reduce((a,b) => a+b,0)/values.length).toFixed(1) : '—';
