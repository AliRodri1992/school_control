import {useLayoutEffect,type RefObject} from 'react';
/** Repositions fixed popovers so they remain inside the visible viewport. */
export function useTopbarMenuPosition(open:boolean,holder:RefObject<HTMLDivElement|null>,preferredWidth:number){
 useLayoutEffect(()=>{
  if(!open)return;
  const place=()=>{
   const anchor=holder.current?.querySelector('button'),menu=holder.current?.querySelector<HTMLElement>('.sc-flyout');
   if(!anchor||!menu)return;
   const r=anchor.getBoundingClientRect(),width=Math.min(preferredWidth,Math.max(160,window.innerWidth-24));
   const left=Math.max(12,Math.min(r.right-width,window.innerWidth-width-12));
   const below=Math.max(110,window.innerHeight-r.bottom-20),above=Math.max(110,r.top-20);
   const required=menu.scrollHeight||280,flip=below<Math.min(required,200)&&above>below;
   const maxHeight=Math.max(110,Math.min(required,flip?above:below));
   Object.assign(menu.style,{left:left+'px',right:'auto',top:(flip?Math.max(12,r.top-maxHeight-8):Math.max(12,r.bottom+9))+'px',width:width+'px',maxHeight:maxHeight+'px'});
  };
  place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open,holder,preferredWidth]);
}
