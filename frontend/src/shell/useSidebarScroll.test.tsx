// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {useRef} from 'react';
import {sidebarScrollPosition,useSidebarScroll} from './useSidebarScroll';

afterEach(()=>cleanup());

function ScrollFixture(){
 const navRef=useRef<HTMLElement>(null);
 useSidebarScroll(navRef);
 return <nav ref={navRef} tabIndex={0} aria-label="Side navigation">
  <div className="blank-space">Free space for mouse drag</div>
  <button type="button">Clickable link</button>
 </nav>;
}
it('scrolls through the entire list with keyboard while keeping default wheel/touch behavior',()=>{
 const {container}=render(<ScrollFixture/>);
 const nav=container.querySelector('nav')!;
 Object.defineProperty(nav,'clientHeight',{configurable:true,value:200});
 Object.defineProperty(nav,'scrollHeight',{configurable:true,value:800});
 fireEvent.keyDown(nav,{key:'End'});
 expect(nav.scrollTop).toBe(600);
 fireEvent.keyDown(nav,{key:'PageUp'});
 expect(nav.scrollTop).toBe(430);
 fireEvent.keyDown(nav,{key:'Home'});
 expect(nav.scrollTop).toBe(0);
 fireEvent.keyDown(nav,{key:'ArrowDown'});
 expect(nav.scrollTop).toBe(44);
});
it('calculates constrained scroll offsets for long and short navigation',()=>{
 expect(sidebarScrollPosition('End',100,300,850)).toBe(550);
 expect(sidebarScrollPosition('PageDown',0,200,850)).toBe(170);
 expect(sidebarScrollPosition('PageUp',40,200,850)).toBe(0);
 expect(sidebarScrollPosition('ArrowUp',0,200,850)).toBe(0);
 expect(sidebarScrollPosition('End',0,500,200)).toBe(0);
 expect(sidebarScrollPosition('Enter',0,300,700)).toBeNull();
});
it('supports primary mouse drag from non-interactive navigation background',()=>{
 const {container}=render(<ScrollFixture/>);
 const nav=container.querySelector('nav')!;
 const background=nav.querySelector('.blank-space')!;
 fireEvent.pointerDown(background,{button:0,pointerId:1,clientY:130});
 fireEvent.pointerMove(document,{pointerId:1,clientY:80});
 expect(nav.scrollTop).toBe(50);
 fireEvent.pointerUp(document,{pointerId:1,clientY:80});
 expect(nav.classList.contains('sc-sidebar-nav-dragging')).toBe(false);
});
it('does not hijack clicks or drags from interactive menu items',()=>{
 const {container}=render(<ScrollFixture/>);
 const nav=container.querySelector('nav')!;
 const button=nav.querySelector('button')!;
 fireEvent.pointerDown(button,{button:0,pointerId:2,clientY:120});
 fireEvent.pointerMove(document,{pointerId:2,clientY:30});
 expect(nav.scrollTop).toBe(0);
 fireEvent.pointerUp(document,{pointerId:2,clientY:30});
});
