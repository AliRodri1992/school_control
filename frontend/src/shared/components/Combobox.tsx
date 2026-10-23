import {useEffect,useId,useRef,useState} from 'react';
import {Check,ChevronDown,Search} from 'lucide-react';

export type Choice = {value:string;label:string;disabled?:boolean};
export default function Combobox({value,onChange,options,placeholder='Seleccione una opción',label,disabled=false,invalid=false}:{
 value:string;onChange:(value:string)=>void;options:Choice[];placeholder?:string;label:string;disabled?:boolean;invalid?:boolean;
}) {
 const id=useId(),[open,setOpen]=useState(false),[query,setQuery]=useState('');
 const root=useRef<HTMLDivElement>(null);
 const filtered=options.filter(opt=>opt.label.toLowerCase().includes(query.toLowerCase()));
 const current=options.find(opt=>opt.value===value);
 useEffect(()=>{
  function outside(event:MouseEvent){if(root.current&&!root.current.contains(event.target as Node))setOpen(false);}
  document.addEventListener('mousedown',outside);
  return()=>document.removeEventListener('mousedown',outside);
 },[]);
 function select(next:string){onChange(next);setQuery('');setOpen(false);}
 function onKeyDown(event:React.KeyboardEvent){
  if(event.key==='Escape'){setOpen(false);return;}
  if(event.key==='ArrowDown'&&!open){event.preventDefault();setOpen(true);}
  if(event.key==='Enter'&&open&&filtered.length>0){event.preventDefault();const first=filtered.find(item=>!item.disabled);if(first)select(first.value);}
 }
 return <div className={'sc-combobox'+(invalid?' is-invalid':'')} ref={root} onKeyDown={onKeyDown}>
   <button id={id} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id+'-list'}
     aria-haspopup="listbox" aria-invalid={invalid} className="sc-combobox-trigger" disabled={disabled}
     onClick={()=>{setOpen(v=>!v);setQuery('');}}>
     <span className={current?'':'sc-combobox-placeholder'}>{current?.label||placeholder}</span><ChevronDown size={17} aria-hidden="true"/>
   </button>
   {open&&<div className="sc-combobox-panel">
     <div className="sc-combobox-search"><Search size={15}/><input aria-label={'Buscar en '+label} type="search" value={query}
       placeholder="Buscar opción…" onChange={e=>setQuery(e.target.value)}/></div>
     <div id={id+'-list'} role="listbox" aria-label={label} className="sc-combobox-list">
       <button role="option" type="button" aria-selected={!value} className="sc-combobox-option" onClick={()=>select('')}>{placeholder}</button>
       {filtered.map(opt=><button key={opt.value} type="button" role="option" aria-selected={opt.value===value}
         className="sc-combobox-option" disabled={opt.disabled} onClick={()=>select(opt.value)}>
         <span>{opt.label}</span>{opt.value===value&&<Check size={16}/>}</button>)}
       {!filtered.length&&<p className="sc-combobox-empty">No hay opciones para esta búsqueda.</p>}
     </div>
   </div>}
 </div>;
}
