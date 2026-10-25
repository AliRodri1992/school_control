import {expect,it} from 'vitest';
import {placeSidebarAccountMenu} from './sidebarAccountPlacement';

const avatar={left:12,right:274,top:710,bottom:770,width:262};
it('aligns the expanded sidebar panel with the avatar and opens upward',()=>{
 expect(placeSidebarAccountMenu(avatar,350,{width:1440,height:850},false))
  .toEqual({left:12,top:350,width:262});
});
it('opens beside a collapsed sidebar without overflowing the viewport',()=>{
 const narrow={left:9,right:67,top:680,bottom:750,width:58};
 const result=placeSidebarAccountMenu(narrow,420,{width:1000,height:800},true);
 expect(result).toEqual({left:77,top:250,width:300});
});
it('constrains the panel within narrow mobile viewports',()=>{
 const result=placeSidebarAccountMenu(
  {left:14,right:276,top:550,bottom:614,width:262},470,{width:320,height:640},false
 );
 expect(result).toEqual({left:14,top:70,width:262});
});
it('keeps a tall menu scrollable inside the available viewport',()=>{
 const result=placeSidebarAccountMenu(
  {left:9,right:67,top:250,bottom:306,width:58},1000,{width:370,height:440},true
 );
 expect(result.left).toBeGreaterThanOrEqual(12);
 expect(result.left+result.width).toBeLessThanOrEqual(358);
 expect(result.top).toBe(12);
});
it('flips compact popovers left when there is insufficient space on the right',()=>{
 const result=placeSidebarAccountMenu(
  {left:350,right:420,top:340,bottom:400,width:70},270,{width:470,height:600},true
 );
 expect(result.left).toBe(40);
 expect(result.left+result.width).toBeLessThanOrEqual(458);
});
