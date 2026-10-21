import {describe,it,expect} from 'vitest';
import {defaultConfig,appendWidget,removeWidget,columns} from './dashboardConfig';
describe('dashboard configuration',()=>{
 it('provides layouts bounded to each screen including a single mobile column',()=>{
  const config=defaultConfig();
  for(const [bp,items] of Object.entries(config.layouts)){
   expect(items.map(i=>i.i)).toEqual(config.widgets.map(w=>w.id));
   expect(items.every(i=>i.x+i.w<=columns[bp])).toBe(true);
  }
 });
 it('allows two independently titled charts and removes only the requested chart everywhere',()=>{
  const initial=defaultConfig();
  const expanded=appendWidget(initial,'attendance_chart','Mi gráfica','custom-chart');
  expect(expanded.widgets.filter(w=>w.kind==='attendance_chart')).toHaveLength(2);
  const removed=removeWidget(expanded,'custom-chart');
  expect(removed).toEqual(initial);
 });
 it('places new widgets below existing content on every screen',()=>{
  const initial=defaultConfig();const next=appendWidget(initial,'groups','Grupos','new');
  for(const [bp,items] of Object.entries(initial.layouts)){
   expect(next.layouts[bp].at(-1)!.y).toBe(Math.max(...items.map(i=>i.y+i.h)));
  }
 });
});
