import {useEffect,useState,type FormEvent} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,FileSpreadsheet,FileUp,LoaderCircle,ShieldCheck,UploadCloud} from 'lucide-react';
import {api} from '../../api';

type Batch={id:number;kind:string;status:string;mapping:Record<string,string>;total_rows:number;imported_rows:number;row_errors:{row:number;messages:string[]}[]};
type Preview={headers:string[];sample:{row:number;values:Record<string,string>}[];suggested_mapping:Record<string,string>;total_rows:number};
const fieldCatalog:Record<string,Record<string,string>>={students:{first_name:'Nombre del alumno',last_name:'Apellidos',curp:'CURP',birth_date:'Fecha de nacimiento',guardian_email:'Correo del tutor'},subjects:{name:'Nombre de la materia',code:'Clave de materia'},groups:{academic_year:'Ciclo escolar',grade_level:'Grado',section:'Sección',capacity:'Cupo máximo'}};
const stages=['Archivo','Asociación de columnas','Validación','Confirmación y resultado'] as const;

export default function ImportWizard(){
 const [step,setStep]=useState(0),[file,setFile]=useState<File|null>(null);
 const [kind,setKind]=useState('students');
 const fields=fieldCatalog[kind]||fieldCatalog.students;
 const [batch,setBatch]=useState<Batch|null>(null),[preview,setPreview]=useState<Preview|null>(null);
 const [mapping,setMapping]=useState<Record<string,string>>({});
 const [error,setError]=useState(''),[fieldError,setFieldError]=useState(''),[busy,setBusy]=useState(false);
 const [history,setHistory]=useState<Batch[]>([]);
 useEffect(()=>{void api('data_imports').then(setHistory).catch(()=>undefined);},[]);
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
  for(const required of Object.keys(fields)){if(!target.includes(required)){setFieldError(fields[required]+' necesita una columna del archivo.');return;}}
  void perform(async()=>{
    const result:Batch=await api('data_imports/'+batch.id+'/validate','POST',{mapping:Object.fromEntries(Object.entries(mapping).filter(([,value])=>value))});
    setBatch(result);setStep(result.row_errors.length?2:3);
  });
 }
 function execute(){if(!batch)return;void perform(async()=>setBatch(await api('data_imports/'+batch.id+'/execute','POST')));}
 function restart(){setStep(0);setFile(null);setBatch(null);setPreview(null);setMapping({});setError('');setFieldError('');}
 const errors=batch?.row_errors||[];
 return <section className="sc-import">
  <div className="page-heading"><div><div className="eyebrow">GESTIÓN ESCOLAR / IMPORTACIONES</div><h1>Importación guiada</h1>
   <p>Importa registros desde Excel o CSV, asocia las columnas y verifica los datos antes de guardarlos.</p></div>
  </div>
  <div className="sc-import-layout">
   <div className="panel sc-import-panel">
    <ol className="sc-wizard-steps" aria-label="Pasos de importación">{stages.map((title,index)=><li key={title} aria-current={step===index?'step':undefined} className={index<=step?'active':''}><span>{index+1}</span>{title}</li>)}</ol>
    {error&&<div className="error" role="alert">{error}</div>}
    {step===0&&<form onSubmit={upload} className="sc-import-form" noValidate>
      <h2>1. Selecciona tipo y archivo</h2>
       <label>Tipo de datos<select value={kind} onChange={e=>setKind(e.target.value)}><option value="students">Alumnos</option><option value="subjects">Materias</option><option value="groups">Grupos</option></select></label><p>Admite archivos .xlsx y .csv de hasta 5 MB con un máximo de 5,000 filas. La primera fila debe contener encabezados únicos.</p>
      <label className="sc-dropzone" htmlFor="school-import-file"><UploadCloud size={36}/><strong>{file?file.name:'Selecciona un archivo Excel o CSV'}</strong><span>Los datos se almacenan de forma privada.</span></label>
      <input id="school-import-file" aria-describedby={fieldError?'school-import-file-error':undefined} aria-invalid={!!fieldError} type="file" accept=".csv,.xlsx" onChange={e=>{setFile(e.target.files?.[0]||null);setFieldError('');}}/>
      {fieldError&&<p id="school-import-file-error" className="sc-field-error" role="alert">{fieldError}</p>}
      <button className="primary" disabled={busy}>{busy?'Revisando archivo…':'Leer archivo'}<ArrowRight size={17}/></button>
    </form>}
    {step===1&&preview&&<form className="sc-import-form" onSubmit={verifyMapping}>
      <h2>2. Asocia las columnas</h2><p>Selecciona para cada encabezado del archivo el campo equivalente en School Control.</p>
      <div className="table-scroll"><table><thead><tr><th>Columna de archivo</th><th>Campo del sistema</th><th>Ejemplo</th></tr></thead><tbody>
       {preview.headers.map(header=><tr key={header}><td><strong>{header}</strong></td><td><select aria-label={'Campo para '+header} value={mapping[header]||''} onChange={e=>{setMapping(v=>({...v,[header]:e.target.value}));setFieldError('');}}>
        <option value="">Ignorar columna</option>{Object.entries(fields).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td>
        <td>{String(preview.sample[0]?.values[header]||'—')}</td></tr>)}
      </tbody></table></div>
      {fieldError&&<p className="sc-field-error" role="alert">{fieldError}</p>}
      <div className="sc-wizard-actions"><button className="secondary" type="button" onClick={()=>setStep(0)}><ArrowLeft size={17}/> Volver</button>
       <button className="primary" disabled={busy}>{busy?'Validando…':'Validar registros'}<ArrowRight size={17}/></button></div>
    </form>}
    {step===2&&<div className="sc-import-form">
      <h2>3. Revisión de errores</h2><p>Se encontraron {errors.length} filas con problemas. Corrige tu archivo y vuelve a cargarlo para evitar registros incompletos.</p>
      <div className="sc-import-errors">{errors.slice(0,30).map((item,index)=><p key={index}>Fila {item.row}: {item.messages.join(' · ')}</p>)}</div>
      <button className="secondary" onClick={restart}>Cargar archivo corregido</button>
    </div>}
    {step===3&&batch&&<div className="sc-import-form">
      <h2>4. Confirma la importación</h2>
      <div className="sc-import-count"><FileSpreadsheet size={23}/><strong>{batch.total_rows}</strong> registros revisados</div>
      {batch.status==='validated'?<><p>No se encontraron errores de validación. La carga se ejecutará de forma controlada y quedará registrada.</p>
        <button className="primary" disabled={busy} onClick={execute}><ShieldCheck size={18}/> Confirmar importación</button></>:
       ['queued','processing'].includes(batch.status)?<p role="status"><LoaderCircle size={17}/> Procesando datos de forma segura…</p>:
       <><p role="status"><CheckCircle2 size={18}/> Estado: {batch.status==='completed'?'Finalizada':batch.status}</p>
        <p><strong>{batch.imported_rows}</strong> registros importados correctamente.</p>{errors.length>0&&<p>{errors.length} filas no pudieron importarse. Revisa el historial para consultar el resultado.</p>}
        <button className="secondary" onClick={restart}>Nueva importación</button></>}
    </div>}
   </div>
   <aside className="panel sc-import-assistant"><img src="/illustrations/auli-welcome.svg" alt="Auli, el asistente escolar"/><h3>Auli te acompaña</h3>
    <p>{step===0?'Prepara una hoja con los encabezados en la primera fila. Puedes importar CSV o Excel.':step===1?'Relaciona cada columna con el campo correcto. No necesitas que los encabezados tengan nombres idénticos.':step===2?'Revisa los problemas detectados antes de continuar. Ningún registro se importó todavía.':'Revisa el resumen antes de confirmar. Los cambios solo se realizan después de tu autorización.'}</p></aside>
  </div>
  {history.length>0&&<section className="panel sc-import-history"><h2>Importaciones recientes</h2><div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Registros</th></tr></thead><tbody>
   {history.map(item=><tr key={item.id}><td>{new Date((item as Batch & {created_at:string}).created_at).toLocaleString('es-MX')}</td><td>{item.kind}</td><td>{item.status}</td><td>{item.imported_rows} / {item.total_rows}</td></tr>)}
  </tbody></table></div></section>}
 </section>;
}
