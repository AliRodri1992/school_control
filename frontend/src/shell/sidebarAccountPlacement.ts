/** Anchor the sidebar account flyout without clipping it at rail or viewport boundaries. */
export type SidebarAccountPosition={left:number;top:number;width:number};
type Rect={left:number;right:number;top:number;bottom:number;width:number};
type Viewport={width:number;height:number};
const EDGE=12;
const GAP=10;

export function placeSidebarAccountMenu(
 anchor:Rect,panelHeight:number,viewport:Viewport,compact:boolean
):SidebarAccountPosition{
 const width=Math.max(0,Math.min(viewport.width-2*EDGE,compact?300:(anchor.width||280),304));
 const maxLeft=Math.max(EDGE,viewport.width-width-EDGE);
 const clampLeft=(value:number)=>Math.max(EDGE,Math.min(value,maxLeft));
 let left=clampLeft(anchor.left);
 if(compact){
  const rightSpace=viewport.width-anchor.right-GAP-EDGE;
  left=rightSpace>=width?clampLeft(anchor.right+GAP):clampLeft(anchor.left-width-GAP);
 }
 const maxTop=Math.max(EDGE,viewport.height-panelHeight-EDGE);
 const above=anchor.top-panelHeight-GAP;
 const below=anchor.bottom+GAP;
 const top=above>=EDGE?above:(below+panelHeight<=viewport.height-EDGE?below:maxTop);
 return {left,top:Math.max(EDGE,Math.min(top,maxTop)),width};
}

/** Position the navbar menu by the avatar while keeping its content within the viewport. */
export function placeTopbarAccountMenu(
 anchor:Rect,panelHeight:number,viewport:Viewport
):SidebarAccountPosition{
 const width=Math.max(0,Math.min(320,viewport.width-EDGE*2));
 const left=Math.max(EDGE,Math.min(anchor.right-width,viewport.width-width-EDGE));
 const visibleHeight=Math.max(0,viewport.height-EDGE*2);
 const menuHeight=Math.min(panelHeight||350,visibleHeight);
 const below=viewport.height-anchor.bottom-GAP-EDGE;
 const above=anchor.top-GAP-EDGE;
 const openAbove=below<menuHeight&&above>below;
 const preferredTop=openAbove?anchor.top-GAP-menuHeight:anchor.bottom+GAP;
 const maxTop=Math.max(EDGE,viewport.height-EDGE-menuHeight);
 const top=Math.max(EDGE,Math.min(preferredTop,maxTop));
 return {left,top,width};
}

/** Viewport-safe placement for a collapsed sidebar category panel. */
export function placeCompactSidebarMenu(anchor:Rect,panelHeight:number,viewport:Viewport):SidebarAccountPosition{
 const width=Math.max(0,Math.min(270,viewport.width-2*EDGE));
 const right=anchor.right+GAP;
 const left=right+width<=viewport.width-EDGE?right:anchor.left-GAP-width>=EDGE?anchor.left-GAP-width:Math.max(EDGE,viewport.width-width-EDGE);
 const height=Math.min(panelHeight||360,Math.max(0,viewport.height-2*EDGE));
 return {left,top:Math.max(EDGE,Math.min(anchor.top-8,viewport.height-height-EDGE)),width};
}
