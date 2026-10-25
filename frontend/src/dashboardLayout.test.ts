import {describe,expect,it} from 'vitest';
import {columns,defaultConfig,moveWidgetEarlier,type DashboardRole,type Item} from './dashboardConfig';

function noOverlaps(items:Item[]):boolean{
 return items.every((left,index)=>items.slice(index+1).every(right=>
  left.x+left.w<=right.x||right.x+right.w<=left.x||
  left.y+left.h<=right.y||right.y+right.h<=left.y));
}

describe('dashboard visual grid reordering',()=>{
 it.each(['admin','teacher','guardian','student'] as DashboardRole[])(
  'keeps %s widgets in bounded responsive rows after moving a chart',
  role=>{
   const original=defaultConfig(role);
   const index=Math.min(6,original.widgets.length-1);
   const next=moveWidgetEarlier(original,index);
   expect(next.widgets[index-1].id).toBe(original.widgets[index].id);
   for(const bp of Object.keys(columns)){
    const items=next.layouts[bp];
    expect(items).toHaveLength(next.widgets.length);
    expect(items.every(item=>item.x>=0&&item.x+item.w<=columns[bp]&&item.y>=0)).toBe(true);
    expect(noOverlaps(items)).toBe(true);
    expect(items.map(item=>item.i)).toEqual(next.widgets.map(widget=>widget.id));
    for(const item of items){
     const previous=original.layouts[bp].find(earlier=>earlier.i===item.i)!;
     expect([item.w,item.h]).toEqual([previous.w,previous.h]);
    }
   }
   expect(original.widgets[index].id).not.toBe(original.widgets[index-1].id);
  }
 );
 it('preserves custom dimensions but never converts desktop charts into a vertical list',()=>{
  const initial=defaultConfig('admin');
  const id='students_by_grade';
  const stretched={...initial,layouts:{...initial.layouts,
   lg:initial.layouts.lg.map(item=>item.i===id?{...item,w:7}:item)}};
  const last=stretched.widgets.findIndex(widget=>widget.id==='calendar');
  const after=moveWidgetEarlier(stretched,last);
  expect(after.layouts.lg.find(item=>item.i===id)?.w).toBe(7);
  expect(noOverlaps(after.layouts.lg)).toBe(true);
  expect(after.layouts.lg.some((first,index)=>after.layouts.lg.slice(index+1).some(second=>
   first.y===second.y&&first.x!==second.x))).toBe(true);
  expect(new Set(after.layouts.lg.map(item=>item.y)).size).toBeLessThan(after.layouts.lg.length);
 });
 it('returns unchanged configuration if a move is not applicable',()=>{
  const config=defaultConfig('admin');
  expect(moveWidgetEarlier(config,-1)).toBe(config);
  expect(moveWidgetEarlier(config,0)).toBe(config);
  expect(moveWidgetEarlier(config,config.widgets.length)).toBe(config);
 });
});
