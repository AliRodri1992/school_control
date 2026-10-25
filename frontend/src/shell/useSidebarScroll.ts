import {useEffect,type RefObject} from 'react';

/** Scroll a navigation rail without requiring a visible native scrollbar. */
export function sidebarScrollPosition(key:string,current:number,viewport:number,total:number):number|null{
 const bottom=Math.max(0,total-viewport);
 const page=Math.max(48,viewport*0.85);
 switch(key){
  case 'Home':return 0;
  case 'End':return bottom;
  case 'PageDown':return Math.min(bottom,current+page);
  case 'PageUp':return Math.max(0,current-page);
  case 'ArrowDown':return Math.min(bottom,current+44);
  case 'ArrowUp':return Math.max(0,current-44);
  default:return null;
 }
}

/** Reveal the active route when changing modules, without jumping the entire page. */
export function revealActiveSidebarItem(nav:HTMLElement|null):boolean{
 const selected=nav?.querySelector<HTMLElement>('.sc-nav-item.is-active, .sc-nav-section.is-primary-active');
 if(!selected||typeof selected.scrollIntoView!=='function')return false;
 selected.scrollIntoView({block:'nearest',inline:'nearest'});
 return true;
}

/** Native wheel and touch scrolling remain enabled; mouse drag starts only on blank areas. */
export function useSidebarScroll(ref:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const nav=ref.current;
  if(!nav)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.target!==nav||event.altKey||event.metaKey||event.ctrlKey)return;
   const target=sidebarScrollPosition(event.key,nav.scrollTop,nav.clientHeight,nav.scrollHeight);
   if(target===null)return;
   event.preventDefault();
   nav.scrollTop=target;
  };
  let cancelDrag:(()=>void)|null=null;
  const onPointerDown=(event:PointerEvent)=>{
   if(event.button!==0||(event.pointerType&&event.pointerType!=='mouse'))return;
   const target=event.target;
   if(!(target instanceof Element))return;
   if(target.closest('button,a,input,select,textarea,[role="button"],[contenteditable="true"]'))return;
   cancelDrag?.();
   const originY=event.clientY,originTop=nav.scrollTop,id=event.pointerId;
   let dragging=false;
   const onMove=(move:PointerEvent)=>{
    if(move.pointerId!==id)return;
    const distance=move.clientY-originY;
    if(!dragging&&Math.abs(distance)<4)return;
    dragging=true;
    nav.classList.add('sc-sidebar-nav-dragging');
    nav.scrollTop=originTop-distance;
    if(move.cancelable)move.preventDefault();
   };
   const cleanup=()=>{
    nav.classList.remove('sc-sidebar-nav-dragging');
    document.removeEventListener('pointermove',onMove);
    document.removeEventListener('pointerup',finish);
    document.removeEventListener('pointercancel',finish);
    cancelDrag=null;
   };
   const finish=(up:PointerEvent)=>{
    if(up.pointerId!==id)return;
    cleanup();
   };
   cancelDrag=cleanup;
   document.addEventListener('pointermove',onMove);
   document.addEventListener('pointerup',finish);
   document.addEventListener('pointercancel',finish);
  };
  nav.addEventListener('keydown',onKeyDown);
  nav.addEventListener('pointerdown',onPointerDown);
  return()=>{
   cancelDrag?.();
   nav.removeEventListener('keydown',onKeyDown);
   nav.removeEventListener('pointerdown',onPointerDown);
  };
 },[ref]);
}
