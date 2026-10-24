import {useSchoolLocale} from './shared/i18n/LocaleContext';
import GradeRequests from './GradeRequests';
import TableAction from './shared/components/TableAction';
import {useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';

export default function GradeActions({grade,admin,permissions,onChanged}:{grade:Row;admin:boolean;permissions?:Record<string,string[]>;onChanged:()=>{ui("Promise")}<void>}) {
  const can=(key:string)=>permissions?!!permissions[key]?.length:(key==='grades.history'||key==='grade_change_requests.index'||admin);
 const {ui}=useSchoolLocale();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[editing,setEditing]=useState(false),[history,setHistory]=useState<Row[]|null>(null);
  async function action(kind:string,fields?:Record<string,FormDataEntryValue>) {
    setBusy(true);setError('');
    try {
      await api(`grades/${grade.id}/${kind}`,'POST',fields);
      setEditing(false);void notify(kind==='review'?'Calificación revisada correctamente.':kind==='publish'?'Calificación publicada correctamente.':'Corrección registrada correctamente.');
      await onChanged();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  async function showHistory(){setBusy(true);setError('');try{setHistory(await api(`grades/${grade.id}/history`));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  function correct(event:FormEvent<HTMLFormElement>){event.preventDefault();void action('correct',{...Object.fromEntries(new FormData(event.currentTarget)),lock_version:String(grade.lock_version)});}
  return <><div className="sc-table-action-group">{can('grade_change_requests.index')&&grade.status==='published'&&<GradeRequests grade={grade} onChanged={onChanged} canCreate={permissions?!!permissions['grade_change_requests.create']?.length:true}/>}{can('grades.review')&&grade.status==='draft'&&<TableAction kind="review" disabled={busy} onClick={()=>action('review')}/>}{can('grades.publish')&&grade.status==='reviewed'&&<TableAction kind="publish" disabled={busy} onClick={()=>action('publish')}/>}{can('grades.correct')&&grade.status==='published'&&<TableAction kind="correct" disabled={busy} onClick={()=>{setError('');setEditing(true);}}/>}{can('grades.history')&&<TableAction kind="history" disabled={busy} onClick={showHistory}/>}</div>{error&&!editing&&<p role="alert" className="error">{error}</p>}{editing&&<div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={ui("Corregir calificación")}><header><h2>{ui("Corregir calificación publicada")}</h2><button type="button" disabled={busy} onClick={()=>setEditing(false)} aria-label={ui("Cerrar corrección")}>×</button></header><p>{grade.student_name} · {grade.subject_name} · Trimestre {grade.term}</p><p>{ui("La corrección queda en el historial y será visible en la boleta. No cambia automáticamente la decisión de promoción o egreso.")}</p><form onSubmit={correct}><label>{ui("Calificación corregida")}<input name="score" type="number" min={0} max={10} step="0.1" required defaultValue={grade.score}/></label><label>{ui("Retroalimentación")}<textarea name="feedback" defaultValue={grade.feedback||''}/></label><label>{ui("Motivo de la corrección")}<textarea name="reason" required maxLength={2000} placeholder={ui("Explica la corrección para el historial administrativo")}/></label>{error&&<p role="alert" className="error">{error}</p>}<div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>setEditing(false)}>{ui("Cancelar")}</button><button className="primary" disabled={busy}>{ui("Guardar corrección")}</button></div></form></section></div>}{history!==null&&<div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={ui("Historial de correcciones")}><header><h2>{ui("Historial de correcciones")}</h2><button aria-label={ui("Cerrar historial")} onClick={()=>setHistory(null)}>×</button></header><p>{grade.student_name} · {grade.subject_name}</p>{history.length===0?<p>{ui("Aún no hay correcciones.")}</p>:history.map(item=><article key={item.id}><h3>{item.previous_score} → {item.score}</h3><p>{item.reason}</p><p>Retroalimentación anterior: {item.previous_feedback||'Sin retroalimentación'}</p><p>Retroalimentación corregida: {item.feedback||'Sin retroalimentación'}</p><small>{item.actor_name} · {new Date(item.created_at).toLocaleString('es-MX')}</small></article>)}</section></div>}</>;
}
