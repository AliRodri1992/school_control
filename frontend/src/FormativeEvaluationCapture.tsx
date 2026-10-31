import {useEffect,useState} from 'react';
import Swal from 'sweetalert2';
import {api} from './api';
import FormativeEvidenceCapture from './FormativeEvidenceCapture';
import Combobox from './shared/components/Combobox';
import type {Row} from './modules';

const FIELDS=[
 {code:'languages',name:'Lenguajes'},
 {code:'science',name:'Saberes y Pensamiento Científico'},
 {code:'ethics',name:'Ética, Naturaleza y Sociedades'},
 {code:'community',name:'De lo Humano y lo Comunitario'}
] as const;
const keyFor=(code:string,term:number)=>code+':'+term;

export default function FormativeEvaluationCapture({enrollments,canCreate,canPublish,canCorrect=false}:{enrollments:Row[];canCreate:boolean;canPublish:boolean;canCorrect?:boolean}){
 const [enrollmentId,setEnrollmentId]=useState('');
 const [items,setItems]=useState<Row[]>([]);
 const [drafts,setDrafts]=useState<Record<string,{score:string;feedback:string}>>({});
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [academicResult,setAcademicResult]=useState<Row|null>(null);
 const [sourceKind,setSourceKind]=useState<'school'|'transfer'>('school');
 const [sourceSchool,setSourceSchool]=useState(''),[sourceDocument,setSourceDocument]=useState('');
 const current=enrollments.find(item=>String(item.id)===enrollmentId);
 const minScore=Number(current?.grade_level||1)<=2?6:5;
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
 useEffect(()=>{
  if(!enrollmentId){setAcademicResult(null);return;}
  let active=true;
  api('formative_evaluations/summary?enrollment_id='+encodeURIComponent(enrollmentId))
   .then(result=>{if(active)setAcademicResult(result);})
   .catch(e=>{if(active)setError((e as Error).message);});
  return()=>{active=false;};
 },[enrollmentId,items]);
 const find=(code:string,term:number)=>items.find(item=>item.field_code===code&&Number(item.term)===term);
 const update=(code:string,term:number,field:'score'|'feedback',value:string)=>setDrafts(prev=>{
  const key=keyFor(code,term);return {...prev,[key]:{score:prev[key]?.score||'',feedback:prev[key]?.feedback||'',[field]:value}};
 });
 async function save(code:string,term:number){
  const key=keyFor(code,term),draft=drafts[key];
  const score=Number(draft?.score);
  if(!draft?.score||!Number.isInteger(score)||score<minScore||score>10){setError('La calificación oficial debe ser un entero entre '+minScore+' y 10.');return;}
  if(sourceKind==='transfer'&&(!sourceSchool.trim()||!sourceDocument.trim())){setError('Un traslado requiere escuela de origen y referencia del documento de respaldo.');return;}
  setBusy(key);setError('');setNotice('');
  try{
   const result=await api('formative_evaluations','POST',{enrollment_id:enrollmentId,field_code:code,term,score,feedback:draft.feedback,source_kind:sourceKind,
    source_school:sourceKind==='transfer'?sourceSchool.trim():null,
    source_document_ref:sourceKind==='transfer'?sourceDocument.trim():null});
   setItems(prev=>[...prev.filter(item=>!(item.field_code===code&&Number(item.term)===term)),result]);
   setNotice('Evaluación guardada en borrador.');
  }catch(e){setError((e as Error).message);}finally{setBusy('');}
 }
 async function correct(record:Row){
  const key=keyFor(record.field_code,Number(record.term));
  const response=await Swal.fire({
   title:'Rectificar evaluación publicada',
   html:'<p>La rectificación quedará auditada. Captura la calificación y el motivo.</p>',
   input:'textarea',inputLabel:'Motivo de la rectificación',inputPlaceholder:'Describe por qué se rectifica esta evaluación…',
   showCancelButton:true,confirmButtonText:'Continuar',cancelButtonText:'Cancelar',reverseButtons:true
  });
  if(!response.isConfirmed)return;
  const reason=String(response.value||'').trim();
  if(reason.length<10){setError('El motivo de la rectificación debe tener al menos 10 caracteres.');return;}
  const scoreInput=await Swal.fire({title:'Calificación rectificada',input:'number',
   inputAttributes:{min:String(minScore),max:'10',step:'1'},inputValue:String(record.score),
   showCancelButton:true,confirmButtonText:'Guardar rectificación',cancelButtonText:'Cancelar'});
  if(!scoreInput.isConfirmed)return;
  const score=Number(scoreInput.value);
  if(!Number.isInteger(score)||score<minScore||score>10){setError('La calificación rectificada debe ser un entero entre '+minScore+' y 10.');return;}
  setBusy(key);setError('');setNotice('');
  try{
   const updated=await api('formative_evaluations/'+record.id+'/correct','POST',
    {score,feedback:record.feedback,reason,lock_version:record.lock_version});
   setItems(prev=>prev.map(item=>item.id===updated.id?updated:item));
   setDrafts(prev=>({...prev,[key]:{score:String(updated.score),feedback:updated.feedback||''}}));
   setNotice('Rectificación autorizada registrada en la auditoría.');
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
  {enrollmentId&&<div className="sc-formative-origin">
   <label>Procedencia de las calificaciones <Combobox label="Procedencia" value={sourceKind} onChange={value=>setSourceKind(value as 'school'|'transfer')} searchable={false}
     options={[{value:'school',label:'Captura de la escuela'},{value:'transfer',label:'Traslado desde otra escuela'}]}/></label>
   {sourceKind==='transfer'&&<><label>Escuela de origen<input value={sourceSchool} onChange={e=>setSourceSchool(e.target.value)} placeholder="Nombre y/o CCT"/></label>
     <label>Referencia del documento<input value={sourceDocument} onChange={e=>setSourceDocument(e.target.value)} placeholder="Folio o constancia"/></label></>}
  </div>}
  {enrollmentId?<div className="table-scroll"><table><thead><tr><th>Campo formativo</th>{[1,2,3].map(term=><th key={term}>Trimestre {term}</th>)}<th>Promedio de referencia</th></tr></thead>
   <tbody>{FIELDS.map(field=><tr key={field.code}><th scope="row">{field.name}</th>{[1,2,3].map(term=>{
    const key=keyFor(field.code,term),record=find(field.code,term),published=record?.status==='published',draft=drafts[key]||{score:'',feedback:''};
    return <td key={term}><div className="sc-formative-cell"><label>Calificación<input aria-label={field.name+' trimestre '+term} type="number" min={minScore} max="10" step="1" value={draft.score} disabled={!!published||!canCreate||!!busy} onChange={e=>update(field.code,term,'score',e.target.value)}/></label>
     <label>Observaciones<textarea aria-label={'Observaciones '+field.name+' trimestre '+term} rows={2} value={draft.feedback} disabled={!!published||!canCreate||!!busy} onChange={e=>update(field.code,term,'feedback',e.target.value)}/></label>
     <small>{published?'Publicado':record?'Borrador':'Sin capturar'}</small>
     {!published&&canCreate&&<button className="secondary" type="button" disabled={!!busy} onClick={()=>void save(field.code,term)}>{busy===key?'Guardando…':'Guardar borrador'}</button>}
     {record&&published&&canCorrect&&<button className="secondary" type="button" disabled={!!busy} onClick={()=>void correct(record)}>Rectificar con motivo</button>}
     {record&&!published&&canPublish&&<button className="primary" type="button" disabled={!!busy} onClick={()=>void publish(record)}>Publicar</button>}
    </div></td>;
   })}<td>{academicResult?.fields?.find((row:Row)=>row.code===field.code)?.final??'Pendiente'}</td></tr>)}</tbody></table></div>:<p className="info">Selecciona un alumno para capturar sus tres evaluaciones parciales por campo formativo.</p>}
  {academicResult&&<div className="sc-formative-result"><strong>Promedio anual del grado: {academicResult.annual_average??'Pendiente'}</strong>
   <span>Evaluaciones pendientes: {academicResult.missing_evaluations} · Propuesta de acreditación: {academicResult.recommendation==='pending'?'Pendiente':academicResult.recommendation==='repeat'?'No acreditado':'Acreditado'}</span>
   <small>Regla: {academicResult.rule_version} · Decimales: {academicResult.average_decimal_mode}</small></div>}
  {enrollmentId&&<FormativeEvidenceCapture enrollmentId={enrollmentId} canCreate={canCreate}/>}
  <p className="footnote">Las calificaciones oficiales son números enteros por trimestre. Las ponderaciones de evidencias son internas y no sustituyen el juicio del docente ni la publicación autorizada.</p>
 </section>;
}
