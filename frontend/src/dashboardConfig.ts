export type DashboardRole='admin'|'teacher'|'guardian'|'student';
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
export type Config = {widgets: Widget[]; layouts: Record<string, Item[]>};
export const columns: Record<string, number> = {lg:12, md:8, sm:4, xs:1};
export function appendWidget(config: Config, kind: Kind, title: string, id: string = crypto.randomUUID()): Config {
 const layouts = Object.fromEntries(Object.entries(columns).map(([bp, cols]) => {
  const items = config.layouts[bp] || [];
  return [bp, [...items, {i:id, x:0, y:items.reduce((max,item)=>Math.max(max,item.y+item.h),0), w:widgetWidth(kind,bp), h:widgetHeight(kind)}]];
 }));
 return {widgets:[...config.widgets,{id,kind,title}],layouts};
}
export function removeWidget(config: Config, id: string): Config {
 return {widgets:config.widgets.filter(w=>w.id!==id), layouts:Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.filter(i=>i.i!==id)]))};
}

export const presets: Record<DashboardRole,Kind[]> = {
 admin:['students','enrollments','pending_admissions','pending_documents','enrollment_trend','students_by_grade','attendance_rate','admission_status','attendance_chart','alerts','calendar'],
 teacher:['today_classes','grade_drafts','groups','attendance_trend','grades_by_subject','grades_by_term','grade_distribution','attendance_chart','alerts','calendar','announcements'],
 guardian:['students','today_classes','pending_documents','grades_by_term','attendance_rate','monthly_absences','assignment_progress','attendance_chart','calendar','announcements'],
 student:['today_classes','attendance_chart','calendar','announcements']
};
export function defaultConfig(role: DashboardRole='admin'): Config {
 const config = presets[role]
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
 const untouched=previous.length===config.widgets.length&&previous.every((kind,index)=>
  config.widgets[index].id===kind&&config.widgets[index].kind===kind&&config.widgets[index].title===widgetKinds[kind]);
 return untouched?defaultConfig(role):config;
}
