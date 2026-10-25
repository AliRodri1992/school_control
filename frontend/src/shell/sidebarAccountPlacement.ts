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
