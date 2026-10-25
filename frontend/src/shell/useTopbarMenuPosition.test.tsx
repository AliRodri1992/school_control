// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {useRef} from 'react';
import {useTopbarMenuPosition} from './useTopbarMenuPosition';

afterEach(()=>{cleanup();vi.restoreAllMocks();});

function Fixture({open=true}:{open?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 useTopbarMenuPosition(open,ref,345);
 return <div ref={ref}><button type="button">Notifications</button>
  {open&&<section className="sc-flyout">Menu content</section>}
 </div>;
}
it.each([280,320,375,768,1280])('keeps a dropdown within a %ipx viewport',width=>{
 vi.spyOn(window,'innerWidth','get').mockReturnValue(width);
 const {container}=render(<Fixture/>);
 const menu=container.querySelector<HTMLElement>('.sc-flyout')!;
 const left=Number.parseFloat(menu.style.left);
 const menuWidth=Number.parseFloat(menu.style.width);
 expect(left).toBeGreaterThanOrEqual(0);
 expect(menuWidth).toBeGreaterThan(0);
 expect(left+menuWidth).toBeLessThanOrEqual(width);
});
it('does not leave a popup when closed',()=>{
 vi.spyOn(window,'innerWidth','get').mockReturnValue(375);
 const {container,rerender}=render(<Fixture/>);
 const menu=container.querySelector<HTMLElement>('.sc-flyout')!;
 expect(menu.style.width).toBe('345px');
 rerender(<Fixture open={false}/>);
 expect(container.querySelector('.sc-flyout')).toBeNull();
});

it('repositions vertically above the trigger when there is not enough room below',()=>{
 vi.spyOn(window,'innerHeight','get').mockReturnValue(500);
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({
  top:450,bottom:490,left:300,right:345,width:45,height:40,x:300,y:450,toJSON:()=>({})
 } as DOMRect);
 const {container}=render(<Fixture/>);
 const popup=container.querySelector<HTMLElement>('.sc-flyout')!;
 expect(Number.parseFloat(popup.style.top)).toBeLessThan(450);
 expect(Number.parseFloat(popup.style.maxHeight)).toBeLessThanOrEqual(430);
});
