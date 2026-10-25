import {describe,it,expect} from 'vitest';
import {defaultConfig,appendWidget,removeWidget,columns,isMetricKind,widgetHeight,metricKinds,mergeGridLayouts,upgradeLegacyDashboardConfig,upgradeRoleCharts,generateDashboardConfig,allowedChartKinds,upgradeSavedDashboardConfig,compactAutoStackedAnalytics,nextWidgetPosition,widgetWidth,widgetKinds,DASHBOARD_CONFIG_VERSION,type DashboardRole,type Config,type Kind} from './dashboardConfig';
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
  expect(expanded.schema_version).toBe(DASHBOARD_CONFIG_VERSION);
  expect(removed.schema_version).toBe(DASHBOARD_CONFIG_VERSION);
 });
 it('places new widgets beside the last row when there is room, otherwise below it',()=>{
  const initial=defaultConfig();const next=appendWidget(initial,'groups','Grupos','new');
  for(const [bp,items] of Object.entries(initial.layouts)){
   const added=next.layouts[bp].at(-1)!;
   expect(added.y).toBeGreaterThanOrEqual(Math.max(...items.map(i=>i.y)));
   expect(added.x+added.w).toBeLessThanOrEqual(columns[bp]);
   expect(items.every(item=>added.x>=item.x+item.w||
    added.x+added.w<=item.x||added.y>=item.y+item.h||
    added.y+added.h<=item.y)).toBe(true);
  }
  expect(next.layouts.lg.at(-1)!.y).toBeLessThan(
   Math.max(...initial.layouts.lg.map(item=>item.y+item.h)));
  expect(next.layouts.xs.at(-1)!.x).toBe(0);
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
  const content=dashboard.layouts.lg.filter(item=>!expected.includes(item.i));
  expect(content).toHaveLength(dashboard.widgets.length-4);
  expect(content.every(item=>item.y>=3&&item.w===4&&item.h===6)).toBe(true);
  const finalY=Math.max(...dashboard.layouts.lg.map(item=>item.y+item.h));
  expect(finalY).toBe(3+Math.ceil(content.length/3)*6);
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
  expect(upgradeLegacyDashboardConfig(compact,'admin')).toBe(compact);
  const custom={...legacy,layouts:{...legacy.layouts,lg:legacy.layouts.lg.map((item,index)=>index===0?{...item,x:1}:item)}};
  expect(upgradeLegacyDashboardConfig(custom,'admin')).toBe(custom);
 });
});

it('keeps four administrator analytics in a 2 by 2 grid and the three context cards on one row',()=>{
 const config=defaultConfig('admin');
 const find=(id:string)=>config.layouts.lg.find(item=>item.i===id)!;
 const analytics=['enrollment_trend','students_by_grade','attendance_rate','admission_status'].map(find);
 expect(analytics.map(item=>[item.x,item.y,item.w])).toEqual([
  [0,3,6],[6,3,6],[0,9,6],[6,9,6]
 ]);
 const contexts=['attendance_chart','alerts','calendar'].map(find);
 expect(contexts.map(item=>item.x)).toEqual([0,4,8]);
 expect(new Set(contexts.map(item=>item.y)).size).toBe(1);
 expect(contexts[0].y).toBe(15);
});

it('migrates only an untouched former 3-column administrator preset',()=>{
 const current=defaultConfig('admin');
 const old=generateDashboardConfig(presets.admin);
 let x=0,y=0,rowHeight=0;
 const lg=old.widgets.map(widget=>{
  const w=widgetWidth(widget.kind,'lg'),h=widgetHeight(widget.kind);
  if(x+w>12){y+=rowHeight;x=0;rowHeight=0;}
  const item={i:widget.id,x,y,w,h};x+=w;rowHeight=Math.max(rowHeight,h);
  return item;
 });
 const saved={...old,layouts:{...old.layouts,lg},schema_version:2};
 expect(upgradeSavedDashboardConfig(saved,'admin').layouts.lg).toEqual(current.layouts.lg);
 const moved={...saved,layouts:{...saved.layouts,lg:saved.layouts.lg.map((item,index)=>
  index===4?{...item,x:1}:item)}};
 expect(upgradeSavedDashboardConfig(moved,'admin').layouts.lg).toEqual(moved.layouts.lg);
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
 const previous=generateDashboardConfig(['students','enrollments','pending_admissions','pending_documents','attendance_chart','alerts','calendar']);
 expect(upgradeRoleCharts(previous,'admin')).toEqual(defaultConfig('admin'));
 const edited={...previous,layouts:{...previous.layouts,lg:previous.layouts.lg.map((item,i)=>({...item,y:item.y+i}))}};
 expect(upgradeRoleCharts(edited,'admin')).toBe(edited);
 const mobileMoved={...previous,layouts:{...previous.layouts,xs:previous.layouts.xs.map((item,i)=>({...item,y:item.y+i}))}};
 expect(upgradeRoleCharts(mobileMoved,'admin')).toBe(mobileMoved);
 const resized={...previous,layouts:{...previous.layouts,md:previous.layouts.md.map((item,i)=>i===0?{...item,h:item.h+1}:item)}};
 expect(upgradeRoleCharts(resized,'admin')).toBe(resized);
 const custom=appendWidget(defaultConfig('admin'),'announcements','Reuniones','my_announcements');
 expect(upgradeRoleCharts(custom,'admin')).toBe(custom);
});


it.each([
 ['teacher',['today_classes','grade_drafts','groups','attendance_chart','alerts','calendar','announcements']],
 ['guardian',['students','today_classes','pending_documents','attendance_chart','calendar','announcements']]
] as const)('upgrades the original %s layout but respects previously resized cards', (role,kinds)=>{
 const legacy=generateDashboardConfig(kinds);
 expect(upgradeRoleCharts(legacy,role)).toEqual(defaultConfig(role));
 const custom={...legacy,layouts:{...legacy.layouts,lg:legacy.layouts.lg.map((item,index)=>index===0?{...item,h:item.h+1}:item)}};
 expect(upgradeRoleCharts(custom,role)).toBe(custom);
});

describe('restoring analytics hidden by older saved dashboards',()=>{
 const required=['enrollment_trend','students_by_grade','attendance_rate','admission_status'];
 const olderKinds=['students','enrollments','pending_admissions','pending_documents','attendance_chart','alerts','calendar'] as const;
 it('recovers all four graphs in a customized administrator dashboard without resetting other widgets',()=>{
  const old=appendWidget(generateDashboardConfig(olderKinds),'announcements','Mi bloque personal','custom-announcements');
  const moved:Config={...old,layouts:{...old.layouts,lg:old.layouts.lg.map((item,index)=>index===0?
   {...item,x:4,y:99,h:4}:item)}};
  const restored=upgradeSavedDashboardConfig(moved,'admin');
  expect(restored.schema_version).toBe(DASHBOARD_CONFIG_VERSION);
  for(const kind of required)expect(restored.widgets.filter(widget=>widget.kind===kind)).toHaveLength(1);
  expect(restored.widgets.slice(0,moved.widgets.length)).toEqual(moved.widgets);
  for(const bp of Object.keys(columns)){
   expect(restored.layouts[bp].slice(0,moved.layouts[bp].length)).toEqual(moved.layouts[bp]);
   expect(restored.layouts[bp].map(item=>item.i).sort()).toEqual(restored.widgets.map(widget=>widget.id).sort());
   expect(restored.layouts[bp].every(item=>item.x+item.w<=columns[bp])).toBe(true);
  }
  expect(restored.layouts.lg[0]).toEqual({i:'students',x:4,y:99,w:3,h:4});
 });
 it('does not duplicate already present charts, including user-renamed instances',()=>{
  const old=appendWidget(generateDashboardConfig(olderKinds),'attendance_rate','Mi asistencia','my-attendance');
  const restored=upgradeSavedDashboardConfig(old,'admin');
  expect(restored.widgets.filter(widget=>widget.kind==='attendance_rate')).toHaveLength(1);
  expect(restored.widgets.find(widget=>widget.id==='my-attendance')?.title).toBe('Mi asistencia');
  for(const kind of required)expect(restored.widgets.filter(widget=>widget.kind===kind)).toHaveLength(1);
 });
 it('keeps deliberate removals and manual arrangements on already-updated dashboards',()=>{
  const removed=removeWidget(defaultConfig('admin'),'admission_status');
  const edited={...removed,layouts:{...removed.layouts,lg:removed.layouts.lg.map((item,index)=>index===0?
   {...item,x:5}:item)}};
  expect(upgradeSavedDashboardConfig(edited,'admin')).toBe(edited);
  expect(edited.widgets.some(widget=>widget.kind==='admission_status')).toBe(false);
  expect(edited.schema_version).toBe(DASHBOARD_CONFIG_VERSION);
  const removedAgain=removeWidget(edited,'attendance_rate');
  expect(removedAgain.schema_version).toBe(DASHBOARD_CONFIG_VERSION);
  expect(upgradeSavedDashboardConfig(removedAgain,'admin')).toBe(removedAgain);
  expect(removedAgain.widgets.some(widget=>widget.kind==='attendance_rate')).toBe(false);
 });
 it('never inserts analytics outside the authorized role or exceeds the widget limit',()=>{
  const family=generateDashboardConfig(['students','calendar']);
  const recovered=upgradeSavedDashboardConfig(family,'guardian');
  expect(recovered.widgets.some(widget=>widget.kind==='admission_status')).toBe(false);
  expect(recovered.widgets.some(widget=>widget.kind==='enrollment_trend')).toBe(false);
  expect(recovered.widgets.some(widget=>widget.kind==='attendance_rate')).toBe(true);
  const full=generateDashboardConfig(olderKinds);
  for(let index=0;index<17;index++){
   const next=appendWidget(full,'announcements','Extra '+index,'extra-'+index);
   full.widgets=next.widgets;full.layouts=next.layouts;
  }
  expect(full.widgets).toHaveLength(24);
  expect(upgradeSavedDashboardConfig(full,'admin').widgets).toHaveLength(24);
 });
});

it('keeps the schema version intact through add, move, and delete flows',()=>{
 const original=defaultConfig('admin');
 const added=appendWidget(original,'announcements','Novedades','new-widget');
 expect(added.schema_version).toBe(2);
 const layout=mergeGridLayouts(added,{lg:added.layouts.lg.map(item=>({...item}))});
 expect(layout.schema_version).toBe(2);
 const deleted=removeWidget(layout,'admission_status');
 expect(deleted.schema_version).toBe(2);
 expect(upgradeSavedDashboardConfig(deleted,'admin')).toBe(deleted);
 expect(deleted.widgets.some(widget=>widget.kind==='admission_status')).toBe(false);
});

/** Simulates configurations saved by the old x=0/max-end append algorithm. */
function formerlyStackedAnalytics(role:DashboardRole='admin',extra=false):Config{
 const originals:Record<DashboardRole,Kind[]>={
  admin:['students','enrollments','pending_admissions','pending_documents','attendance_chart','alerts','calendar'],
  teacher:['today_classes','grade_drafts','groups','attendance_chart','alerts','calendar','announcements'],
  guardian:['students','today_classes','pending_documents','attendance_chart','calendar','announcements'],
  student:['today_classes','attendance_chart','calendar','announcements']
 };
 const base=generateDashboardConfig(originals[role]);
 let config=extra?appendWidget(base,'announcements','Mi bloque','custom-block'):base;
 const charts=defaultConfig(role).widgets.filter(widget=>!config.widgets.some(existing=>existing.kind===widget.kind));
 for(const chart of charts){
  const layouts=Object.fromEntries(Object.entries(columns).map(([bp])=>{
   const original=config.layouts[bp];
   const y=Math.max(0,...original.map(item=>item.y+item.h));
   return [bp,[...original,{i:chart.id,x:0,y,w:widgetWidth(chart.kind,bp),h:widgetHeight(chart.kind)}]];
  }));
  config={...config,layouts,widgets:[...config.widgets,chart]};
 }
 return {...config,schema_version:DASHBOARD_CONFIG_VERSION};
}
describe('repairing recovered chart placement',()=>{
 it('places three of the four administrator charts together in desktop rows',()=>{
  const stacked=formerlyStackedAnalytics();
  const repaired=upgradeSavedDashboardConfig(stacked,'admin');
  const ids=['enrollment_trend','students_by_grade','attendance_rate','admission_status'];
  const charts=ids.map(id=>repaired.layouts.lg.find(item=>item.i===id)!);
  expect(charts.map(item=>item.x)).toEqual([0,4,8,0]);
  expect(charts.map(item=>item.y)).toEqual([charts[0].y,charts[0].y,charts[0].y,charts[0].y+6]);
  const mdCharts=repaired.layouts.md.filter(item=>ids.includes(item.i));
  const parallel=mdCharts.some((first,index)=>mdCharts.slice(index+1).some(second=>
   first.y===second.y&&first.x!==second.x));
  expect(parallel).toBe(true);
  expect(new Set(mdCharts.map(item=>item.y)).size).toBeLessThan(4);
  for(const bp of ['sm','xs'])expect(repaired.layouts[bp]).toEqual(stacked.layouts[bp]);
  const originalIds=stacked.widgets.slice(0,-4).map(widget=>widget.id);
  for(const bp of Object.keys(columns)){
   for(const id of originalIds){
    expect(repaired.layouts[bp].find(item=>item.i===id)).toEqual(stacked.layouts[bp].find(item=>item.i===id));
   }
  }
  expect(repaired.widgets).toEqual(stacked.widgets);
  expect(repaired.schema_version).toBe(2);
 });
 it('does not touch manually resized or moved analytical charts',()=>{
  const stacked=formerlyStackedAnalytics();
  const moved:Config={...stacked,layouts:{...stacked.layouts,
   lg:stacked.layouts.lg.map(item=>item.i==='students_by_grade'?{...item,x:4}:item)}};
  const repaired=compactAutoStackedAnalytics(moved,'admin');
  expect(repaired.layouts.lg).toEqual(moved.layouts.lg);
  expect(repaired.layouts.md).not.toEqual(moved.layouts.md); // still fix untouched tablet layout
  const resized={...stacked,layouts:{...stacked.layouts,
   lg:stacked.layouts.lg.map(item=>item.i==='enrollment_trend'?{...item,w:6}:item)}};
  expect(compactAutoStackedAnalytics(resized,'admin').layouts.lg).toEqual(resized.layouts.lg);
 });
 it('restores vertical stacks saved with version 2 even when the user had other widgets',()=>{
  const stacked=formerlyStackedAnalytics('admin',true);
  const repaired=upgradeSavedDashboardConfig(stacked,'admin');
  expect(repaired.widgets.map(widget=>widget.id)).toEqual(stacked.widgets.map(widget=>widget.id));
  expect(repaired.layouts.lg.filter(item=>item.i==='custom-block')).toEqual(
   stacked.layouts.lg.filter(item=>item.i==='custom-block'));
  const chartPositions=repaired.layouts.lg.filter(item=>[
   'enrollment_trend','students_by_grade','attendance_rate','admission_status'].includes(item.i));
  expect(new Set(chartPositions.map(item=>item.y)).size).toBeLessThan(4);
  for(const bp of Object.keys(columns)){
   const items=repaired.layouts[bp];
   for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j];
    expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y).toBe(true);
   }
  }
 });
 it('does not rewrite correctly arranged presets or intentionally removed charts',()=>{
  const admin=defaultConfig('admin');
  expect(upgradeSavedDashboardConfig(admin,'admin')).toBe(admin);
  const revised=removeWidget(admin,'admission_status');
  expect(upgradeSavedDashboardConfig(revised,'admin')).toBe(revised);
  expect(revised.widgets.some(widget=>widget.kind==='admission_status')).toBe(false);
 });
 it('keeps all chart layouts within their breakpoints after recovering older presets',()=>{
  for(const role of ['admin','teacher','guardian','student'] as DashboardRole[]){
   const saved=formerlyStackedAnalytics(role);
   const updated=upgradeSavedDashboardConfig(saved,role);
   expect(updated.widgets).toEqual(saved.widgets);
   for(const bp of Object.keys(columns)){
    const items=updated.layouts[bp];
    expect(items.every(item=>item.x>=0&&item.x+item.w<=columns[bp])).toBe(true);
    expect(items.length).toBe(updated.widgets.length);
   }
  }
 });
 it('does not leave a trailing widget stacked if another card fits on the last row',()=>{
  const old=generateDashboardConfig(['students','enrollments','pending_admissions','pending_documents',
   'attendance_chart','alerts','calendar']);
  const first=appendWidget(old,'enrollment_trend',widgetKinds.enrollment_trend,'trend');
  const second=appendWidget(first,'students_by_grade',widgetKinds.students_by_grade,'grade');
  const third=appendWidget(second,'attendance_rate',widgetKinds.attendance_rate,'rate');
  const y=first.layouts.lg.find(item=>item.i==='trend')!.y;
  expect(second.layouts.lg.find(item=>item.i==='grade')).toMatchObject({x:4,y});
  expect(third.layouts.lg.find(item=>item.i==='rate')).toMatchObject({x:8,y});
  expect(nextWidgetPosition(third.layouts.lg,'admission_status','lg')).toMatchObject({x:0,y:y+6});
 });
});

it('reflows only the auto-stacked missing graphs when Matrícula por ciclo was already present',()=>{
 const base=generateDashboardConfig([
  'students','enrollments','pending_admissions','pending_documents',
  'attendance_chart','alerts','calendar','enrollment_trend'
 ]);
 let old:Config={...base,schema_version:2};
 for(const kind of ['students_by_grade','attendance_rate','admission_status'] as Kind[]){
  const layouts=Object.fromEntries(Object.keys(columns).map(bp=>{
   const items=old.layouts[bp];
   return [bp,[...items,{i:kind,x:0,y:Math.max(...items.map(item=>item.y+item.h)),
    w:widgetWidth(kind,bp),h:widgetHeight(kind)}]];
  }));
  old={...old,widgets:[...old.widgets,{id:kind,kind,title:widgetKinds[kind]}],layouts};
 }
 const corrected=upgradeSavedDashboardConfig(old,'admin');
 const ids=['students_by_grade','attendance_rate','admission_status'];
 const lg=ids.map(id=>corrected.layouts.lg.find(item=>item.i===id)!);
 expect(new Set(lg.map(item=>item.y)).size).toBe(1);
 expect(lg.map(item=>item.x)).toEqual([0,4,8]);
 for(const bp of Object.keys(columns)){
  for(const item of base.layouts[bp])
   expect(corrected.layouts[bp].find(entry=>entry.i===item.i)).toEqual(item);
 }
 expect(corrected.widgets).toEqual(old.widgets);
 const manuallyMoved:Config={...old,layouts:{...old.layouts,
  lg:old.layouts.lg.map(item=>item.i==='attendance_rate'?{...item,x:4}:item)}};
 expect(upgradeSavedDashboardConfig(manuallyMoved,'admin').layouts.lg).toEqual(manuallyMoved.layouts.lg);
});
