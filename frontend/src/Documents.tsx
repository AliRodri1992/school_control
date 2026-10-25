import TableEmptyState from './shared/components/TableEmptyState';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import Combobox from './shared/components/Combobox';
import TableAction from './shared/components/TableAction';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import Uppy from '@uppy/core';
import UppyDashboard from '@uppy/dashboard';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';
export default function Documents({students,admin}:{students:Row[];admin:boolean}) {
 const {ui}=useSchoolLocale();
 const [loaded,setLoaded]=useState(false);
 const [studentId,setStudentId]=useState(''),[reviewStatus,setReviewStatus]=useState('approved');
 const [records,setRecords]=useState<Row[]>([]),[file,setFile]=useState<File|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [review,setReview]=useState<Row|null>(null);const target=useRef<HTMLDivElement>(null),uploader=useRef<Uppy|null>(null);
 async function refresh(){try{setRecords(await api('student_documents'));}finally{setLoaded(true);}}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));const uppy=new Uppy({restrictions:{maxNumberOfFiles:1,maxFileSize:10*1024*1024,allowedFileTypes:['application/pdf','image/png','image/jpeg']}});uploader.current=uppy;
 uppy.use(UppyDashboard,{target:target.current!,inline:true,height:260,width:'100%',hideUploadButton:true,proudlyDisplayPoweredByUppy:false,note:'PDF, PNG o JPG · hasta 10 MB. Se envía al guardar.',locale:{strings:{dropPasteFiles:'Arrastra tu documento o %{browseFiles}',browseFiles:'selecciona un archivo'}}});
 uppy.on('file-added',item=>setFile(item.data instanceof File?item.data:null));uppy.on('file-removed',()=>setFile(null));return()=>uppy.destroy();},[]);
 async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!file)return;
 if(!studentId){setError('Alumno no puede estar vacío.');return;}
 const form=event.currentTarget;const payload=new FormData(form);payload.set('file',file);setBusy(true);setError('');try{await api('student_documents','POST',payload);form.reset();setStudentId('');uploader.current?.clear();setFile(null);await refresh();void notify('Documento cargado correctamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function submitReview(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!review)return;const payload={...Object.fromEntries(new FormData(event.currentTarget)),lock_version:review.lock_version};setBusy(true);setError('');try{await api(`student_documents/${review.id}/review`,'POST',payload);setReview(null);await refresh();void notify('Revisión guardada correctamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><div className="page-heading"><div><h1>{ui("Documentos del expediente")}</h1><p>{ui("Entrega privada de documentos y seguimiento de su revisión.")}</p></div></div>{error&&<p className="error" role="alert">{error}</p>}<form className="panel settings" onSubmit={upload}><div className="form-grid"><div className="sc-form-dropdown"><label>{ui("Alumno")}</label><Combobox label="Alumno" value={studentId} onChange={setStudentId}
  placeholder={ui("Seleccione un alumno")} options={students.map(student=>({value:String(student.id),label:student.full_name}))}/>
  <input type="hidden" name="student_id" value={studentId}/></div><label>{ui("Documento")}<input name="title" required maxLength={150} placeholder={ui("Por ejemplo: acta de nacimiento")}/></label></div><div ref={target}/><div className="form-actions"><button className="primary" disabled={busy||!file}>{busy?'Enviando…':'Guardar documento'}</button></div></form>
 <section className="panel table-panel">{records.length>0&&<div className="table-scroll"><table><thead><tr><th>{ui("Alumno")}</th><th>{ui("Documento")}</th><th>{ui("Estado")}</th><th>{ui("Observaciones")}</th><th className="sc-table-action-col">{ui("Acciones")}</th></tr></thead><tbody>{records.map(record=><tr key={record.id}><td>{record.student_name}</td><td>{record.title}</td><td>{{pending:'Pendiente',approved:'Aprobado',correction_requested:'Requiere corrección'}[record.status as string]}</td><td>{record.review_notes||'—'}</td><td className="sc-table-action-cell"><div className="sc-table-action-group"><TableAction kind="download" ariaLabel={`Descargar ${record.title}`} href={record.download_url}/>{admin&&<TableAction kind="review" ariaLabel={`Revisar ${record.title}`} onClick={()=>setReview(record)}/>}</div></td></tr>)}</tbody></table></div>}{!records.length&&<TableEmptyState mode={error?'error':loaded?'empty':'loading'} canCreate/>}</section>
 {review&&<div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-label={ui("Revisar documento")}><header><h2>{review.title}</h2><button onClick={()=>setReview(null)}>{ui("Cerrar")}</button></header><form onSubmit={submitReview}><div className="sc-form-dropdown"><label>{ui("Resultado")}</label><Combobox label="Resultado de revisión" value={reviewStatus}
 onChange={setReviewStatus} options={[{value:'approved',label:ui("Aprobado")},{value:'correction_requested',label:ui("Solicitar corrección")}]}/>
 <input type="hidden" name="status" value={reviewStatus}/></div><label>{ui("Observaciones")}<textarea name="review_notes" maxLength={2000}/></label><p>{ui("Indica el motivo cuando solicites una corrección. La familia podrá subir una nueva versión.")}</p>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={busy}>{ui("Guardar revisión")}</button></form></section></div>}</>;
}
