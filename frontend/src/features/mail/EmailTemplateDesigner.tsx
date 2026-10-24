import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,FilePlus2,Mail,PanelRight,Save,Send} from 'lucide-react';
import {api} from '../../api';

type Template={id?:number;key:string;locale:string;status:string;subject:string;heading:string;body:string;html_body:string;footer:string;accent_color:string;revision?:number};
const kinds:Record<string,string>={activity:'Actividad del portal',welcome:'Bienvenida',admission_update:'Inscripciones',attendance_alert:'Asistencia',grade_published:'Calificaciones',document_review:'Revisión documental'};
function blank():Template{return {key:'activity',locale:'es',status:'draft',subject:'',heading:'',body:'',html_body:'',footer:'Este correo fue enviado por la escuela.',accent_color:'#405CF5'};}
export default function EmailTemplateDesigner({schoolName}:{schoolName:string}){
 const [items,setItems]=useState<Template[]>([]),[draft,setDraft]=useState<Template>(blank);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [preview,setPreview]=useState(true);
 async function refresh(){const result:Template[]=await api('email_templates');setItems(result);}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[]);
 function change<K extends keyof Template>(key:K,value:Template[K]){setDraft(v=>({...v,[key]:value}));setError('');setSuccess('');}
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');setSuccess('');
  try{const payload={key:draft.key,locale:draft.locale,status:draft.status,subject:draft.subject,heading:draft.heading,body:draft.body,html_body:draft.html_body,footer:draft.footer,accent_color:draft.accent_color};
    const result:Template=await api(draft.id?'email_templates/'+draft.id:'email_templates',draft.id?'PATCH':'POST',payload);
    setDraft(result);await refresh();setSuccess('Plantilla guardada y versionada correctamente.');
  }catch(error){setError((error as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-mail-designer">
  <div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN / COMUNICACIÓN</span><h1>Diseñador de correos institucionales</h1>
   <p>Edita plantillas guardadas en PostgreSQL y verifica cómo se mostrarán a las familias.</p></div>
   <button className="secondary" type="button" onClick={()=>{setDraft(blank());setError('');setSuccess('');}}><FilePlus2 size={17}/>Nueva plantilla</button></div>
  {error&&<p className="error" role="alert">{error}</p>}{success&&<p className="success" role="status"><CheckCircle2 size={17}/>{success}</p>}
  <div className="sc-mail-layout">
   <aside className="panel sc-mail-templates"><h2><Mail size={18}/> Plantillas</h2>
    {items.map(template=><button className={'sc-mail-list-item'+(template.id===draft.id?' active':'')} type="button"
      onClick={()=>{setDraft({...template,html_body:template.html_body||''});setError('');setSuccess('');}} key={template.id}>
      <strong>{kinds[template.key]||template.key}</strong><span>{template.locale.toUpperCase()} · {template.status} · v{template.revision||1}</span>
    </button>)}
   </aside>
   <div className="panel sc-mail-edit-panel"><div className="sc-mail-edit-head"><h2>Contenido del mensaje</h2>
    <button className="text-button" type="button" onClick={()=>setPreview(v=>!v)}><PanelRight size={16}/>{preview?'Ocultar vista previa':'Mostrar vista previa'}</button></div>
    <form onSubmit={submit} noValidate className="sc-mail-form">
      <div className="sc-mail-double">
       <label>Tipo de notificación<select value={draft.key} disabled={!!draft.id} onChange={e=>change('key',e.target.value)}>
        {Object.entries(kinds).map(([key,name])=><option value={key} key={key}>{name}</option>)}
       </select></label>
       <label>Idioma<input value={draft.locale} required maxLength={5} placeholder="es" disabled={!!draft.id} onChange={e=>change('locale',e.target.value)}/></label>
      </div>
      <label>Asunto<input required maxLength={200} value={draft.subject} onChange={e=>change('subject',e.target.value)} placeholder="Asunto del mensaje"/></label>
      <label>Encabezado<input required maxLength={200} value={draft.heading} onChange={e=>change('heading',e.target.value)} placeholder="Título del correo"/></label>
      <label>Mensaje principal<textarea required rows={5} maxLength={5000} value={draft.body} onChange={e=>change('body',e.target.value)} placeholder="Contenido legible, incluso sin HTML"/></label>
      <label>HTML opcional (estructura permitida, sin scripts)<textarea rows={4} maxLength={15000} value={draft.html_body||''} onChange={e=>change('html_body',e.target.value)} placeholder="<p>Mensaje con <strong>formato</strong></p>"/></label>
      <label>Pie institucional<textarea required rows={2} maxLength={200} value={draft.footer} onChange={e=>change('footer',e.target.value)}/></label>
      <div className="sc-mail-double"><label>Color de acento<input type="color" value={draft.accent_color} onChange={e=>change('accent_color',e.target.value)}/></label>
       <label>Estado<select value={draft.status} onChange={e=>change('status',e.target.value)}>
        <option value="draft">Borrador</option><option value="published">Publicada</option><option value="archived">Archivada</option>
       </select></label></div>
      <button className="primary" disabled={busy}><Save size={17}/>{busy?'Guardando…':'Guardar plantilla'}</button>
    </form>
   </div>
   {preview&&<aside className="sc-mail-preview"><div className="sc-mail-preview-label"><Send size={17}/>Vista previa en vivo</div>
    <div className="sc-mail-preview-frame">
     <div className="sc-mail-preview-banner"><span>School Control · Comunicación escolar</span><strong>{schoolName}</strong></div>
     <div className="sc-mail-preview-body"><small>AVISO INSTITUCIONAL</small><h2>{draft.heading||'Encabezado del mensaje'}</h2>
      <p>Hola, Familia Ejemplo.</p><p className="sc-mail-preview-text">{draft.body||'Tu mensaje institucional aparecerá aquí.'}</p>
      <div className="sc-mail-preview-button" style={{background:draft.accent_color}}>Entrar a mi portal</div>
      <footer>{draft.footer}</footer></div>
     <div className="sc-mail-preview-foot">Esta vista es ilustrativa y no envía correos.</div>
    </div>
   </aside>}
  </div>
 </section>;
}
