import {useSchoolLocale} from '../i18n/LocaleContext';
import {useEffect,useId,useRef,useState} from 'react';
import {Check,ChevronDown,Search} from 'lucide-react';

export type Choice = {value:string;label:string;disabled?:boolean};
export default function Combobox({value,onChange,options,placeholder='Seleccione una opción',label,id:inputId,disabled=false,invalid=false,describedBy}:{
 value:string;onChange:(value:string)=>void;options:Choice[];placeholder?:string;label:string;id?:string;disabled?:boolean;invalid?:boolean;describedBy?:string;
}) {
 const {ui,locale}=useSchoolLocale();
 const fallbackId=useId(),id=inputId||fallbackId,[open,setOpen]=useState(false),[query,setQuery]=useState('');
 const [highlighted,setHighlighted]=useState(0);
 const searchRef=useRef<HTMLInputElement>(null);
 const root=useRef<HTMLDivElement>(null);
 const filtered=options.filter(opt=>opt.label.toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{if(open)searchRef.current?.focus();},[open]);
 const current=options.find(opt=>opt.value===value);
 useEffect(()=>{
  function outside(event:MouseEvent){if(root.current&&!root.current.contains(event.target as Node))setOpen(false);}
  document.addEventListener('mousedown',outside);
  return()=>document.removeEventListener('mousedown',outside);
 },[]);
 function select(next:string){onChange(next);setQuery('');setHighlighted(0);setOpen(false);}
 function onKeyDown(event:React.KeyboardEvent){
  const target=event.target as HTMLElement;
  if(event.key==='Escape'){event.preventDefault();setOpen(false);setQuery('');return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();
    if(!open){setOpen(true);setHighlighted(0);return;}
    const direction=event.key==='ArrowDown'?1:-1;
    if(!filtered.length)return;
    for(let offset=1;offset<=filtered.length;offset++){
      const next=(highlighted+offset*direction+filtered.length*2)%filtered.length;
      if(filtered[next]&&!filtered[next].disabled){setHighlighted(next);break;}
    }
    return;
  }
  if(event.key==='Enter'&&open&&target.getAttribute('role')!=='option'){
    event.preventDefault();
    const choice=filtered[highlighted]&&!filtered[highlighted].disabled?filtered[highlighted]:
      filtered.find(item=>!item.disabled);
    if(choice)select(choice.value);
  }
 }

 return <div className={'sc-combobox'+(invalid?' is-invalid':'')} ref={root} onKeyDown={onKeyDown}>
   <button id={id} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id+'-list'}
     aria-haspopup="listbox" aria-invalid={invalid} aria-describedby={describedBy} className="sc-combobox-trigger" disabled={disabled}
     onClick={()=>{setOpen(v=>!v);setQuery('');setHighlighted(0);}}>
     <span className={current?'':'sc-combobox-placeholder'}>{current?.label||ui(placeholder)}</span><ChevronDown size={17} aria-hidden="true"/>
   </button>
   {open&&<div className="sc-combobox-panel">
     <div className="sc-combobox-search"><Search size={15}/><input ref={searchRef} aria-label={(locale==='en'?'Search in ':'Buscar en ')+label} aria-activedescendant={filtered[highlighted]?id+'-option-'+highlighted:undefined} type="search" value={query}
       placeholder={ui('Buscar opción…')} onChange={e=>{setQuery(e.target.value);setHighlighted(0);}}/></div>
     <div id={id+'-list'} role="listbox" aria-label={label} className="sc-combobox-list">
       <button role="option" type="button" aria-selected={!value} className="sc-combobox-option" onClick={()=>select('')}>{ui(placeholder)}</button>
       {filtered.map((opt,index)=><button id={id+'-option-'+index} key={opt.value} type="button" role="option" aria-selected={opt.value===value}
         className="sc-combobox-option" disabled={opt.disabled} onMouseEnter={()=>setHighlighted(index)} onClick={()=>select(opt.value)}>
         <span>{opt.label}</span>{opt.value===value&&<Check size={16}/>}</button>)}
       {!filtered.length&&<p className="sc-combobox-empty">{ui('No hay opciones para esta búsqueda.')}</p>}
     </div>
   </div>}
 </div>;
}
