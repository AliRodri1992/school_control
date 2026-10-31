import TableEmptyState from '../../shared/components/TableEmptyState';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import TableAction from '../../shared/components/TableAction';
import AuliGuide from '../../shared/components/AuliGuide';
import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileSpreadsheet,FileUp,LoaderCircle,ShieldCheck,UploadCloud} from 'lucide-react';
import {api} from '../../api';

type Batch={id:number;kind:string;status:string;mapping:Record<string,string>;total_rows:number;imported_rows:number;row_errors:{row:number;messages:string[]}[]};
type MappingTemplate={id:number;kind:string;name:string;mapping:Record<string,string>};
type Preview={headers:string[];sample:{row:number;values:Record<string,string>}[];suggested_mapping:Record<string,string>;total_rows:number};
const fieldCatalog:Record<string,Record<string,string>>={students:{first_name:'Nombre del alumno',last_name:'Apellidos',curp:'CURP',birth_date:'Fecha de nacimiento',guardian_email:'Correo del tutor'},subjects:{name:'Nombre de la materia',code:'Clave de materia'},groups:{academic_year:'Ciclo escolar',grade_level:'Grado',section:'Sección',capacity:'Cupo máximo'},teachers:{name:'Nombre del docente',email:'Correo del docente'},tutors:{name:'Nombre del tutor',email:'Correo del tutor'},grades:{course_id:'ID de clase',enrollment_id:'ID de inscripción',term:'Trimestre',score:'Calificación (0-10)',feedback:'Observaciones'}};
const stages=['Archivo','Asociación de columnas','Validación','Confirmación y resultado'] as const;

export default function ImportWizard(){
 const {ui}=useSchoolLocale();
 const [step,setStep]=useState(0),[file,setFile]=useState<File|null>(null);
 const [kind,setKind]=useState('students');
 const fields=fieldCatalog[kind]||fieldCatalog.students;
 const [batch,setBatch]=useState<Batch|null>(null),[preview,setPreview]=useState<Preview|null>(null);
 const [mapping,setMapping]=useState<Record<string,string>>({});
 const [error,setError]=useState(''),[fieldError,setFieldError]=useState(''),[busy,setBusy]=useState(false);
 const [history,setHistory]=useState<Batch[]>([]);
 const [historyLoaded,setHistoryLoaded]=useState(false);
 const [historyQuery,setHistoryQuery]=useState(''),[historyStatus,setHistoryStatus]=useState(''),[historyPage,setHistoryPage]=useState(0);
 const [templates,setTemplates]=useState<MappingTemplate[]>([]);
 const [templateName,setTemplateName]=useState('');
 useEffect(()=>{
   void api('data_imports').then(setHistory).catch(()=>undefined).finally(()=>setHistoryLoaded(true));
   void api('import_mapping_templates').then(setTemplates).catch(()=>undefined);
 },[]);
 const applicableTemplates=templates.filter(template=>template.kind===kind);
 function applyTemplate(id:string){
   const selected=applicableTemplates.find(template=>String(template.id)===id);
   if(!selected||!preview)return;
   const values={...preview.suggested_mapping};
   for(const [header,column] of Object.entries(selected.mapping)){
     if(preview.headers.includes(header)&&fields[column])values[header]=column;
   }
   setMapping(values);setFieldError('');
 }
 function saveTemplate(){if(!preview)return;
   if(!templateName.trim()){setFieldError('Nombre de plantilla no puede estar vacío.');return;}
   void perform(async()=>{
     const values=Object.fromEntries(Object.entries(mapping).filter(([,value])=>value));
     const stored:MappingTemplate=await api('import_mapping_templates','POST',{
       kind,name:templateName.trim(),mapping:values
     });
     setTemplates(previous=>[...previous,stored]);setTemplateName('');
   });
 }
 useEffect(()=>{
   if(!batch||!['queued','processing'].includes(batch.status))return;
   let active=true;
   const poll=async()=>{try{const result=await api('data_imports/'+batch.id);if(active)setBatch(result);}catch(e){if(active)setError((e as Error).message);}};
   const id=window.setInterval(()=>void poll(),2200);
   return()=>{active=false;window.clearInterval(id);};
 },[batch?.id,batch?.status]);

 async function perform(fn:()=>Promise<void>){setBusy(true);setError('');setFieldError('');try{await fn();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 function upload(event:FormEvent){event.preventDefault();if(!file){setFieldError('Archivo no puede estar vacío.');return;}
  void perform(async()=>{const fd=new FormData();fd.append('file',file);fd.append('kind',kind);
    const created=await api('data_imports','POST',fd);
    const p:Preview=await api('data_imports/'+created.id+'/preview');
    setBatch(created);setPreview(p);setMapping(p.suggested_mapping||{});setStep(1);
  });
 }

 function verifyMapping(event:FormEvent){event.preventDefault();if(!batch||!preview)return;
  const target=Object.values(mapping).filter(Boolean);
  if(new Set(target).size!==target.length){setFieldError('Asociación de columnas no permite campos repetidos.');return;}
  for(const required of Object.keys(fields).filter(key=>!(kind==='grades'&&key==='feedback'))){if(!target.includes(required)){setFieldError(fields[required]+' necesita una columna del archivo.');return;}}
  void perform(async()=>{
    const result:Batch=await api('data_imports/'+batch.id+'/validate','POST',{mapping:Object.fromEntries(Object.entries(mapping).filter(([,value])=>value))});
    setBatch(result);setStep(result.row_errors.length?2:3);
  });
 }
 function execute(){if(!batch)return;void perform(async()=>setBatch(await api('data_imports/'+batch.id+'/execute','POST')));}
 function retry(item:Batch){void perform(async()=>{
   const result:Batch=await api('data_imports/'+item.id+'/retry','POST');
   setBatch(result);setStep(3);setHistory(list=>list.map(current=>current.id===item.id?result:current));
 });}
 function restart(){setStep(0);setFile(null);setBatch(null);setPreview(null);setMapping({});setError('');setFieldError('');}
 const errors=batch?.row_errors||[];
 const visibleHistory=history.filter(item=>(!historyStatus||item.status===historyStatus)&&[item.kind,item.status,String(item.id)].some(value=>value.toLocaleLowerCase().includes(historyQuery.toLocaleLowerCase())));
 const historyPages=Math.max(1,Math.ceil(visibleHistory.length/10)),currentHistoryPage=Math.min(historyPage,historyPages-1);
  return <section className="sc-import">
  <div className="page-heading"><div><div className="eyebrow">{ui("GESTIÓN ESCOLAR / IMPORTACIONES")}</div><h1>{ui("Importación guiada")}</h1>
   <p>{ui("Importa registros desde Excel o CSV, asocia las columnas y verifica los datos antes de guardarlos.")}</p></div>
  </div>
  <div className="sc-import-layout">
   <div className="panel sc-import-panel">
    <ol className="sc-wizard-steps" aria-label={ui("Pasos de importación")}>{stages.map((title,index)=><li key={title} aria-current={step===index?'step':undefined} className={index<=step?'active':''}><span>{index+1}</span>{title}</li>)}</ol>
    {error&&<div className="error" role="alert">{error}</div>}
    {step===0&&<form onSubmit={upload} className="sc-import-form" noValidate>
      <h2>{ui("1. Selecciona tipo y archivo")}</h2>
       <div className="sc-import-kind"><label htmlFor="sc-import-kind">{ui("Tipo de datos")}</label>
       <Combobox id="sc-import-kind" label="Tipo de datos" value={kind} onChange={setKind} options={[
        {value:'students',label:ui("Alumnos")}, {value:'subjects',label:ui("Materias")}, {value:'groups',label:ui("Grupos")},
        {value:'teachers',label:ui("Docentes")}, {value:'tutors',label:ui("Padres y tutores")},
        {value:'grades',label:ui("Calificaciones (borrador)")}
       ]}/></div><p>{ui("Admite archivos .xlsx y .csv de hasta 5 MB con un máximo de 5,000 filas. La primera fila debe contener encabezados únicos.")}</p>
      {kind==='grades'&&<p className="info">{ui("Las calificaciones se importan como borradores; requieren revisión y publicación posterior. Utiliza los identificadores de clase e inscripción existentes.")}</p>}
      {['teachers','tutors'].includes(kind)&&<p className="info">{ui("Los usuarios importados recibirán un correo para establecer su contraseña. No se generan contraseñas compartidas ni se muestran credenciales en pantalla.")}</p>}
      <label className="sc-dropzone" htmlFor="school-import-file"><UploadCloud size={36}/><strong>{file?file.name:'Selecciona un archivo Excel o CSV'}</strong><span>{ui("Los datos se almacenan de forma privada.")}</span></label>
      <input id="school-import-file" aria-describedby={fieldError?'school-import-file-error':undefined} aria-invalid={!!fieldError} type="file" accept=".csv,.xlsx" onChange={e=>{setFile(e.target.files?.[0]||null);setFieldError('');}}/>
      {fieldError&&<p id="school-import-file-error" className="sc-field-error" role="alert">{fieldError}</p>}
      <button className="primary" disabled={busy}>{busy?'Revisando archivo…':'Leer archivo'}<ArrowRight size={17}/></button>
    </form>}
    {step===1&&preview&&<form className="sc-import-form" onSubmit={verifyMapping}>
      <h2>{ui("2. Asocia las columnas")}</h2>
      <p>{ui("Selecciona para cada encabezado del archivo el campo equivalente en School Control.")}</p>
      <div className="sc-import-templates">
        <label>Plantilla guardada
         <Combobox label="Plantilla guardada" value="" onChange={applyTemplate} placeholder="Selecciona un mapeo guardado"
           options={applicableTemplates.map(item=>({value:String(item.id),label:item.name}))}/>
        </label>
        <label>{ui("Nombre de nueva plantilla")}<input value={templateName} placeholder="Ej. Formato SEP 2026"
          maxLength={100} onChange={e=>setTemplateName(e.target.value)}/></label>
        <button className="secondary" type="button" disabled={busy} onClick={saveTemplate}>{ui("Guardar mapeo")}</button>
      </div>
      {preview.headers.length>0?<div className="table-scroll"><table><thead><tr><th>{ui("Columna de archivo")}</th><th>{ui("Campo del sistema")}</th><th>{ui("Ejemplo")}</th></tr></thead><tbody>
       {preview.headers.map(header=><tr key={header}><td><strong>{header}</strong></td><td><Combobox label={'Campo para '+header} placeholder={ui("Ignorar columna")} value={mapping[header]||''}
         options={Object.entries(fields).map(([value,label])=>({value,label}))}
         onChange={value=>{setMapping(previous=>({...previous,[header]:value}));setFieldError('');}}/></td>
        <td>{String(preview.sample[0]?.values[header]||'—')}</td></tr>)}
      </tbody></table></div>:<TableEmptyState/>}
      {fieldError&&<p className="sc-field-error" role="alert">{fieldError}</p>}
      <div className="sc-wizard-actions"><button className="secondary" type="button" onClick={()=>setStep(0)}><ArrowLeft size={17}/> {ui("Volver")}</button>
       <button className="primary" disabled={busy}>{busy?'Validando…':'Validar registros'}<ArrowRight size={17}/></button></div>
    </form>}
    {step===2&&<div className="sc-import-form">
      <h2>{ui("3. Revisión de errores")}</h2><p>Se encontraron {errors.length} filas con problemas. Corrige tu archivo y vuelve a cargarlo para evitar registros incompletos.</p>
      <div className="sc-import-errors">{errors.slice(0,30).map((item,index)=><p key={index}>Fila {item.row}: {item.messages.join(' · ')}</p>)}</div>
      <button className="secondary" onClick={restart}>{ui("Cargar archivo corregido")}</button>
    </div>}
    {step===3&&batch&&<div className="sc-import-form">
      <h2>{ui("4. Confirma la importación")}</h2>
      <div className="sc-import-count"><FileSpreadsheet size={23}/><strong>{batch.total_rows}</strong> {ui("registros revisados")}</div>
      {batch.status==='validated'?<><p>{ui("No se encontraron errores de validación. La carga se ejecutará de forma controlada y quedará registrada.")}</p>
        <button className="primary" disabled={busy} onClick={execute}><ShieldCheck size={18}/> {ui("Confirmar importación")}</button></>:
       ['queued','processing'].includes(batch.status)?<p role="status"><LoaderCircle size={17}/> {ui("Procesando datos de forma segura…")}</p>:
       <><p role="status"><CheckCircle2 size={18}/> Estado: {batch.status==='completed'?'Finalizada':batch.status}</p>
        <p><strong>{batch.imported_rows}</strong> {ui("registros importados correctamente.")}</p>{errors.length>0&&<p>{errors.length} filas no pudieron importarse. Revisa el historial para consultar el resultado.</p>}
        <button className="secondary" onClick={restart}>{ui("Nueva importación")}</button></>}
    </div>}
   </div>
   <aside className="panel sc-import-assistant"><AuliGuide title={ui("Auli te acompaña")} mood={step===2?"warning":step===3?"success":"explain"} text={step===0?'Prepara una hoja con los encabezados en la primera fila. Puedes importar CSV o Excel.':step===1?'Relaciona cada columna con el campo correcto. No necesitas que los encabezados tengan nombres idénticos.':step===2?'Revisa los problemas detectados antes de continuar. Ningún registro se importó todavía.' :'Revisa el resumen antes de confirmar. Los cambios solo se realizan después de tu autorización.'}/></aside>
  </div>
  <section className="panel sc-import-history"><h2>{ui("Importaciones recientes")}</h2><div className="sc-import-history-controls"><label>{ui('Buscar importaciones')}<input type="search" placeholder={ui('Tipo, estado o identificador…')} value={historyQuery} onChange={event=>{setHistoryQuery(event.target.value);setHistoryPage(0);}}/></label><div><label>{ui('Estado')}</label><Combobox label={ui('Filtrar importaciones por estado')} searchable={false} value={historyStatus} onChange={value=>{setHistoryStatus(value);setHistoryPage(0);}} placeholder={ui('Todos los estados')} options={[{value:'uploaded',label:'Subida'},{value:'validated',label:'Validada'},{value:'completed',label:'Completada'},{value:'failed',label:'Fallida'}]}/></div><strong>{visibleHistory.length} {ui('resultados')}</strong></div>{visibleHistory.length>0&&<div className="table-scroll"><table><thead><tr><th>{ui("Fecha")}</th><th>{ui("Tipo")}</th><th>{ui("Estado")}</th><th>{ui("Registros")}</th><th className="sc-table-action-col">{ui("Acciones")}</th></tr></thead><tbody>
   {visibleHistory.slice(currentHistoryPage*10,(currentHistoryPage+1)*10).map(item=><tr key={item.id}><td>{new Date((item as Batch & {created_at:string}).created_at).toLocaleString('es-MX')}</td><td>{item.kind}</td><td>{item.status}</td><td>{item.imported_rows} / {item.total_rows}</td><td className="sc-table-action-cell">{(item.status==='failed'||(item.status==='completed'&&item.row_errors?.length>0))&&
   <div className="sc-table-action-group"><TableAction kind="retry" disabled={busy} ariaLabel={`Reintentar pendientes de importación ${item.id}`} onClick={()=>retry(item)}/></div>}</td></tr>)}
  </tbody></table></div>}{!visibleHistory.length&&<TableEmptyState mode={!historyLoaded?'loading':historyQuery||historyStatus?'filtered':'empty'} canCreate={false}/>}{visibleHistory.length>10&&<nav className="sc-collection-pager" aria-label={ui('Paginación de importaciones')}><span>{ui('Página')} {currentHistoryPage+1} / {historyPages}</span><div><button type="button" className="secondary" disabled={currentHistoryPage===0} onClick={()=>setHistoryPage(n=>Math.max(0,n-1))}>{ui('Anterior')}</button><button type="button" className="secondary" disabled={currentHistoryPage===historyPages-1} onClick={()=>setHistoryPage(n=>Math.min(historyPages-1,n+1))}>{ui('Siguiente')}</button></div></nav>}</section>
 </section>;
}
