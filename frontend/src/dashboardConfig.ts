export const widgetKinds = {
 students: 'Expedientes', enrollments: 'Inscripciones activas', pending_admissions: 'Solicitudes pendientes',
 groups: 'Grupos', attendance_chart: 'Asistencia · últimos 30 días', admission_chart: 'Estado de solicitudes',
 alerts: 'Acompañamiento', calendar: 'Próximos eventos', announcements: 'Comunicados'
};
export type Kind = keyof typeof widgetKinds;
export type Widget = {id: string; kind: Kind; title: string};
export type Item = {i: string; x: number; y: number; w: number; h: number};
export type Config = {widgets: Widget[]; layouts: Record<string, Item[]>};
export const columns: Record<string, number> = {lg:12, md:8, sm:4, xs:1};
export function appendWidget(config: Config, kind: Kind, title: string, id: string = crypto.randomUUID()): Config {
 const layouts = Object.fromEntries(Object.entries(columns).map(([bp, cols]) => {
  const items = config.layouts[bp] || [];
  return [bp, [...items, {i:id, x:0, y:items.reduce((max,item)=>Math.max(max,item.y+item.h),0), w:Math.min(4,cols), h:kind.endsWith('_chart')?6:4}]];
 }));
 return {widgets:[...config.widgets,{id,kind,title}],layouts};
}
export function removeWidget(config: Config, id: string): Config {
 return {widgets:config.widgets.filter(w=>w.id!==id), layouts:Object.fromEntries(Object.entries(config.layouts).map(([bp,items])=>[bp,items.filter(i=>i.i!==id)]))};
}
export function defaultConfig(): Config {
 const config = (['students','enrollments','pending_admissions','attendance_chart','alerts','calendar'] as Kind[])
  .reduce((config,kind)=>appendWidget(config,kind,widgetKinds[kind],kind),{widgets:[],layouts:{}} as Config);
 for (const [bp, cols] of Object.entries(columns)) {
  const perRow = Math.max(1, Math.floor(cols / 4));
  config.layouts[bp] = config.layouts[bp].map((item,index)=>({...item,x:(index % perRow)*Math.min(4,cols),y:Math.floor(index/perRow)*6,h:6}));
 }
 return config;
}
