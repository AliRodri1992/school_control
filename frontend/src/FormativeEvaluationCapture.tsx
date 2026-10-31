import {useEffect,useState} from 'react';
import {api,mean} from './api';
import Combobox from './shared/components/Combobox';
import type {Row} from './modules';

const FIELDS=[
 {code:'languages',name:'Lenguajes'},
 {code:'science',name:'Saberes y Pensamiento Científico'},
 {code:'ethics',name:'Ética, Naturaleza y Sociedades'},
 {code:'community',name:'De lo Humano y lo Comunitario'}
] as const;
const keyFor=(code:string,term:number)=>code+':'+term;

export default function FormativeEvaluationCapture({enrollments,canCreate,canPublish}:{enrollments:Row[];canCreate:boolean;canPublish:boolean}){
 const [enrollmentId,setEnrollmentId]=useState('');
 const [items,setItems]=useState<Row[]>([]);
 const [drafts,setDrafts]=useState<Record<string,{score:string;feedback:string}>>({});
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const eligible=enrollments.filter(item=>item.status==='active');
 useEffect(()=>{
  let active=true;
  setItems([]);setDrafts({});setError('');setNotice('');
  if(!enrollmentId)return;
  api('formative_evaluations?enrollment_id='+encodeURIComponent(enrollmentId)).then((rows:Row[])=>{
   if(!active)return;
   setItems(rows);
   const next:Record<string,{score:string;feedback:string}>={};
   rows.forEach(item=>{next[keyFor(item.field_code,item.term)]={score:String(item.score),feedback:item.feedback||''};});
   setDrafts(next);
  }).catch(e=>{if(active)setError((e as Error).message);});
  return ()=>{active=false;};
 },[enrollmentId]);
 const find=(code:string,term:number)=>items.find(item=>item.field_code===code&&Number(item.term)===term);
 const update=(code:string,term:number,field:'score'|'feedback',value:string)=>setDrafts(prev=>{
  const key=keyFor(code,term);return {...prev,[key]:{score:prev[key]?.score||'',feedback:prev[key]?.feedback||'',[field]:value}};
 });
 async function save(code:string,term:number){
  const key=keyFor(code,term),draft=drafts[key];
  const score=Number(draft?.score);
  if(!draft?.score||!Number.isFinite(score)||score<5||score>10){setError('La calificación debe ser un número entre 5 y 10.');return;}
  setBusy(key);setError('');setNotice('');
  try{
   const result=await api('formative_evaluations','POST',{enrollment_id:enrollmentId,field_code:code,term,score,feedback:draft.feedback});
   setItems(prev=>[...prev.filter(item=>!(item.field_code===code&&Number(item.term)===term)),result]);
   setNotice('Evaluación guardada en borrador.');
  }catch(e){setError((e as Error).message);}finally{setBusy('');}
 }
 async function publish(record:Row){
  const key=keyFor(record.field_code,Number(record.term));
  setBusy(key);setError('');setNotice('');
  try{
   const result=await api('formative_evaluations/'+record.id+'/publish','POST');
   setItems(prev=>prev.map(item=>item.id===result.id?result:item));
   setNotice('Evaluación publicada y disponible en la consulta del alumno.');
  }catch(e){setError((e as Error).message);}finally{setBusy('');}
 }
 return <section className="panel sc-formative-capture" aria-label="Evaluaciones por campos formativos">
  <header><div className="eyebrow">REGISTRO DE BOLETA · PRIMARIA</div><h2>Evaluaciones por campo formativo</h2>
   <p>Registra una valoración por campo y trimestre. Los exámenes, proyectos y actividades se administran por separado. Solo publica los resultados después de revisarlos.</p></header>
  <div className="form-grid"><div><label>Alumno y ciclo escolar</label><Combobox label="Alumno y ciclo escolar" value={enrollmentId} searchable={eligible.length>7}
   placeholder="Selecciona la inscripción" onChange={setEnrollmentId}
   options={eligible.map(entry=>({value:String(entry.id),label:entry.student_name+' · '+entry.group_label}))}/></div></div>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}
  {enrollmentId?<div className="table-scroll"><table><thead><tr><th>Campo formativo</th>{[1,2,3].map(term=><th key={term}>Trimestre {term}</th>)}<th>Promedio de referencia</th></tr></thead>
   <tbody>{FIELDS.map(field=><tr key={field.code}><th scope="row">{field.name}</th>{[1,2,3].map(term=>{
    const key=keyFor(field.code,term),record=find(field.code,term),published=record?.status==='published',draft=drafts[key]||{score:'',feedback:''};
    return <td key={term}><div className="sc-formative-cell"><label>Calificación<input aria-label={field.name+' trimestre '+term} type="number" min="5" max="10" step="0.1" value={draft.score} disabled={!!published||!canCreate||!!busy} onChange={e=>update(field.code,term,'score',e.target.value)}/></label>
     <label>Observaciones<textarea aria-label={'Observaciones '+field.name+' trimestre '+term} rows={2} value={draft.feedback} disabled={!!published||!canCreate||!!busy} onChange={e=>update(field.code,term,'feedback',e.target.value)}/></label>
     <small>{published?'Publicado':record?'Borrador':'Sin capturar'}</small>
     {!published&&canCreate&&<button className="secondary" type="button" disabled={!!busy} onClick={()=>void save(field.code,term)}>{busy===key?'Guardando…':'Guardar borrador'}</button>}
     {record&&!published&&canPublish&&<button className="primary" type="button" disabled={!!busy} onClick={()=>void publish(record)}>Publicar</button>}
    </div></td>;
   })}<td>{[1,2,3].every(term=>find(field.code,term)?.status==='published')?mean([1,2,3].map(term=>Number(find(field.code,term)?.score))):'Pendiente'}</td></tr>)}</tbody></table></div>:<p className="info">Selecciona un alumno para capturar sus tres evaluaciones parciales por campo formativo.</p>}
  <p className="footnote">El promedio mostrado es una referencia aritmética. La acreditación y la calificación oficial deben aplicar las disposiciones de la SEP y la autoridad educativa correspondiente.</p>
 </section>;
}
