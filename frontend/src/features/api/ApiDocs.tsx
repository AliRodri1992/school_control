import {useEffect,useMemo,useState} from 'react';
import {BookOpen,ChevronDown,Code2,Filter,Search,ShieldCheck} from 'lucide-react';
import {api} from '../../api';

type Operation={summary?:string;tags?:string[];description?:string;operationId?:string;security?:unknown[];
 parameters?:unknown[];requestBody?:unknown;responses?:Record<string,unknown>;'x-rbac-permission'?:string|string[]};
type Contract={openapi:string;info:{title:string;version:string;description?:string};paths:Record<string,Record<string,Operation>>};
const verbs=['get','post','put','patch','delete'];
const colors:Record<string,string>={get:'#23775e',post:'#405cf5',put:'#9657d6',patch:'#b27017',delete:'#c03652'};
export default function ApiDocs(){
 const [contract,setContract]=useState<Contract|null>(null),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[tag,setTag]=useState(''),[selected,setSelected]=useState('');
 useEffect(()=>{let mounted=true;void api('docs').then(v=>{if(mounted)setContract(v);}).catch(e=>{if(mounted)setError((e as Error).message);});return()=>{mounted=false;};},[]);
 const entries=useMemo(()=>contract?Object.entries(contract.paths).flatMap(([path,methods])=>Object.entries(methods)
 .filter(([verb])=>verbs.includes(verb)).map(([verb,operation])=>({path,verb,operation}))):[],[contract]);
 const tags=[...new Set(entries.flatMap(item=>item.operation.tags||[]))].sort();
 const visible=entries.filter(item=>(!tag||item.operation.tags?.includes(tag))&&
  (item.path+' '+(item.operation.summary||'')+' '+(item.operation.operationId||'')+' '+(item.operation['x-rbac-permission']||'')).toLowerCase().includes(query.toLowerCase()));
 return <section className="sc-api-docs">
  <div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN / DESARROLLADORES</span><h1>Documentación de la API</h1>
   <p>Contrato OpenAPI local con autenticación y requisitos de permisos por operación.</p></div></div>
  {error&&<div role="alert" className="error">{error}</div>}
  {!contract&&!error&&<p>Cargando contrato OpenAPI…</p>}
  {contract&&<><div className="panel sc-api-summary"><div><Code2 size={22}/><strong>{contract.info.title}</strong><span>OpenAPI {contract.openapi} · Versión {contract.info.version}</span></div>
   <p>{entries.length} operaciones en {Object.keys(contract.paths).length} rutas. Algunos cuerpos de solicitud y respuesta todavía requieren esquemas detallados.</p>
  </div>
  <div className="sc-api-search">
   <label><Search size={17}/><input aria-label="Buscar rutas de la API" value={query} placeholder="Buscar endpoint o permiso…" onChange={e=>setQuery(e.target.value)}/></label>
   <label><Filter size={17}/><select aria-label="Filtrar área" value={tag} onChange={e=>setTag(e.target.value)}><option value="">Todas las áreas</option>{tags.map(v=><option key={v}>{v}</option>)}</select></label>
  </div>
  <div className="sc-api-operations">{visible.map(({path,verb,operation})=>{
   const key=verb+':'+path,expanded=selected===key;
   return <article className="sc-api-operation" key={key}>
    <button type="button" aria-expanded={expanded} className="sc-api-operation-button" onClick={()=>setSelected(expanded?'':key)}>
     <strong className="sc-api-verb" style={{color:colors[verb]||'#405cf5'}}>{verb.toUpperCase()}</strong>
     <code>{path}</code><span>{operation.summary}</span><ChevronDown size={16}/></button>
    {expanded&&<div className="sc-api-details">
     <p>{operation.description||'Operación documentada en el contrato Rails.'}</p>
     {operation['x-rbac-permission']&&<p><ShieldCheck size={15}/> Permiso: <code>{String(operation['x-rbac-permission'])}</code></p>}
     <p>{operation.security?.length?'Requiere sesión autenticada.':'Operación pública o autenticación de sesión.'}</p>
     {operation.parameters&&<details><summary>Parámetros</summary><pre>{JSON.stringify(operation.parameters,null,2)}</pre></details>}
     {operation.requestBody&&<details><summary>Cuerpo de solicitud</summary><pre>{JSON.stringify(operation.requestBody,null,2)}</pre></details>}
     <details open><summary>Respuestas HTTP</summary><pre>{JSON.stringify(operation.responses||{},null,2)}</pre></details>
    </div>}
   </article>;
  })}</div>
  {!visible.length&&<div className="panel sc-api-empty"><BookOpen size={24}/>No hay endpoints coincidentes.</div>}
  </>}
 </section>;
}
