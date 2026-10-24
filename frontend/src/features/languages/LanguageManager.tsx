import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import {useEffect,useState,type FormEvent} from 'react';
import {Languages,Plus,Check,BookOpen} from 'lucide-react';
import {api} from '../../api';

type Language={id:number;code:string;name:string;native_name:string;status:string;text_direction:string};
type Entry={id:number;language_id:number;key:string;text:string;status:string};
export default function LanguageManager(){
 const {ui}=useSchoolLocale();
 const [languages,setLanguages]=useState<Language[]>([]);
 const [selected,setSelected]=useState<number|null>(null);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [name,setName]=useState(''),[nativeName,setNativeName]=useState(''),[code,setCode]=useState('');
 const [key,setKey]=useState(''),[value,setValue]=useState(''),[entryStatus,setEntryStatus]=useState('draft');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){setLanguages(await api('languages'));}
 async function loadEntries(id:number){setSelected(id);setEntries(await api('translation_entries?language_id='+id));}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[]);
 async function perform(action:()=>{ui("Promise")}<void>){setBusy(true);setError('');setNotice('');try{await action();setNotice('Cambios guardados correctamente.');await refresh();if(selected)await loadEntries(selected);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function addLanguage(event:FormEvent){event.preventDefault();void perform(async()=>{
  await api('languages','POST',{code,name,native_name:nativeName,status:'draft',text_direction:'ltr'});
  setName('');setNativeName('');setCode('');
 });}
 function addTranslation(event:FormEvent){event.preventDefault();if(!selected)return;void perform(async()=>{
  await api('translation_entries','POST',{language_id:selected,key,text:value,status:entryStatus});
  setKey('');setValue('');
 });}
 const current=languages.find(l=>l.id===selected);
 return <section className="sc-language-manager">
  <div className="page-heading"><div><div className="eyebrow">{ui("ADMINISTRACIÓN / LOCALIZACIÓN")}</div><h1>{ui("Idiomas y traducciones")}</h1><p>{ui("Administra idiomas y revisa las traducciones antes de publicarlas. El sistema conserva el español como respaldo.")}</p></div></div>
  {error&&<p className="error" role="alert">{error}</p>}
  {notice&&<p className="success" role="status">{notice}</p>}
  <div className="sc-language-grid">
   <div className="panel settings"><h2><Languages size={20}/> {ui("Idiomas")}</h2>
    <div className="sc-locale-list">{languages.map(language=><button key={language.id} className={'sc-locale-card'+(selected===language.id?' active':'')} onClick={()=>void loadEntries(language.id)}>
      <strong>{language.native_name}</strong><small>{language.code} · {language.status}</small></button>)}</div>
    <form onSubmit={addLanguage} className="sc-locale-form">
      <h3>{ui("Registrar nuevo idioma")}</h3>
      <label>{ui("Código")}<input value={code} placeholder={ui("fr")} pattern="[a-z]{2}(-[A-Z]{2})?" required onChange={e=>setCode(e.target.value)}/></label>
      <label>{ui("Nombre")}<input value={name} placeholder={ui("Francés")} required onChange={e=>setName(e.target.value)}/></label>
      <label>{ui("Nombre nativo")}<input value={nativeName} placeholder={ui("Français")} required onChange={e=>setNativeName(e.target.value)}/></label>
      <button className="primary" disabled={busy}><Plus size={17}/>{ui("Crear idioma en borrador")}</button>
    </form>
   </div>
   <div className="panel settings"><h2><BookOpen size={20}/> {ui("Traducciones")}</h2>
    {!current?<p>{ui("Selecciona un idioma para revisar sus traducciones.")}</p>:<>
      <div className="sc-language-header"><strong>{current.native_name}</strong><span className="badge">{current.status}</span></div>
      {current.status==='draft'&&<button className="secondary" disabled={busy} onClick={()=>void perform(async()=>{await api('languages/'+current.id,'PATCH',{status:'active'});})}><Check size={16}/>{ui("Activar idioma")}</button>}
      <div className="sc-locale-entries">{entries.map(entry=><div className="sc-locale-entry" key={entry.id}>
       <strong>{entry.key}</strong><p>{entry.text}</p><small>{entry.status}</small>
       {entry.status==='draft'&&<button className="text-button" disabled={busy} onClick={()=>void perform(async()=>{await api('translation_entries/'+entry.id,'PATCH',{status:'published'});})}>{ui("Publicar")}</button>}
      </div>)}</div>
      <form className="sc-locale-form" onSubmit={addTranslation}>
       <h3>{ui("Nueva traducción")}</h3>
       <label>{ui("Clave")}<input value={key} placeholder={ui("nav.home")} required pattern="[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+" onChange={e=>setKey(e.target.value)}/></label>
       <label>{ui("Texto")}<textarea value={value} required onChange={e=>setValue(e.target.value)}/></label>
       <div className="sc-locale-status-field"><label>{ui("Estado")}</label>
         <Combobox label="Estado de la traducción" value={entryStatus} onChange={setEntryStatus}
           options={[{value:'draft',label:ui("Borrador")},{value:'published',label:ui("Publicada y revisada")}]}/>
       </div>
       <button className="primary" disabled={busy}>{ui("Guardar traducción")}</button>
      </form>
    </>}
   </div>
  </div>
 </section>;
}
