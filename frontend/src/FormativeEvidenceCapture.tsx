import {useEffect,useState} from 'react';
import {api} from './api';
import Combobox from './shared/components/Combobox';
import type {Row} from './modules';

const fields=[
 {value:'languages',label:'Lenguajes'},
 {value:'science',label:'Saberes y Pensamiento Científico'},
 {value:'ethics',label:'Ética, Naturaleza y Sociedades'},
 {value:'community',label:'De lo Humano y lo Comunitario'}
];
const types=[
 {value:'exam',label:'Examen'},{value:'project',label:'Proyecto'},
 {value:'assignment',label:'Tarea'},{value:'activity',label:'Actividad'},
 {value:'observation',label:'Observación'},{value:'rubric',label:'Rúbrica'}
];
export default function FormativeEvidenceCapture({enrollmentId,canCreate}:{enrollmentId:string;canCreate:boolean}){
 const [items,setItems]=useState<Row[]>([]);
 const [field,setField]=useState('languages'),[term,setTerm]=useState('1'),[kind,setKind]=useState('project');
 const [title,setTitle]=useState(''),[score,setScore]=useState(''),[weight,setWeight]=useState('');
 const [feedback,setFeedback]=useState('');
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function refresh(){setItems(await api('formative_evidences?enrollment_id='+encodeURIComponent(enrollmentId)));}
 useEffect(()=>{let active=true;api('formative_evidences?enrollment_id='+encodeURIComponent(enrollmentId))
  .then((records:Row[])=>{if(active)setItems(records);})
  .catch(e=>{if(active)setError((e as Error).message);});return()=>{active=false;};},[enrollmentId]);
 const selected=items.filter(x=>x.field_code===field&&String(x.term)===term);
 const totalWeight=selected.reduce((sum,x)=>sum+Number(x.weight),0);
 const reference=totalWeight===100?
  (selected.reduce((sum,x)=>sum+Number(x.score)*Number(x.weight),0)/100).toFixed(2):null;
 async function submit(){
  if(!title.trim()||!score||!weight||Number(score)<0||Number(score)>10||
    Number(weight)<=0||Number(weight)>100||totalWeight+Number(weight)>100){
   setError('Revisa el título, la calificación y la ponderación. La suma no debe superar 100 %.');return;
  }
  setSaving(true);setError('');setNotice('');
  try{
   await api('formative_evidences','POST',{enrollment_id:enrollmentId,field_code:field,term:Number(term),
    kind,title:title.trim(),score:Number(score),weight:Number(weight),feedback});
   await refresh();setTitle('');setScore('');setWeight('');setFeedback('');
   setNotice('Evidencia registrada. Este promedio no sustituye la valoración del docente.');
  }catch(e){setError((e as Error).message);}finally{setSaving(false);}
 }
 async function remove(id:number){
  if(!window.confirm('¿Eliminar esta evidencia interna?'))return;
  setSaving(true);setError('');
  try{await api('formative_evidences/'+id,'DELETE');await refresh();}
  catch(e){setError((e as Error).message);}finally{setSaving(false);}
 }
 return <section className="sc-evidence-capture" aria-label="Evidencias de aprendizaje">
  <header><h3>Evidencias y ponderaciones internas</h3><p>Las evidencias orientan la valoración docente; no generan ni publican una calificación oficial automáticamente.</p></header>
  <div className="sc-evidence-filters">
   <Combobox label="Campo formativo de la evidencia" value={field} onChange={setField} options={fields} searchable={false}/>
   <Combobox label="Trimestre de la evidencia" value={term} onChange={setTerm} options={[1,2,3].map(value=>({value:String(value),label:'Trimestre '+value}))} searchable={false}/>
  </div>
  <div className="sc-evidence-summary"><strong>Ponderación registrada: {totalWeight} %</strong>
   <span>{reference===null?'Promedio interno pendiente de completar el 100 %':'Promedio interno de referencia: '+reference}</span></div>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}
  {selected.length>0&&<div className="table-scroll"><table><thead><tr><th>Evidencia</th><th>Tipo</th><th>Nota</th><th>Peso</th><th>Acción</th></tr></thead><tbody>
   {selected.map(item=><tr key={item.id}><td>{item.title}</td><td>{types.find(x=>x.value===item.kind)?.label||item.kind}</td><td>{item.score}</td><td>{item.weight} %</td>
    <td>{canCreate&&<button type="button" className="secondary" disabled={saving} onClick={()=>void remove(Number(item.id))}>Eliminar</button>}</td></tr>)}
  </tbody></table></div>}
  {canCreate&&<div className="sc-evidence-editor">
   <label>Instrumento <Combobox label="Tipo de evidencia" value={kind} onChange={setKind} options={types} searchable={false}/></label>
   <label>Nombre de la evidencia<input value={title} maxLength={160} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Proyecto de ciencias"/></label>
   <label>Calificación interna (0–10)<input type="number" min="0" max="10" step="0.01" value={score} onChange={e=>setScore(e.target.value)}/></label>
   <label>Ponderación (%)<input type="number" min="0.01" max="100" step="0.01" value={weight} onChange={e=>setWeight(e.target.value)}/></label>
   <label className="sc-evidence-wide">Retroalimentación<textarea rows={2} value={feedback} onChange={e=>setFeedback(e.target.value)}/></label>
   <button type="button" className="primary" disabled={saving} onClick={()=>void submit()}>{saving?'Guardando…':'Agregar evidencia'}</button>
  </div>}
 </section>;
}
