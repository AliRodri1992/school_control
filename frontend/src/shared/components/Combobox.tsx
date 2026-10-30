import {useSchoolLocale} from '../i18n/LocaleContext';
import {useCallback,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronDown,Search} from 'lucide-react';

export type Choice = {value:string;label:string;disabled?:boolean};
type PanelPosition={left:number;width:number;top:number;bottom:number;above:boolean;maxHeight:number};
export default function Combobox({value,onChange,options,placeholder='Seleccione una opción',label,id:inputId,disabled=false,invalid=false,describedBy,searchable=true}:{
 value:string;onChange:(value:string)=>void;options:Choice[];placeholder?:string;label:string;id?:string;disabled?:boolean;invalid?:boolean;describedBy?:string;searchable?:boolean;
}) {
 const {ui,locale}=useSchoolLocale();
 const fallbackId=useId(),id=inputId||fallbackId;
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[highlighted,setHighlighted]=useState(0);
 const [position,setPosition]=useState<PanelPosition|null>(null);
 const searchRef=useRef<HTMLInputElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const root=useRef<HTMLDivElement>(null);
 const panelRef=useRef<HTMLDivElement>(null);
 const filtered=searchable?options.filter(opt=>opt.label.toLowerCase().includes(query.toLowerCase())):options;
 const current=options.find(opt=>opt.value===value);

 const updatePosition=useCallback(()=>{
  const trigger=triggerRef.current;
  if(!trigger)return;
  const rect=trigger.getBoundingClientRect();
  const margin=8,gap=5;
  const viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
  if(rect.bottom<0||rect.top>viewportHeight){
   setOpen(false);
   return;
  }
  const width=Math.min(rect.width,Math.max(0,viewportWidth-margin*2));
  const left=Math.max(margin,Math.min(rect.left,viewportWidth-margin-width));
  const below=Math.max(0,viewportHeight-rect.bottom-gap-margin);
  const aboveSpace=Math.max(0,rect.top-gap-margin);
  const estimatedHeight=Math.min(310,(filtered.length+1)*39+(searchable?55:0)+12);
  const above=below<Math.min(estimatedHeight,180)&&aboveSpace>below;
  const maxHeight=Math.min(310,Math.max(65,above?aboveSpace:below));
  const next={left,width,top:rect.bottom+gap,bottom:viewportHeight-rect.top+gap,above,maxHeight};
  setPosition(previous=>previous&&Object.keys(next).every(key=>previous[key as keyof PanelPosition]===next[key as keyof PanelPosition])?previous:next);
 },[filtered.length,searchable]);

 useLayoutEffect(()=>{
  if(open)updatePosition();
  else setPosition(null);
 },[open,updatePosition]);

 useEffect(()=>{
  if(open&&searchable)searchRef.current?.focus();
 },[open,searchable]);

 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{
   const target=event.target as Node;
   if(!root.current?.contains(target)&&!panelRef.current?.contains(target)){
    setOpen(false);setQuery('');
   }
  };
  const update=()=>updatePosition();
  document.addEventListener('pointerdown',outside);
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);
  if(triggerRef.current)observer?.observe(triggerRef.current);
  return()=>{
   document.removeEventListener('pointerdown',outside);
   window.removeEventListener('resize',update);
   window.removeEventListener('scroll',update,true);
   observer?.disconnect();
  };
 },[open,updatePosition]);

 function select(next:string){
  onChange(next);setQuery('');setHighlighted(0);setOpen(false);
  triggerRef.current?.focus();
 }
 function onKeyDown(event:React.KeyboardEvent){
  const target=event.target as HTMLElement;
  if(event.key==='Escape'&&open){
   event.preventDefault();setOpen(false);setQuery('');triggerRef.current?.focus();return;
  }
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
 const panel=open&&typeof document!=='undefined'?createPortal(
  <div ref={panelRef} className="sc-combobox-panel sc-combobox-panel-portal"
   style={{position:'fixed',left:position?.left??0,width:position?.width??0,
    top:position?(position.above?'auto':position.top):0,
    bottom:position?.above?position.bottom:'auto',
    maxHeight:position?.maxHeight??310,zIndex:11000,visibility:position?'visible':'hidden'}}>
   {searchable&&<div className="sc-combobox-search"><Search size={15}/><input ref={searchRef}
    aria-label={(locale==='en'?'Search in ':'Buscar en ')+label}
    aria-activedescendant={filtered[highlighted]?id+'-option-'+highlighted:undefined}
    type="search" value={query} placeholder={ui('Buscar opción…')}
    onChange={e=>{setQuery(e.target.value);setHighlighted(0);}}/></div>}
   <div id={id+'-list'} role="listbox" aria-label={label} className="sc-combobox-list"
    style={{maxHeight:Math.min(230,Math.max(60,(position?.maxHeight??310)-(searchable?55:0)-10))}}>
    <button role="option" type="button" aria-selected={!value} className="sc-combobox-option" onClick={()=>select('')}>{ui(placeholder)}</button>
    {filtered.map((opt,index)=><button id={id+'-option-'+index} key={opt.value} type="button"
     role="option" aria-selected={opt.value===value} className="sc-combobox-option" disabled={opt.disabled}
     onMouseEnter={()=>setHighlighted(index)} onClick={()=>select(opt.value)}>
     <span>{opt.label}</span>{opt.value===value&&<Check size={16}/>}</button>)}
    {!filtered.length&&<p className="sc-combobox-empty">{ui('No hay opciones para esta búsqueda.')}</p>}
   </div>
  </div>,document.body):null;

 return <div className={'sc-combobox'+(invalid?' is-invalid':'')} ref={root} onKeyDown={onKeyDown}>
  <button ref={triggerRef} id={id} type="button" role="combobox" aria-label={label} aria-expanded={open}
   aria-controls={open?id+'-list':undefined} aria-haspopup="listbox" aria-invalid={invalid}
   aria-describedby={describedBy} className="sc-combobox-trigger" disabled={disabled}
   onClick={()=>{setOpen(v=>!v);setQuery('');setHighlighted(0);}}>
   <span className={current?'':'sc-combobox-placeholder'}>{current?.label||ui(placeholder)}</span>
   <ChevronDown size={17} aria-hidden="true"/>
  </button>
  {panel}
 </div>;
}
