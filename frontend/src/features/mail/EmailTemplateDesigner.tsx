import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,FilePlus2,Mail,PanelRight,Save,Send} from 'lucide-react';
import {api} from '../../api';

type Template={id?:number;key:string;locale:string;status:string;subject:string;heading:string;body:string;html_body:string;footer:string;accent_color:string;revision?:number};
const kinds:Record<string,string>={activity:'Actividad del portal',welcome:'Bienvenida',admission_update:'Inscripciones',attendance_alert:'Asistencia',grade_published:'Calificaciones',document_review:'Revisión documental'};
function blank():Template{return {key:'activity',locale:'es',status:'draft',subject:'',heading:'',body:'',html_body:'',footer:'Este correo fue enviado por la escuela.',accent_color:'#405CF5'};}
export default function EmailTemplateDesigner({schoolName}:{schoolName:string}){
 const {ui}=useSchoolLocale();
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
  <div className="page-heading"><div><span className="eyebrow">{ui("ADMINISTRACIÓN / COMUNICACIÓN")}</span><h1>{ui("Diseñador de correos institucionales")}</h1>
   <p>{ui("Edita plantillas guardadas en PostgreSQL y verifica cómo se mostrarán a las familias.")}</p></div>
   <button className="secondary" type="button" onClick={()=>{setDraft(blank());setError('');setSuccess('');}}><FilePlus2 size={17}/>{ui("Nueva plantilla")}</button></div>
  {error&&<p className="error" role="alert">{error}</p>}{success&&<p className="success" role="status"><CheckCircle2 size={17}/>{success}</p>}
  <div className="sc-mail-layout">
   <aside className="panel sc-mail-templates"><h2><Mail size={18}/> {ui("Plantillas")}</h2>
    {items.map(template=><button className={'sc-mail-list-item'+(template.id===draft.id?' active':'')} type="button"
      onClick={()=>{setDraft({...template,html_body:template.html_body||''});setError('');setSuccess('');}} key={template.id}>
      <strong>{kinds[template.key]||template.key}</strong><span>{template.locale.toUpperCase()} · {template.status} · v{template.revision||1}</span>
    </button>)}
   </aside>
   <div className="panel sc-mail-edit-panel"><div className="sc-mail-edit-head"><h2>{ui("Contenido del mensaje")}</h2>
    <button className="text-button" type="button" onClick={()=>setPreview(v=>!v)}><PanelRight size={16}/>{preview?'Ocultar vista previa':'Mostrar vista previa'}</button></div>
    <form onSubmit={submit} noValidate className="sc-mail-form">
      <div className="sc-mail-double">
       <div className="sc-mail-choice"><label>{ui("Tipo de notificación")}</label>
        <Combobox label="Tipo de notificación" value={draft.key} disabled={!!draft.id} onChange={value=>change('key',value)}
           options={Object.entries(kinds).map(([value,label])=>({value,label}))}/></div>
       <label>{ui("Idioma")}<input value={draft.locale} required maxLength={5} placeholder={ui("es")} disabled={!!draft.id} onChange={e=>change('locale',e.target.value)}/></label>
      </div>
      <label>{ui("Asunto")}<input required maxLength={200} value={draft.subject} onChange={e=>change('subject',e.target.value)} placeholder={ui("Asunto del mensaje")}/></label>
      <label>{ui("Encabezado")}<input required maxLength={200} value={draft.heading} onChange={e=>change('heading',e.target.value)} placeholder={ui("Título del correo")}/></label>
      <label>{ui("Mensaje principal")}<textarea required rows={5} maxLength={5000} value={draft.body} onChange={e=>change('body',e.target.value)} placeholder={ui("Contenido legible, incluso sin HTML")}/></label>
      <label>{ui("HTML opcional (estructura permitida, sin scripts)")}<textarea rows={4} maxLength={15000} value={draft.html_body||''} onChange={e=>change('html_body',e.target.value)} placeholder={"<p>Mensaje con <strong>formato</strong></p>"}/></label>
      <label>{ui("Pie institucional")}<textarea required rows={2} maxLength={200} value={draft.footer} onChange={e=>change('footer',e.target.value)}/></label>
      <div className="sc-mail-double"><label>{ui("Color de acento")}<input type="color" value={draft.accent_color} onChange={e=>change('accent_color',e.target.value)}/></label>
       <div className="sc-mail-choice"><label>{ui("Estado")}</label>
        <Combobox label="Estado de plantilla" value={draft.status} onChange={value=>change('status',value)}
          options={[{value:'draft',label:ui("Borrador")},{value:'published',label:ui("Publicada")},{value:'archived',label:ui("Archivada")}]}/></div></div>
      <button className="primary" disabled={busy}><Save size={17}/>{busy?'Guardando…':'Guardar plantilla'}</button>
    </form>
   </div>
   {preview&&<aside className="sc-mail-preview"><div className="sc-mail-preview-label"><Send size={17}/>{ui("Vista previa en vivo")}</div>
    <div className="sc-mail-preview-frame">
     <div className="sc-mail-preview-banner"><span>{ui("School Control · Comunicación escolar")}</span><strong>{schoolName}</strong></div>
     <div className="sc-mail-preview-body"><small>{ui("AVISO INSTITUCIONAL")}</small><h2>{draft.heading||'Encabezado del mensaje'}</h2>
      <p>{ui("Hola, Familia Ejemplo.")}</p><p className="sc-mail-preview-text">{draft.body||'Tu mensaje institucional aparecerá aquí.'}</p>
      <div className="sc-mail-preview-button" style={{background:draft.accent_color}}>{ui("Entrar a mi portal")}</div>
      <footer>{draft.footer}</footer></div>
     <div className="sc-mail-preview-foot">{ui("Esta vista es ilustrativa y no envía correos.")}</div>
    </div>
   </aside>}
  </div>
 </section>;
}
