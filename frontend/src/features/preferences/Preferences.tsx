import {useEffect,useState,type FormEvent} from 'react';
import {Check,Globe2,Languages,LayoutDashboard,Monitor,Moon,Palette,RefreshCw,Rows3,Save,ShieldCheck,SlidersHorizontal,Sun} from 'lucide-react';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import {api} from '../../api';
import {notify} from '../../notifications';

type Theme='system'|'light'|'dark';
type Settings={locale:string;theme:Theme;rows_per_page:number;selected_child_id:number|null};
type Language={code:string;native_name:string;status:string};
const baseline:Settings={locale:'es',theme:'system',rows_per_page:15,selected_child_id:null};
const themes=[{value:'system',title:'Automático',description:'Se adapta a tu dispositivo',icon:Monitor},
 {value:'light',title:'Claro',description:'Espacios luminosos',icon:Sun},
 {value:'dark',title:'Oscuro',description:'Menos brillo en pantalla',icon:Moon}] as const;
const pageSizes=[10,15,25,50] as const;

/** Wide account settings workspace with one explicit, server-persisted save. */
export default function Preferences({onSaved}:{onSaved?:(settings:Settings)=>void}){
 const {ui}=useSchoolLocale();
 const [settings,setSettings]=useState<Settings>(baseline);
 const [persisted,setPersisted]=useState<Settings>(baseline);
 const [available,setAvailable]=useState<Language[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError('');
  void Promise.all([api('preferences'),api('languages')]).then(([prefs,langs]:[Settings,Language[]])=>{
   if(!active)return;
   setSettings(prefs);setPersisted(prefs);
   setAvailable(langs.filter(language=>language.status==='active'));
   setLoaded(true);
  }).catch((cause:Error)=>{if(active){setError(cause.message);setLoaded(false);}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[attempt]);
 const dirty=loaded&&(settings.locale!==persisted.locale||
  settings.theme!==persisted.theme||settings.rows_per_page!==persisted.rows_per_page);
 const languages=available.length?available:[{code:'es',native_name:'Español',status:'active'},{code:'en',native_name:'English',status:'active'}];
 const languageOptions=languages.some(language=>language.code===settings.locale)?languages:
  [...languages,{code:settings.locale,native_name:settings.locale.toUpperCase(),status:'active'}];
 const currentLanguage=languageOptions.find(language=>language.code===settings.locale)?.native_name||settings.locale.toUpperCase();
 const themeName=ui(themes.find(theme=>theme.value===settings.theme)?.title||'Automático');
 function update<K extends 'locale'|'theme'|'rows_per_page'>(key:K,value:Settings[K]){
  setSettings(previous=>({...previous,[key]:value}));
  setError('');
 }
 function reset(){setSettings(persisted);setError('');}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!dirty||busy)return;
  setBusy(true);setError('');
  try{
   const result:Settings=await api('preferences','PATCH',settings);
   setSettings(result);setPersisted(result);
   localStorage.setItem('school-locale',result.locale);
   document.documentElement.dataset.schoolTheme=result.theme;
   window.dispatchEvent(new Event('school-locale-changed'));
   onSaved?.(result);
   void notify(ui('Preferencias actualizadas correctamente.'));
  }catch(cause){setError((cause as Error).message);}
  finally{setBusy(false);}
 }
 return <section className="sc-preferences" aria-label={ui('Preferencias del sistema')}>
  <div className="sc-pref-heading">
   <div className="sc-pref-heading-copy">
    <span className="sc-pref-eyebrow">{ui('MI CUENTA')} / {ui('PERSONALIZACIÓN')}</span>
    <h1>{ui('Preferencias del sistema')}</h1>
    <p>{ui('Adapta tu espacio de trabajo y configura cómo utilizas School Control cada día.')}</p>
   </div>
   {!loading&&loaded&&<span className={'sc-pref-status'+(dirty?' is-dirty':'')} role="status">
    <span aria-hidden="true"/>{ui(dirty?'Cambios sin guardar':'Configuración al día')}
   </span>}
  </div>
  {loading?<div className="sc-pref-load-state" role="status">
   <span className="sc-pref-loading-shape" aria-hidden="true"/>
   <div><strong>{ui('Cargando preferencias…')}</strong><p>{ui('Estamos preparando tus ajustes personales.')}</p></div>
  </div>:!loaded?<div className="sc-pref-load-state is-error" role="alert">
   <ShieldCheck size={28} aria-hidden="true"/>
   <div><strong>{ui('No fue posible cargar tus preferencias.')}</strong><p>{error}</p></div>
   <button type="button" className="secondary" onClick={()=>setAttempt(value=>value+1)}>
    <RefreshCw size={16} aria-hidden="true"/>{ui('Reintentar')}
   </button>
  </div>:<form className="sc-pref-workspace" onSubmit={save} aria-busy={busy}>
   <header className="sc-pref-banner">
    <div className="sc-pref-banner-copy">
     <span className="sc-pref-banner-label"><SlidersHorizontal size={15} aria-hidden="true"/>{ui('TU ESPACIO, TUS REGLAS')}</span>
     <h2>{ui('Una experiencia hecha para ti')}</h2>
     <p>{ui('Configura el idioma, la apariencia y la cantidad de registros que ves. Tus ajustes quedan vinculados a tu cuenta.')}</p>
     <div className="sc-pref-banner-tags">
      <span><Languages size={14} aria-hidden="true"/>{currentLanguage}</span>
      <span><Palette size={14} aria-hidden="true"/>{themeName}</span>
      <span><Rows3 size={14} aria-hidden="true"/>{settings.rows_per_page} {ui('por página')}</span>
     </div>
    </div>
    <div className="sc-pref-banner-art" aria-hidden="true">
     <span className="sc-pref-banner-orbit"><SlidersHorizontal size={52} strokeWidth={1.45}/></span>
    </div>
   </header>
   {error&&<p role="alert" className="sc-pref-error">{error}</p>}
   <div className="sc-pref-grid">
    <div className="sc-pref-primary">
     <section className="sc-pref-card" aria-labelledby="sc-pref-language-title">
      <div className="sc-pref-card-heading">
       <span className="sc-pref-icon"><Languages size={22} aria-hidden="true"/></span>
       <div><span className="sc-pref-step">{ui('01 · COMUNICACIÓN')}</span>
        <h2 id="sc-pref-language-title">{ui('Idioma de la interfaz')}</h2>
        <p>{ui('Selecciona el idioma en el que prefieres navegar por el sistema.')}</p>
       </div>
      </div>
      <div className="sc-pref-language-layout">
       <div className="sc-pref-control-group">
        <span className="sc-pref-field-label">{ui('Idioma preferido')}</span>
        <Combobox label={ui('Idioma preferido')} value={settings.locale} disabled={busy}
         onChange={value=>update('locale',value)}
         options={languageOptions.map(language=>({value:language.code,label:language.native_name}))}/>
       </div>
       <p className="sc-pref-note"><Globe2 size={17} aria-hidden="true"/>
        {ui('Solo se muestran idiomas habilitados por la escuela. El cambio se aplicará cuando guardes.')}
       </p>
      </div>
     </section>
     <section className="sc-pref-card" aria-labelledby="sc-pref-theme-title">
      <div className="sc-pref-card-heading">
       <span className="sc-pref-icon"><Palette size={22} aria-hidden="true"/></span>
       <div><span className="sc-pref-step">{ui('02 · APARIENCIA')}</span>
        <h2 id="sc-pref-theme-title">{ui('Tema visual')}</h2>
        <p>{ui('Elige la apariencia que resulte más cómoda para ti.')}</p>
       </div>
      </div>
      <div className="sc-pref-theme-choices" role="group" aria-label={ui('Tema preferido')}>
       {themes.map(option=>{
        const Icon=option.icon,active=settings.theme===option.value;
        return <button key={option.value} type="button" className={'sc-pref-theme-choice'+(active?' is-selected':'')}
         aria-pressed={active} disabled={busy} onClick={()=>update('theme',option.value)}>
         <span className={'sc-pref-theme-art is-'+option.value} aria-hidden="true">
          <span className="sc-pref-theme-art-top"/><span className="sc-pref-theme-art-rail"/>
          <span className="sc-pref-theme-art-body"><i/><i/><i/></span>
         </span>
         <span className="sc-pref-theme-choice-bottom">
          <Icon size={17} aria-hidden="true"/>
          <span><strong>{ui(option.title)}</strong><small>{ui(option.description)}</small></span>
          <span className="sc-pref-choice-indicator" aria-hidden="true">{active&&<Check size={13}/>}</span>
         </span>
        </button>;
       })}
      </div>
     </section>
     <section className="sc-pref-card" aria-labelledby="sc-pref-rows-title">
      <div className="sc-pref-card-heading">
       <span className="sc-pref-icon"><Rows3 size={22} aria-hidden="true"/></span>
       <div><span className="sc-pref-step">{ui('03 · VISUALIZACIÓN')}</span>
        <h2 id="sc-pref-rows-title">{ui('Registros por página')}</h2>
        <p>{ui('Decide cuántos registros se muestran en los listados del sistema.')}</p>
       </div>
      </div>
      <div className="sc-pref-density-options" role="group" aria-label={ui('Registros por página')}>
       {pageSizes.map(size=><button key={size} type="button" aria-label={size+' '+ui('registros por página')}
        aria-pressed={settings.rows_per_page===size}
        className={'sc-pref-density-choice'+(settings.rows_per_page===size?' is-selected':'')}
        disabled={busy} onClick={()=>update('rows_per_page',size)}>
        <strong>{size}</strong><small>{ui('registros')}</small>
        {settings.rows_per_page===size&&<Check size={16} aria-hidden="true"/>}
       </button>)}
      </div>
      <p className="sc-pref-help-line">{ui('Puedes cambiar esta opción cuando lo necesites. No modifica los registros de la escuela.')}</p>
     </section>
    </div>
    <aside className="sc-pref-secondary" aria-label={ui('Vista previa de preferencias')}>
     <section className="sc-pref-card sc-pref-preview-card">
      <div className="sc-pref-card-heading">
       <span className="sc-pref-icon"><LayoutDashboard size={22} aria-hidden="true"/></span>
       <div><span className="sc-pref-step">{ui('VISTA PREVIA')}</span>
        <h2>{ui('Así se verá tu espacio')}</h2>
        <p>{ui('Representación ilustrativa del tema y la densidad seleccionados.')}</p>
       </div>
      </div>
      <div className="sc-pref-preview-area">
       <div className="sc-pref-preview-screen" data-preview-theme={settings.theme} data-density={settings.rows_per_page}
        aria-label={ui('Vista previa ilustrativa del sistema')}>
        <div className="sc-pref-preview-top"><span className="sc-pref-preview-brand"/><span/><span className="sc-pref-preview-avatar"/></div>
        <div className="sc-pref-preview-main">
         <div className="sc-pref-preview-side"><span/><span/><span/><span/></div>
         <div className="sc-pref-preview-content">
          <div className="sc-pref-preview-heading"><span/><span/></div>
          <div className="sc-pref-preview-metrics"><span/><span/><span/></div>
          <div className="sc-pref-preview-table">
           <div className="sc-pref-preview-table-title"><span/><span/></div>
           {[0,1,2,3,4].map(index=><div className="sc-pref-preview-table-row" key={index}><span/><span/><span/></div>)}
          </div>
         </div>
        </div>
       </div>
       <p className="sc-pref-preview-edit-note">{ui('La vista previa cambia mientras eliges opciones; los ajustes solo se aplican cuando guardas.')}</p>
       <span className="sc-pref-preview-disclaimer">{ui('Vista ilustrativa · No representa información real de la escuela')}</span>
      </div>
     </section>
     <section className="sc-pref-card sc-pref-summary-card">
      <div className="sc-pref-card-heading">
       <span className="sc-pref-icon"><ShieldCheck size={22} aria-hidden="true"/></span>
       <div><h2>{ui('Resumen de tu configuración')}</h2><p>{ui('Revisa tus elecciones antes de guardarlas.')}</p></div>
      </div>
      <dl className="sc-pref-summary-list">
       <div><dt>{ui('Idioma')}</dt><dd>{currentLanguage}</dd></div>
       <div><dt>{ui('Apariencia')}</dt><dd>{themeName}</dd></div>
       <div><dt>{ui('Registros por página')}</dt><dd>{settings.rows_per_page}</dd></div>
      </dl>
      <p className="sc-pref-summary-foot"><ShieldCheck size={16} aria-hidden="true"/>
       {ui('Tus preferencias son personales y se guardan de forma segura en tu cuenta.')}
      </p>
     </section>
    </aside>
   </div>
   <footer className="sc-pref-actions">
    <div className="sc-pref-actions-copy"><ShieldCheck size={20} aria-hidden="true"/>
     <span><strong>{ui(dirty?'Tienes cambios pendientes':'Tus ajustes están actualizados')}</strong>
      <small>{ui('Los cambios se aplicarán a tu cuenta al guardarlos.')}</small></span>
    </div>
    <div className="sc-pref-actions-buttons">
     <button className="secondary" type="button" disabled={!dirty||busy} onClick={reset}>
      <RefreshCw size={16} aria-hidden="true"/>{ui('Descartar cambios')}
     </button>
     <button className="primary sc-pref-save" type="submit" disabled={!dirty||busy}>
      <Save size={17} aria-hidden="true"/>{ui(busy?'Guardando…':'Guardar preferencias')}
     </button>
    </div>
   </footer>
  </form>}
 </section>;
}
