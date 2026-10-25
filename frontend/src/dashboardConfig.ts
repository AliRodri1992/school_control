export type DashboardRole='admin'|'teacher'|'guardian'|'student';
/** Version distinguishes pre-analytics saved layouts from intentional user customizations. */
export const DASHBOARD_CONFIG_VERSION=2;
export const widgetKinds = {
 students: 'Expedientes', enrollments: 'Inscripciones activas', pending_admissions: 'Solicitudes pendientes',
 groups: 'Grupos', today_classes: 'Clases de hoy', grade_drafts: 'Calificaciones por revisar', pending_documents: 'Documentos pendientes', attendance_chart: 'Asistencia · últimos 30 días', admission_chart: 'Estado de solicitudes',
 enrollment_trend:'Matrícula por ciclo', students_by_grade:'Alumnos por grado', attendance_rate:'Distribución de asistencia', admission_status:'Estado de admisiones', attendance_trend:'Evolución de asistencia', grades_by_subject:'Promedio por materia', grades_by_term:'Rendimiento por periodo', grade_distribution:'Distribución de calificaciones', monthly_absences:'Faltas y retardos por mes', assignment_progress:'Entregas de tareas',
 alerts: 'Acompañamiento', calendar: 'Próximos eventos', announcements: 'Comunicados'
};
export type Kind = keyof typeof widgetKinds;
export const analyticChartKinds=['enrollment_trend','students_by_grade','attendance_rate','admission_status','attendance_trend','grades_by_subject','grades_by_term','grade_distribution','monthly_absences','assignment_progress'] as const;
export type AnalyticChartKind=(typeof analyticChartKinds)[number];
export const isAnalyticChartKind=(kind:Kind):kind is AnalyticChartKind=>analyticChartKinds.some(chart=>chart===kind);
export const allowedChartKinds:Record<DashboardRole,readonly Kind[]>={
 admin:['enrollment_trend','students_by_grade','attendance_rate','admission_status','attendance_trend','grades_by_subject','grades_by_term','grade_distribution','monthly_absences'],
 teacher:['attendance_rate','attendance_trend','grades_by_subject','grades_by_term','grade_distribution','monthly_absences'],
 guardian:['attendance_rate','attendance_trend','grades_by_term','grade_distribution','monthly_absences','assignment_progress'],
 student:['attendance_rate','attendance_trend','grades_by_term','monthly_absences','assignment_progress']
};
export const metricKinds=['students','enrollments','pending_admissions','groups','today_classes','grade_drafts','pending_documents'] as const;
export type MetricKind=(typeof metricKinds)[number];
export const isMetricKind=(kind:Kind):kind is MetricKind=>metricKinds.some(metric=>metric===kind);
export const widgetHeight=(kind:Kind):number=>isMetricKind(kind)?3:6;
export function widgetWidth(kind:Kind,breakpoint:string):number{
 const cols=columns[breakpoint]||1;
 if(breakpoint==='xs')return 1;
 if(isMetricKind(kind))return breakpoint==='lg'?3:breakpoint==='sm'?2:4;
 return breakpoint==='lg'?4:breakpoint==='md'?4:cols;
}
export type Widget = {id: string; kind: Kind; title: string};
export type Item = {i: string; x: number; y: number; w: number; h: number};
export type Config = {widgets: Widget[]; layouts: Record<string, Item[]>; schema_version?:number};
export const columns: Record<string, number> = {lg:12, md:8, sm:4, xs:1};

/** Place a new card in the next free space of the final row, never over existing content. */
export function nextWidgetPosition(items:readonly Item[],kind:Kind,bp:string):Omit<Item,'i'>{
 const w=widgetWidth(kind,bp),h=widgetHeight(kind),cols=columns[bp];
 const lastRowStart=items.reduce((max,item)=>Math.max(max,item.y),0);
 const lastEnd=items.reduce((max,item)=>Math.max(max,item.y+item.h),0);
 for(const y of [...new Set([lastRowStart,lastEnd])]){
  // Grid-aligned positions first; then accommodate previously customized widths.
  const xs=[...new Set([
   ...Array.from({length:Math.ceil(cols/w)},(_,index)=>index*w),
   ...Array.from({length:cols-w+1},(_,index)=>index)
  ])].filter(x=>x+w<=cols);
  for(const x of xs){
   const collision=items.some(item=>x<item.x+item.w&&x+w>item.x&&
    y<item.y+item.h&&y+h>item.y);
   if(!collision)return {x,y,w,h};
  }
 }
 return {x:0,y:lastEnd,w,h};
}
export function appendWidget(config: Config, kind: Kind, title: string, id: string = crypto.randomUUID()): Config {
 const layouts = Object.fromEntries(Object.entries(columns).map(([bp, cols]) => {
  const items = config.layouts[bp] || [];
  return [bp, [...items, {i:id,...nextWidgetPosition(items,kind,bp)}]];
 }));
 return {...config,widgets:[...config.widgets,{id,kind,title}],layouts};
}
export function removeWidget(config: Config, id: string): Config {
 return {...config,widgets:config.widgets.filter(w=>w.id!==id), layouts:Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.filter(i=>i.i!==id)]))};
}

export const presets: Record<DashboardRole,Kind[]> = {
 admin:['students','enrollments','pending_admissions','pending_documents','enrollment_trend','students_by_grade','attendance_rate','admission_status','attendance_chart','alerts','calendar'],
 teacher:['today_classes','grade_drafts','groups','attendance_trend','grades_by_subject','grades_by_term','grade_distribution','attendance_chart','alerts','calendar','announcements'],
 guardian:['students','today_classes','pending_documents','grades_by_term','attendance_rate','monthly_absences','assignment_progress','attendance_chart','calendar','announcements'],
 student:['today_classes','attendance_chart','calendar','announcements']
};
/** Build the grid for a precise widget catalog, including historical factory presets. */
export function generateDashboardConfig(kinds:readonly Kind[]):Config{
 const config = kinds
  .reduce((config,kind)=>appendWidget(config,kind,widgetKinds[kind],kind),{widgets:[],layouts:{}} as Config);
 for(const [bp,cols] of Object.entries(columns)){
  const layout:Item[]=[];
  let x=0,y=0,rowHeight=0;
  for(const widget of config.widgets){
   const w=widgetWidth(widget.kind,bp),h=widgetHeight(widget.kind);
   if(x+w>cols){y+=rowHeight;x=0;rowHeight=0;}
   layout.push({i:widget.id,x,y,w,h});
   x+=w;rowHeight=Math.max(rowHeight,h);
  }
  config.layouts[bp]=layout;
 }
 return config;
}
export function defaultConfig(role: DashboardRole='admin'):Config{
 return {...generateDashboardConfig(presets[role]),schema_version:DASHBOARD_CONFIG_VERSION};
}

/** Do not discard layouts for untouched breakpoints or widgets when the grid reflows. */
export function mergeGridLayouts(config:Config,layouts:Partial<Record<string,readonly Item[]>>):Config{
 const ids=config.widgets.map(widget=>widget.id).sort();
 const nextLayouts:Config['layouts']={};
 for(const breakpoint of Object.keys(columns)){
  const proposed=layouts[breakpoint];
  const existing=config.layouts[breakpoint]||[];
  const valid=Array.isArray(proposed)&&proposed.length===ids.length&&
   proposed.map(item=>item.i).sort().every((id,index)=>id===ids[index]);
  nextLayouts[breakpoint]=(valid?proposed:existing).map(({i,x,y,w,h})=>({i,x,y,w,h}));
 }
 return JSON.stringify(nextLayouts)===JSON.stringify(config.layouts)?config:{...config,layouts:nextLayouts};
}

/** Upgrade only untouched, legacy role presets. Never overwrite user-arranged dashboards. */
export function upgradeLegacyDashboardConfig(config:Config,role:DashboardRole):Config{
 const original=defaultConfig(role);
 if(config.widgets.length!==original.widgets.length||
  !config.widgets.every((widget,index)=>widget.id===original.widgets[index].id&&
   widget.kind===original.widgets[index].kind&&widget.title===original.widgets[index].title))return config;
 const existing=config.layouts?.lg;
 if(!Array.isArray(existing)||existing.length!==original.widgets.length)return config;
 // Old stock template used equal four-column widths, at either 6-row or mixed heights.
 const matchesOld=(kpiHeight:number,otherHeight:number)=>{
  let y=0,rowHeight=0;
  return existing.every((item,index)=>{
   if(index>0&&index%3===0){y+=rowHeight;rowHeight=0;}
   const expectedH=isMetricKind(original.widgets[index].kind)?kpiHeight:otherHeight;
   rowHeight=Math.max(rowHeight,expectedH);
   return item.i===original.widgets[index].id&&item.x===(index%3)*4&&
    item.y===y&&item.w===4&&item.h===expectedH;
  });
 };
 const oldSix=matchesOld(6,6);
 const oldCompact=matchesOld(4,6);
 return oldSix||oldCompact?original:config;
}

/** Upgrade only previous factory presets; customised cards/positions remain unchanged. */
export function upgradeRoleCharts(config:Config,role:DashboardRole):Config{
 const old:Record<DashboardRole,Kind[]>={
  admin:['students','enrollments','pending_admissions','pending_documents','attendance_chart','alerts','calendar'],
  teacher:['today_classes','grade_drafts','groups','attendance_chart','alerts','calendar','announcements'],
  guardian:['students','today_classes','pending_documents','attendance_chart','calendar','announcements'],
  student:['today_classes','attendance_chart','calendar','announcements']
 };
 const previous=old[role];
 const untouchedWidgets=previous.length===config.widgets.length&&previous.every((kind,index)=>
  config.widgets[index].id===kind&&config.widgets[index].kind===kind&&config.widgets[index].title===widgetKinds[kind]);
 if(!untouchedWidgets)return config;
 // Matching widget IDs alone is not enough: reordering and resizing are personalisations.
 const former=generateDashboardConfig(previous);
 const untouchedLayout=Object.keys(columns).every(bp=>{
  const saved=config.layouts?.[bp],expected=former.layouts[bp];
  return Array.isArray(saved)&&saved.length===expected.length&&saved.every((item,index)=>{
   const factory=expected[index];
   return item.i===factory.i&&item.x===factory.x&&item.y===factory.y&&
    item.w===factory.w&&item.h===factory.h;
  });
 });
 return untouchedLayout?defaultConfig(role):config;
}

/**
 * Repair only the four-chart (or role-equivalent) stack produced by the
 * pre-fix recovery routine. Every item must still have its generated ID,
 * title, width, height and exact consecutive x=0/y=max-end coordinates.
 * Manually moved/resized charts remain untouched, including versioned ones.
 */
export function compactAutoStackedAnalytics(config:Config,role:DashboardRole):Config{
 const kinds=presets[role].filter(isAnalyticChartKind);
 if(kinds.length<2)return config;
 const start=config.widgets.findIndex(widget=>widget.kind===kinds[0]&&
  widget.id===widget.kind&&widget.title===widgetKinds[widget.kind]);
 if(start<0||start+kinds.length>config.widgets.length)return config;
 const recovered=config.widgets.slice(start,start+kinds.length);
 if(!recovered.every((widget,index)=>widget.kind===kinds[index]&&
  widget.id===widget.kind&&widget.title===widgetKinds[widget.kind]))return config;
 const beforeIds=new Set(config.widgets.slice(0,start).map(widget=>widget.id));
 const nextLayouts:Config['layouts']={...config.layouts};
 let changed=false;
 for(const bp of Object.keys(columns)){
  const items=config.layouts[bp];
  if(!Array.isArray(items))continue;
  const remaining=items.filter(item=>beforeIds.has(item.i));
  let autoEnd=remaining.reduce((max,item)=>Math.max(max,item.y+item.h),0);
  const generated=items.filter(item=>recovered.some(widget=>widget.id===item.i));
  const isOriginalStack=generated.length===recovered.length&&
   recovered.every((widget,index)=>{
    const item=generated.find(item=>item.i===widget.id);
    if(!item)return false;
    const matches=item.x===0&&item.y===autoEnd&&
     item.w===widgetWidth(widget.kind,bp)&&item.h===widgetHeight(widget.kind);
    autoEnd+=widgetHeight(widget.kind);
    return matches;
   });
  if(!isOriginalStack||columns[bp]<2*widgetWidth(kinds[0],bp))continue;
  const recoveredIds=new Set(recovered.map(widget=>widget.id));
  const laterItems=items.filter(item=>!recoveredIds.has(item.i)&&!beforeIds.has(item.i));
  const laidOut=[...remaining];
  const repositioned=recovered.map(widget=>{
   const position={i:widget.id,...nextWidgetPosition(laidOut,widget.kind,bp)};
   laidOut.push(position);
   return position;
  });
  const overlapsLater=repositioned.some(position=>laterItems.some(item=>
   position.x<item.x+item.w&&position.x+position.w>item.x&&
   position.y<item.y+item.h&&position.y+position.h>item.y));
  if(overlapsLater)continue;
  const byId=new Map(repositioned.map(item=>[item.i,item]));
  if(!items.some(item=>byId.has(item.i)&&
   (byId.get(item.i)!.x!==item.x||byId.get(item.i)!.y!==item.y)))continue;
  nextLayouts[bp]=items.map(item=>byId.get(item.i)||item);
  changed=true;
 }
 return changed?{...config,layouts:nextLayouts}:config;
}

/**
 * Recover analytics introduced after users saved their layout.
 * Keep every existing widget, position, size and title. Only append missing
 * role-authorized analytics, and stamp the version on the next explicit save.
 * Versioned dashboards keep intentional chart removals; only identifiable
 * untouched auto-stacks are compacted into available row space.
 */
export function upgradeSavedDashboardConfig(saved:Config,role:DashboardRole):Config{
 if(saved.schema_version!==undefined&&saved.schema_version>=DASHBOARD_CONFIG_VERSION)
  return compactAutoStackedAnalytics(saved,role);
 const legacy=upgradeRoleCharts(upgradeLegacyDashboardConfig(saved,role),role);
 const required=presets[role].filter(isAnalyticChartKind);
 let next=legacy;
 for(const kind of required){
  if(next.widgets.some(widget=>widget.kind===kind)||next.widgets.length>=24)continue;
  let id=kind;
  let suffix=1;
  while(next.widgets.some(widget=>widget.id===id))id=kind+'-restored-'+suffix++;
  next=appendWidget(next,kind,widgetKinds[kind],id);
 }
 return compactAutoStackedAnalytics({...next,schema_version:DASHBOARD_CONFIG_VERSION},role);
}
