import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight,BookOpenCheck,ChevronDown,ClipboardCheck,ClipboardList,FileText,GraduationCap,Plus,Search,Upload,Users,X} from 'lucide-react';
import type {Row} from '../modules';
import type {NavGroup,NavItem} from './portalNavigation';
import {useTopbarMenuPosition} from './useTopbarMenuPosition';

export type QuickAction={page:string;permission:string;index:string;es:string;en:string;mode:'create'|'open'};
const quick:QuickAction[]=[
 {page:'students',permission:'students.create',index:'students.index',es:'Agregar alumno',en:'Add student',mode:'create'},
 {page:'groups',permission:'groups.create',index:'groups.index',es:'Crear grupo',en:'Create group',mode:'create'},
 {page:'admissions',permission:'admissions.create',index:'admissions.index',es:'Nueva inscripción',en:'New admission',mode:'create'},
 {page:'attendances',permission:'attendances.create',index:'attendances.index',es:'Registrar asistencia',en:'Record attendance',mode:'create'},
 {page:'announcements',permission:'announcements.create',index:'announcements.index',es:'Nuevo comunicado',en:'New announcement',mode:'create'},
 {page:'documents',permission:'student_documents.create',index:'student_documents.index',es:'Subir documento',en:'Upload document',mode:'open'},
 {page:'classroom',permission:'assignments.create',index:'assignments.index',es:'Publicar tarea',en:'Publish assignment',mode:'open'}
];
export const visibleQuickActions=(can:(key:string)=>boolean)=>quick.filter(item=>can(item.permission)&&can(item.index));
type Hit={id:string;label:string;detail:string;page:string;student?:Row};
const flatten=(items:NavItem[]):NavItem[]=>items.flatMap(item=>[item,...flatten(item.children||[])]);
const norm=(value:unknown)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export default function TopbarCommands({groups,records,can,locale,translate,onNavigate,onStudent,onCreate,onOpen}:{
 groups:NavGroup[];records:Record<string,Row[]>;can:(key:string)=>boolean;locale:string;
 translate:(key:string,fallback:string)=>string;onNavigate:(page:string,search?:string)=>void;
 onStudent:(student:Row)=>void;onCreate:(item:QuickAction)=>void;onOpen:()=>void;
}){
 const [searchOpen,setSearchOpen]=useState(false),[quickOpen,setQuickOpen]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState(0);
 const searchHost=useRef<HTMLDivElement>(null),quickHost=useRef<HTMLDivElement>(null),field=useRef<HTMLInputElement>(null),searchButton=useRef<HTMLButtonElement>(null),quickButton=useRef<HTMLButtonElement>(null);
 const en=locale.toLowerCase().startsWith('en'),searchLabel=translate('topbar.search','Buscar en School Control');
 const shortcuts=visibleQuickActions(can);
 const modules=useMemo<Hit[]>(()=>{
  const seen=new Set<string>();
  return flatten(groups.flatMap(x=>x.items)).filter(item=>!seen.has(item.key)&&Boolean(seen.add(item.key)))
   .map(item=>({id:'module:'+item.key,label:translate('nav.'+item.key,item.title),detail:en?'Module':'Módulo',page:item.key}));
 },[groups,translate,en]);
 const matches=useMemo(()=>{
  const result:Hit[]=[...modules];
  if(can('students.index')&&can('students.show'))for(const row of records.students||[])result.push({
   id:'student:'+row.id,label:String(row.full_name||[row.first_name,row.last_name].filter(Boolean).join(' ')),detail:en?'Student record':'Expediente',page:'students',student:row});
  if(can('groups.index'))for(const row of records.groups||[])result.push({
   id:'group:'+row.id,label:String(row.label||row.name||row.id),detail:en?'Group':'Grupo',page:'groups'});
  if(can('subjects.index'))for(const row of records.subjects||[])result.push({
   id:'subject:'+row.id,label:String(row.name||row.code||row.id),detail:en?'Subject':'Materia',page:'subjects'});
  return result;
 },[modules,records,can,en]);
 const results=useMemo(()=>query.trim()?matches.filter(x=>norm(x.label+' '+x.detail).includes(norm(query.trim()))).slice(0,9):modules.slice(0,6),[matches,modules,query]);
 useTopbarMenuPosition(searchOpen,searchHost,510);
 useTopbarMenuPosition(quickOpen,quickHost,270);
 useEffect(()=>{
  const shortcut=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setQuickOpen(false);setSearchOpen(true);onOpen();}};
  document.addEventListener('keydown',shortcut);return()=>document.removeEventListener('keydown',shortcut);
 },[onOpen]);
 useEffect(()=>{if(searchOpen)field.current?.focus();else{setQuery('');setSelected(0);}},[searchOpen]);
 useEffect(()=>setSelected(0),[query]);
 useEffect(()=>{
  if(!searchOpen&&!quickOpen)return;
  const outside=(e:PointerEvent)=>{const node=e.target as Node;if(!searchHost.current?.contains(node))setSearchOpen(false);if(!quickHost.current?.contains(node))setQuickOpen(false);};
  const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSearchOpen(false);setQuickOpen(false);(searchOpen?searchButton:quickButton).current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',esc);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',esc);};
 },[searchOpen,quickOpen]);
 const choose=(item:Hit)=>{setSearchOpen(false);if(item.student)onStudent(item.student);else onNavigate(item.page,item.id.startsWith('module:')?undefined:query.trim());};
 return <>
  <div className="sc-global-search sc-flyout-holder" ref={searchHost} role="search">
   <button type="button" ref={searchButton} className="sc-global-search-trigger" aria-label={searchLabel} aria-haspopup="true" aria-expanded={searchOpen}
    onClick={()=>{setQuickOpen(false);setSearchOpen(true);onOpen();}}><Search size={19} aria-hidden="true"/><span className="sc-global-search-placeholder">{en?'Search students, groups, documents…':'Buscar alumnos, grupos, documentos…'}</span><kbd>⌘K</kbd></button>
   {searchOpen&&<div className="sc-flyout sc-global-search-menu" role="region" aria-label={en?'Quick search':'Búsqueda rápida'}>
    <div className="sc-global-search-input"><Search size={18}/><input ref={field} type="search" aria-label={searchLabel} autoComplete="off" value={query}
     placeholder={en?'What are you looking for?':'¿Qué necesitas encontrar?'} onChange={e=>setQuery(e.target.value)}
     onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setSelected(v=>Math.min(v+1,results.length-1));}
      if(e.key==='ArrowUp'){e.preventDefault();setSelected(v=>Math.max(0,v-1));}
      if(e.key==='Enter'&&results[selected]){e.preventDefault();choose(results[selected]);}}}/>
     <button type="button" aria-label={en?'Close search':'Cerrar búsqueda'} onClick={()=>{setSearchOpen(false);searchButton.current?.focus();}}><X size={17}/></button>
    </div>
    <div className="sc-global-search-caption">{query.trim()?(en?'Results':'Resultados'):(en?'Quick access':'Accesos rápidos')}</div>
    <div className="sc-global-search-results" role="listbox" aria-label={en?'Search results':'Resultados de búsqueda'}>
     {results.map((item,i)=><button type="button" role="option" aria-selected={i===selected} key={item.id} className={'sc-global-search-result'+(selected===i?' is-selected':'')}
      onMouseEnter={()=>setSelected(i)} onClick={()=>choose(item)}><span className="sc-global-result-icon">{item.student?<GraduationCap size={18}/>:<FileText size={18}/>}</span>
      <span className="sc-global-result-text"><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight size={16}/></button>)}
     {!results.length&&<p>{en?'No matching records.':'No hay coincidencias.'}</p>}
    </div><footer>{en?'↑↓ Navigate · Enter Open · Esc Close':'↑↓ Navegar · Enter Abrir · Esc Cerrar'}</footer>
   </div>}
  </div>
  {shortcuts.length>0&&<div className="sc-quick-actions sc-flyout-holder" ref={quickHost}>
   <button className="sc-quick-trigger" type="button" ref={quickButton} aria-label={en?'New record':'Nuevo registro'} aria-haspopup="true" aria-expanded={quickOpen}
    onClick={()=>{setSearchOpen(false);setQuickOpen(v=>!v);onOpen();}}><Plus size={19}/><span>{en?'New':'Nuevo'}</span><ChevronDown size={15}/></button>
   {quickOpen&&<div className="sc-flyout sc-quick-menu" role="region" aria-label={en?'Quick actions':'Acciones rápidas'}><strong>{en?'Quick actions':'Acciones rápidas'}</strong>
    {shortcuts.map(item=>{const Icon=item.page==='students'?GraduationCap:item.page==='groups'?Users:item.page==='admissions'?ClipboardCheck:item.page==='attendances'?ClipboardList:item.page==='documents'?Upload:item.page==='classroom'?BookOpenCheck:FileText;
     return <button type="button" key={item.page} onClick={()=>{setQuickOpen(false);onCreate(item);}}><span className="sc-quick-item-icon"><Icon size={18}/></span>{en?item.en:item.es}</button>;})}
   </div>}
  </div>}
 </>;
}
