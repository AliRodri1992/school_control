import {expect,it} from 'vitest';
import {placeSidebarAccountMenu,placeTopbarAccountMenu,placeCompactSidebarMenu} from './sidebarAccountPlacement';

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

it('uses a safe panel width before the browser has measured a hidden trigger',()=>{
 const result=placeSidebarAccountMenu(
  {left:0,right:0,top:0,bottom:0,width:0},0,{width:1024,height:768},false
 );
 expect(result.width).toBe(280);
 expect(result.left).toBeGreaterThanOrEqual(12);
});
it('avoids horizontal overflow on very narrow mobile screens',()=>{
 const result=placeSidebarAccountMenu(
  {left:8,right:190,top:250,bottom:300,width:182},260,{width:200,height:400},false
 );
 expect(result.width).toBeLessThanOrEqual(176);
 expect(result.left+result.width).toBeLessThanOrEqual(188);
});

it('anchors the navbar account menu beneath the avatar and aligned right',()=>{
 const result=placeTopbarAccountMenu(
  {left:1170,right:1220,top:18,bottom:60,width:50},370,{width:1280,height:900});
 expect(result).toEqual({left:900,top:70,width:320});
});
it('keeps navbar options inside a 320px mobile viewport',()=>{
 const result=placeTopbarAccountMenu(
  {left:265,right:310,top:8,bottom:52,width:45},360,{width:320,height:760});
 expect(result).toEqual({left:12,top:62,width:296});
});
it('opens the account menu above the avatar if there is insufficient space below',()=>{
 const result=placeTopbarAccountMenu(
  {left:540,right:585,top:460,bottom:502,width:45},330,{width:600,height:540});
 expect(result).toEqual({left:265,top:120,width:320});
});
it('prevents overflow with tall content and short mobile viewports',()=>{
 const result=placeTopbarAccountMenu(
  {left:260,right:310,top:20,bottom:62,width:50},600,{width:320,height:270});
 expect(result.left).toBeGreaterThanOrEqual(12);
 expect(result.left+result.width).toBeLessThanOrEqual(308);
 expect(result.top).toBeGreaterThanOrEqual(12);
});

it('positions a compact category within a short viewport',()=>{
 expect(placeCompactSidebarMenu({left:9,right:67,top:340,bottom:384,width:58},800,{width:360,height:400})).toEqual({left:77,top:12,width:270});
});
it('avoids horizontal overflow in a narrow viewport',()=>{
 const result=placeCompactSidebarMenu({left:9,right:67,top:40,bottom:84,width:58},160,{width:300,height:270});
 expect(result.left).toBeGreaterThanOrEqual(12);
 expect(result.left+result.width).toBeLessThanOrEqual(288);
});
