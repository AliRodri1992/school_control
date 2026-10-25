import {describe,it,expect} from 'vitest';
import {defaultConfig,appendWidget,removeWidget,columns,isMetricKind,widgetHeight,metricKinds,mergeGridLayouts,upgradeLegacyDashboardConfig,upgradeRoleCharts,allowedChartKinds,type DashboardRole} from './dashboardConfig';
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
  expect(widgetHeight('students')).toBe(3);
  expect(widgetHeight('pending_documents')).toBe(3);
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

it('accepts missing layout breakpoints without losing saved mobile dimensions',()=>{
 const config=defaultConfig('guardian');
 const updated=mergeGridLayouts(config,{lg:config.layouts.lg});
 expect(updated).toEqual(config);
 expect(updated.layouts.xs).toHaveLength(config.widgets.length);
});

it('accepts readonly layouts from react-grid-layout without mutating frozen items',()=>{
 const factory=defaultConfig('admin');
 const readonlyItems=Object.freeze(factory.layouts.lg.map(item=>Object.freeze({...item})));
 const next=mergeGridLayouts(factory,{lg:readonlyItems});
 expect(next).toEqual(factory);
 expect(readonlyItems).toBeTruthy();
});

describe('dashboard rows and overflow regression',()=>{
 it('places exactly four administrative KPI widgets in one compact desktop row',()=>{
  const dashboard=defaultConfig('admin');
  const expected=['students','enrollments','pending_admissions','pending_documents'];
  for(const [index,kind] of expected.entries()){
   const item=dashboard.layouts.lg.find(item=>item.i===kind);
   expect(item).toEqual({i:kind,x:index*3,y:0,w:3,h:3});
  }
  expect(dashboard.layouts.lg.filter(item=>item.y===0)).toHaveLength(4);
  const content=['attendance_chart','alerts','calendar'];
  for(const [index,kind] of content.entries()){
   expect(dashboard.layouts.lg.find(item=>item.i===kind)).toEqual({
    i:kind,x:index*4,y:3,w:4,h:6
   });
  }
  const finalY=Math.max(...dashboard.layouts.lg.map(item=>item.y+item.h));
  expect(finalY).toBe(9);
 });
 it('lays out cards responsively as four, two, two or one per row',()=>{
  const config=defaultConfig('admin');
  for(const [breakpoint,columnsPerRow] of [['lg',4],['md',2],['sm',2],['xs',1]] as const){
   const kpis=config.layouts[breakpoint].filter(item=>
    ['students','enrollments','pending_admissions','pending_documents'].includes(item.i));
   expect(kpis.filter(item=>item.y===0)).toHaveLength(columnsPerRow);
  }
 });
 it('upgrades the untouched old templates while preserving custom-positioned widgets',()=>{
  const current=defaultConfig('admin');
  const legacy={...current,layouts:Object.fromEntries(Object.entries(columns).map(([bp,cols])=>{
   const perRow=Math.max(1,Math.floor(cols/Math.min(4,cols)));
   let y=0;
   const layout=current.widgets.map((widget,index)=>({
    i:widget.id,x:(index%perRow)*Math.min(cols,4),y:Math.floor(index/perRow)*6,
    w:Math.min(cols,4),h:6
   }));
   return [bp,layout];
  }))};
  expect(upgradeLegacyDashboardConfig(legacy,'admin')).toEqual(current);
  const compact={...legacy,layouts:{...legacy.layouts,lg:[
   ...legacy.layouts.lg.slice(0,3).map(item=>({...item,h:4})),
   ...legacy.layouts.lg.slice(3,6).map((item,index)=>({...item,y:4,h:index===0?4:6})),
   {...legacy.layouts.lg[6],y:10}
  ]}};
  expect(upgradeLegacyDashboardConfig(compact,'admin')).toEqual(current);
  const custom={...legacy,layouts:{...legacy.layouts,lg:legacy.layouts.lg.map((item,index)=>index===0?{...item,x:1}:item)}};
  expect(upgradeLegacyDashboardConfig(custom,'admin')).toBe(custom);
 });
});

it('ships dedicated role-specific analytics without removing the prior attendance widget',()=>{
 const admin=defaultConfig('admin').widgets.map(w=>w.kind);
 const teacher=defaultConfig('teacher').widgets.map(w=>w.kind);
 const guardian=defaultConfig('guardian').widgets.map(w=>w.kind);
 expect(admin).toContain('enrollment_trend');
 expect(admin).toContain('students_by_grade');
 expect(admin).toContain('admission_status');
 expect(teacher).toContain('grades_by_subject');
 expect(teacher).toContain('attendance_trend');
 expect(guardian).toContain('grades_by_term');
 expect(guardian).toContain('assignment_progress');
 expect(guardian).not.toContain('enrollment_trend');
 expect(allowedChartKinds.student).not.toContain('admission_status');
 for(const role of ['admin','teacher','guardian','student'] as DashboardRole[]){
  expect(defaultConfig(role).widgets.map(w=>w.kind)).toContain('attendance_chart');
 }
});

it('upgrades only untouched role defaults and retains saved custom positions',()=>{
 const legacy=defaultConfig('student');
 expect(upgradeRoleCharts(legacy,'student')).toEqual(defaultConfig('student'));
 const previous=defaultConfig('student');
 const edited={...previous,layouts:{...previous.layouts,lg:previous.layouts.lg.map((item,i)=>({...item,y:item.y+i}))}};
 expect(upgradeRoleCharts(edited,'student')).toEqual(defaultConfig('student'));
 const custom=appendWidget(defaultConfig('admin'),'announcements','Reuniones','my_announcements');
 expect(upgradeRoleCharts(custom,'admin')).toBe(custom);
});
