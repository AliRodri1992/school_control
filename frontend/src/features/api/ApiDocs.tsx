import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import {useEffect,useMemo,useState} from 'react';
import {BookOpen,ChevronDown,Code2,Search,ShieldCheck,Layers3,Route,LockKeyhole,RefreshCcw} from 'lucide-react';
import {api} from '../../api';
import {apiSections,apiSectionCounts,filterApiEntries,apiSectionFor} from './apiSections';
import ApiRequestReference from './ApiRequestReference';
import type {Schemas} from './apiSchema';
type Operation={summary?:string;tags?:string[];description?:string;operationId?:string;security?:unknown[];parameters?:unknown[];requestBody?:unknown;responses?:Record<string,unknown>;'x-rbac-permission'?:string|string[]};
type Contract={openapi:string;info:{title:string;version:string;description?:string};paths:Record<string,Record<string,Operation>>;components?:{schemas?:Schemas}};
const verbs=['get','post','put','patch','delete'];
export default function ApiDocs(){
 const {ui}=useSchoolLocale();
 const [contract,setContract]=useState<Contract|null>(null),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[section,setSection]=useState('all'),[selected,setSelected]=useState('');
 const [loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError('');try{setContract(await api('docs'));}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const entries=useMemo(()=>contract?Object.entries(contract.paths).flatMap(([path,methods])=>Object.entries(methods)
  .filter(([verb])=>verbs.includes(verb)).map(([verb,operation])=>({path,verb,operation}))):[],[contract]);
 const counts=useMemo(()=>apiSectionCounts(entries),[entries]);
 const visible=useMemo(()=>filterApiEntries(entries,section,query),[entries,section,query]);
 const selectedSection=apiSections.find(x=>x.id===section)||apiSections[0];
 const sections=section==='all'?apiSections.filter(x=>x.id!=='all'&&counts[x.id]):[selectedSection];
 return <section className="sc-api-docs">
  <header className="sc-api-hero"><div><span className="eyebrow">{ui('ADMINISTRACIÓN / DESARROLLADORES')}</span>
   <h1>{ui('Documentación de la API')}</h1><p>{ui('Explora las operaciones por área del sistema, sus permisos y las respuestas del contrato OpenAPI.')}</p></div><Code2 size={45} aria-hidden="true"/></header>
  {error&&<div role="alert" className="sc-api-error">{error}<button type="button" className="secondary" onClick={()=>void load()}><RefreshCcw size={15}/>{ui('Reintentar')}</button></div>}
  {loading&&!contract&&<p role="status">{ui('Cargando contrato OpenAPI…')}</p>}
  {contract&&<><div className="sc-api-metrics"><article><Layers3 size={20}/><span>{ui('Áreas funcionales')}</span><strong>{apiSections.length-1}</strong></article>
   <article><Route size={20}/><span>{ui('Rutas documentadas')}</span><strong>{Object.keys(contract.paths).length}</strong></article>
   <article><Code2 size={20}/><span>{ui('Operaciones')}</span><strong>{entries.length}</strong></article>
   <article><LockKeyhole size={20}/><span>OpenAPI</span><strong className="sc-api-version">{contract.openapi}</strong></article></div>
   <div className="sc-api-workspace"><nav className="sc-api-sidebar" aria-label={ui('Secciones de la API')}>
    <div className="sc-api-sidebar-heading">{ui('EXPLORAR POR ÁREA')}</div>
    {apiSections.map(item=><button key={item.id} type="button" aria-current={section===item.id?'page':undefined} onClick={()=>{setSection(item.id);setSelected('');}}>
     <span>{ui(item.title)}</span><small>{counts[item.id]||0}</small></button>)}
   </nav>
   <div className="sc-api-main"><div className="sc-api-main-heading"><div><span>{ui('REFERENCIA DE ENDPOINTS')}</span><h2>{ui(selectedSection.title)}</h2><p>{ui(selectedSection.description)}</p></div><span className="sc-api-result-count">{visible.length} {ui('operaciones')}</span></div>
    <label className="sc-api-search-field"><Search size={18}/><input aria-label={ui('Buscar rutas de la API')} value={query} placeholder={ui('Buscar ruta, método, descripción o permiso…')} onChange={e=>{setQuery(e.target.value);setSelected('');}}/></label>
    {sections.map(group=>{const groupEntries=visible.filter(entry=>apiSectionFor(entry.operation.tags)===group.id);if(!groupEntries.length)return null;
     return <section className="sc-api-group" key={group.id}><header><h3>{ui(group.title)}</h3><span>{groupEntries.length}</span></header>
      <div className="sc-api-operations">{groupEntries.map(({path,verb,operation})=>{
       const key=verb+':'+path,expanded=selected===key;
       return <article className="sc-api-operation" key={key}>
        <button type="button" aria-expanded={expanded} className="sc-api-operation-button" onClick={()=>setSelected(expanded?'':key)}>
         <strong className={'sc-api-verb sc-api-verb-'+verb}>{verb.toUpperCase()}</strong>
         <code>{path}</code><span>{operation.summary||ui('Operación documentada')}</span><ChevronDown className={expanded?'is-open':''} size={17}/></button>
        {expanded&&<div className="sc-api-details"><p>{operation.description||ui('Operación documentada en el contrato Rails.')}</p>
         {operation['x-rbac-permission']&&<div className="sc-api-permission"><ShieldCheck size={16}/><strong>{ui('Permiso requerido')}</strong><code>{String(operation['x-rbac-permission'])}</code></div>}
         <p><LockKeyhole size={15}/>{operation.security?.length?ui('Requiere sesión autenticada.'):ui('Consulta el contrato para verificar el mecanismo de autenticación.')}</p>
         <ApiRequestReference body={operation.requestBody} parameters={operation.parameters} schemas={contract.components?.schemas||{}}/>
         <details open><summary>{ui('Respuestas HTTP')}</summary><pre>{JSON.stringify(operation.responses||{},null,2)}</pre></details>
        </div>}</article>;
      })}</div></section>;
    })}
    {!visible.length&&<div className="sc-api-empty"><BookOpen size={27}/><strong>{ui('No hay endpoints coincidentes.')}</strong>
      <p>{ui('Prueba otra búsqueda o selecciona un área diferente.')}</p>
      <button type="button" className="secondary" onClick={()=>{setQuery('');setSection('all');}}>{ui('Limpiar filtros')}</button></div>}
   </div></div>
   <p className="sc-api-footnote">{ui('Los permisos y parámetros se muestran según el contrato OpenAPI publicado por el backend.')}</p>
  </>}
 </section>;
}
