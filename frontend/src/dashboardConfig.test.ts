import {describe,it,expect} from 'vitest';
import {defaultConfig,appendWidget,removeWidget,columns,isMetricKind,widgetHeight,metricKinds,mergeGridLayouts,type DashboardRole} from './dashboardConfig';
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

it('offers role-specific widget presets',()=>{
 expect(defaultConfig('student').widgets.map(w=>w.kind)).not.toContain('pending_admissions');
 expect(defaultConfig('teacher').widgets.map(w=>w.kind)).toContain('groups');
 expect(defaultConfig('admin').widgets.map(w=>w.kind)).toContain('pending_admissions');
});

describe('redesigned KPI layouts',()=>{
 it.each(['admin','teacher','guardian','student'] as DashboardRole[])('packs the %s KPI cards tightly without overlap on all breakpoints',role=>{
  const config=defaultConfig(role);
  expect(config.widgets.some(widget=>isMetricKind(widget.kind))).toBe(true);
  for(const [bp,layout] of Object.entries(config.layouts)){
   for(const item of layout){
    const widget=config.widgets.find(widget=>widget.id===item.i)!;
    expect(item.h).toBe(widgetHeight(widget.kind));
    expect(item.x+item.w).toBeLessThanOrEqual(columns[bp]);
   }
   for(let a=0;a<layout.length;a++)for(let b=a+1;b<layout.length;b++){
    const first=layout[a],second=layout[b];
    const overlaps=first.x<second.x+second.w&&first.x+first.w>second.x&&
     first.y<second.y+second.h&&first.y+first.h>second.y;
    expect(overlaps).toBe(false);
   }
  }
 });
 it('uses compact dimensions for real counts, leaving room for charts and announcements',()=>{
  expect(widgetHeight('students')).toBe(4);
  expect(widgetHeight('pending_documents')).toBe(4);
  expect(widgetHeight('attendance_chart')).toBe(6);
  expect(widgetHeight('calendar')).toBe(6);
  expect(metricKinds).toHaveLength(7);
 });
 it('adds a useful scheduled-class KPI to the learner portal without administrative statistics',()=>{
  const learner=defaultConfig('student').widgets.map(widget=>widget.kind);
  expect(learner).toContain('today_classes');
  expect(learner).not.toContain('pending_admissions');
  expect(learner).not.toContain('grade_drafts');
  expect(defaultConfig('guardian').widgets.map(widget=>widget.kind)).toContain('today_classes');
 });
});

describe('restored grid layouts',()=>{
 it('retains missing responsive breakpoints when the grid reports only one',()=>{
  const initial=defaultConfig('admin');
  const changed={lg:initial.layouts.lg.map((item,index)=>({...item,y:index===0?item.y+1:item.y}))};
  const updated=mergeGridLayouts(initial,changed);
  expect(updated.layouts.md).toEqual(initial.layouts.md);
  expect(updated.layouts.sm).toEqual(initial.layouts.sm);
  expect(updated.layouts.xs).toEqual(initial.layouts.xs);
  expect(updated.layouts.lg[0].y).toBe(initial.layouts.lg[0].y+1);
 });
 it('ignores stale grid events for deleted widgets after restoring defaults',()=>{
  const modified=appendWidget(defaultConfig('admin'),'announcements','Temporal','temporary');
  const reset=defaultConfig('admin');
  expect(mergeGridLayouts(reset,modified.layouts)).toEqual(reset);
 });
 it('returns the previous state when no positions have changed',()=>{
  const initial=defaultConfig('teacher');
  expect(mergeGridLayouts(initial,initial.layouts)).toBe(initial);
 });
});
