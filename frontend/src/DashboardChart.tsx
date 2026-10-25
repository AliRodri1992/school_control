import {Area,AreaChart,Bar,BarChart,CartesianGrid,Cell,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import type {AnalyticChartKind} from './dashboardConfig';

export type ChartPoint={label:string;value?:number;absent?:number;late?:number};
type Props={kind:AnalyticChartKind;data:unknown;title:string;translate:(value:string)=>string};

const palette=['#315fbe','#54a5d9','#8e7ce9','#f0b35d','#32a5a1','#d97781'];
const donuts:AnalyticChartKind[]=['attendance_rate','admission_status','assignment_progress'];
const lines:AnalyticChartKind[]=['enrollment_trend','grades_by_term'];
const areas:AnalyticChartKind[]=['attendance_trend'];
const horizontal:AnalyticChartKind[]=['students_by_grade','grades_by_subject'];
const percentage:AnalyticChartKind[]=['attendance_trend'];
const score:AnalyticChartKind[]=['grades_by_subject','grades_by_term'];
const readableDate=(value:string)=>/^\d{4}-\d{2}$/.test(value)?value.slice(5)+'/'+value.slice(2,4):value;

/** Charts present only server aggregates; missing data never produces synthetic results. */
export default function DashboardChart({kind,data,title,translate}:Props){
 const rows:Array<ChartPoint>=Array.isArray(data)?data.filter((item):item is ChartPoint=>
  item!==null&&typeof item==='object'&&typeof item.label==='string'&&
  (typeof item.value==='number'||(typeof item.absent==='number'&&typeof item.late==='number'))).map(item=>({
   ...item,label:readableDate(item.label)
  })):[];
 const hasData=rows.length>0&&(!donuts.includes(kind)||rows.some(row=>Number(row.value||0)>0));
 if(!hasData)return <div className="sc-analytics-empty" role="status">
  <strong>{translate('Sin datos para el periodo seleccionado')}</strong>
  <span>{translate('Cuando existan registros autorizados, aparecerá la gráfica aquí.')}</span>
 </div>;
 const units=percentage.includes(kind)?'%':score.includes(kind)?'/10':'';
 const tooltipFormatter=(value:unknown)=>`${Number(value||0).toLocaleString('es-MX',{maximumFractionDigits:2})}${units}`;
 if(donuts.includes(kind)){
  const total=rows.reduce((sum,item)=>sum+Number(item.value||0),0);
  return <div className="sc-analytics-donut" role="group" aria-label={title}>
   <div className="sc-analytics-plot">
    <ResponsiveContainer width="100%" height="100%">
     <PieChart>
      <Pie data={rows} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="83%" paddingAngle={2} strokeWidth={0}>
       {rows.map((row,index)=><Cell key={row.label} fill={palette[index%palette.length]}/>)}
      </Pie>
      <Tooltip formatter={tooltipFormatter}/>
     </PieChart>
    </ResponsiveContainer>
    <div className="sc-analytics-total"><strong>{total.toLocaleString('es-MX')}</strong><small>{translate('Registros')}</small></div>
   </div>
   <div className="sc-analytics-legend">
    {rows.map((row,index)=><div key={row.label} className="sc-analytics-legend-item">
     <span className="sc-analytics-color" style={{backgroundColor:palette[index%palette.length]}}/>
     <span>{translate(row.label)}</span>
     <strong>{Math.round((Number(row.value||0)/total)*100)}%</strong>
    </div>)}
   </div>
  </div>;
 }
 const tickStyle={fontSize:11,fill:'#667e9f'};
 const shared=<><CartesianGrid stroke="#eaf0f8" strokeDasharray="3 4" vertical={false}/><Tooltip formatter={tooltipFormatter}/></>;
 const chart=kind==='monthly_absences'?
  <BarChart data={rows} margin={{top:10,right:14,bottom:4,left:-14}}>
   {shared}
   <XAxis dataKey="label" tick={tickStyle}/><YAxis allowDecimals={false} tick={tickStyle}/>
   <Legend wrapperStyle={{fontSize:11}}/>
   <Bar dataKey="absent" name={translate('Faltas')} fill={palette[0]} radius={[5,5,0,0]}/>
   <Bar dataKey="late" name={translate('Retardos')} fill={palette[3]} radius={[5,5,0,0]}/>
  </BarChart>:
  lines.includes(kind)?
   <LineChart data={rows} margin={{top:10,right:18,bottom:5,left:-12}}>
    {shared}<XAxis dataKey="label" tick={tickStyle}/><YAxis domain={score.includes(kind)?[0,10]:[0,'auto']} tick={tickStyle}/>
    <Line type="monotone" dataKey="value" name={translate(title)} stroke={palette[0]} strokeWidth={2.75} dot={{r:3}} activeDot={{r:5}}/>
   </LineChart>:
   areas.includes(kind)?
    <AreaChart data={rows} margin={{top:10,right:18,bottom:5,left:-12}}>
     {shared}<XAxis dataKey="label" tick={tickStyle}/><YAxis domain={[0,100]} unit="%" tick={tickStyle}/>
     <Area type="monotone" dataKey="value" name={translate('Asistencia')} stroke={palette[0]} fill={palette[1]} fillOpacity={0.22} strokeWidth={2.5}/>
    </AreaChart>:
    <BarChart data={rows} layout={horizontal.includes(kind)?'vertical':'horizontal'}
     margin={horizontal.includes(kind)?{top:4,right:20,bottom:4,left:12}:{top:12,right:18,bottom:5,left:-10}}>
     {shared}
     {horizontal.includes(kind)?
      <><XAxis type="number" domain={score.includes(kind)?[0,10]:[0,'auto']} tick={tickStyle}/>
       <YAxis type="category" dataKey="label" width={Math.min(120,Math.max(55,...rows.map(item=>item.label.length*6)))} tick={tickStyle}/></>:
      <><XAxis dataKey="label" tick={tickStyle}/><YAxis allowDecimals={false} tick={tickStyle}/></>}
     <Bar dataKey="value" name={translate(title)} fill={palette[0]} radius={horizontal.includes(kind)?[0,5,5,0]:[5,5,0,0]} maxBarSize={42}/>
    </BarChart>;
 return <div className="sc-analytics-chart" role="group" aria-label={title}>
  <div className="sc-analytics-canvas">
   <ResponsiveContainer width="100%" height="100%">{chart}</ResponsiveContainer>
  </div>
  <div className="sc-analytics-chart-caption">{rows.length} {translate(rows.length===1?'categoría':'categorías')} · {translate('Datos reales del periodo seleccionado')}</div>
 </div>;
}
