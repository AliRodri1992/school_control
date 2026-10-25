export const widgetKinds = {
 students: 'Expedientes', enrollments: 'Inscripciones activas', pending_admissions: 'Solicitudes pendientes',
 groups: 'Grupos', today_classes: 'Clases de hoy', grade_drafts: 'Calificaciones por revisar', pending_documents: 'Documentos pendientes', attendance_chart: 'Asistencia · últimos 30 días', admission_chart: 'Estado de solicitudes',
 alerts: 'Acompañamiento', calendar: 'Próximos eventos', announcements: 'Comunicados'
};
export type Kind = keyof typeof widgetKinds;
export const metricKinds=['students','enrollments','pending_admissions','groups','today_classes','grade_drafts','pending_documents'] as const;
export type MetricKind=(typeof metricKinds)[number];
export const isMetricKind=(kind:Kind):kind is MetricKind=>metricKinds.some(metric=>metric===kind);
export const widgetHeight=(kind:Kind):number=>isMetricKind(kind)?4:6;
export type Widget = {id: string; kind: Kind; title: string};
export type Item = {i: string; x: number; y: number; w: number; h: number};
export type Config = {widgets: Widget[]; layouts: Record<string, Item[]>};
export const columns: Record<string, number> = {lg:12, md:8, sm:4, xs:1};
export function appendWidget(config: Config, kind: Kind, title: string, id: string = crypto.randomUUID()): Config {
 const layouts = Object.fromEntries(Object.entries(columns).map(([bp, cols]) => {
  const items = config.layouts[bp] || [];
  return [bp, [...items, {i:id, x:0, y:items.reduce((max,item)=>Math.max(max,item.y+item.h),0), w:Math.min(4,cols), h:widgetHeight(kind)}]];
 }));
 return {widgets:[...config.widgets,{id,kind,title}],layouts};
}
export function removeWidget(config: Config, id: string): Config {
 return {widgets:config.widgets.filter(w=>w.id!==id), layouts:Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.filter(i=>i.i!==id)]))};
}
export type DashboardRole='admin'|'teacher'|'guardian'|'student';
export const presets: Record<DashboardRole,Kind[]> = {
 admin:['students','enrollments','pending_admissions','pending_documents','attendance_chart','alerts','calendar'],
 teacher:['today_classes','grade_drafts','groups','attendance_chart','alerts','calendar','announcements'],
 guardian:['students','today_classes','pending_documents','attendance_chart','calendar','announcements'],
 student:['today_classes','attendance_chart','calendar','announcements']
};
export function defaultConfig(role: DashboardRole='admin'): Config {
 const config = presets[role]
  .reduce((config,kind)=>appendWidget(config,kind,widgetKinds[kind],kind),{widgets:[],layouts:{}} as Config);
 for(const [bp,cols] of Object.entries(columns)){
  const width=Math.min(4,cols);
  const perRow=Math.max(1,Math.floor(cols/width));
  const layout:Item[]=[];
  let y=0;
  for(let i=0;i<config.widgets.length;i+=perRow){
   const row=config.widgets.slice(i,i+perRow);
   for(const [index,widget] of row.entries()){
    layout.push({i:widget.id,x:index*width,y,w:width,h:widgetHeight(widget.kind)});
   }
   y+=Math.max(...row.map(widget=>widgetHeight(widget.kind)));
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
