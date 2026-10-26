import {useEffect,useState,type FormEvent} from 'react';
import {Check,Globe2,Languages,LayoutDashboard,Monitor,Moon,Palette,RefreshCw,Rows3,Save,ShieldCheck,SlidersHorizontal,Sun} from 'lucide-react';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import {api} from '../../api';
import {notify} from '../../notifications';

type Theme='system'|'light'|'dark';
type Settings={locale:string;theme:Theme;rows_per_page:number;selected_child_id:number|null;
 time_format:string;date_format:string;week_start:string;table_density:string;
 reduce_motion:boolean;high_contrast:boolean;large_text:boolean;hide_sensitive_data:boolean;hide_notification_previews:boolean;
 remember_filters:boolean;notification_email:boolean;notification_school:boolean;notification_grades:boolean;notification_attendance:boolean;notification_events:boolean;
 notification_digest:string;calendar_view:string;preferred_group_id:number|null;};
type Language={code:string;native_name:string;status:string};
const baseline:Settings={locale:'es',theme:'system',rows_per_page:15,selected_child_id:null,time_format:'24h',date_format:'dd/mm/yyyy',week_start:'monday',table_density:'comfortable',reduce_motion:false,high_contrast:false,large_text:false,hide_sensitive_data:false,hide_notification_previews:false,remember_filters:false,notification_email:true,notification_school:true,notification_grades:true,notification_attendance:true,notification_events:true,notification_digest:'immediate',calendar_view:'month',preferred_group_id:null};
const themes=[{value:'system',title:'Automático',description:'Se adapta a tu dispositivo',icon:Monitor},
 {value:'light',title:'Claro',description:'Espacios luminosos',icon:Sun},
 {value:'dark',title:'Oscuro',description:'Menos brillo en pantalla',icon:Moon}] as const;
const pageSizes=[10,15,25,50] as const;

/** Wide account settings workspace with one explicit, server-persisted save. */
export default function Preferences({onSaved}:{onSaved?:(settings:Settings)=>void}){
 const {ui}=useSchoolLocale();
 const [section,setSection]=useState<'appearance'|'alerts'|'lists'|'calendar'|'accessibility'|'privacy'>('appearance');
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
   setSettings({...baseline,...prefs});setPersisted({...baseline,...prefs});
   setAvailable(langs.filter(language=>language.status==='active'));
   setLoaded(true);
  }).catch((cause:Error)=>{if(active){setError(cause.message);setLoaded(false);}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[attempt]);
 const dirty=loaded&&(settings.locale!==persisted.locale||
  settings.theme!==persisted.theme||settings.rows_per_page!==persisted.rows_per_page||
  (Object.keys(baseline) as (keyof Settings)[]).some(key=>settings[key]!==persisted[key]));
 const languages=available.length?available:[{code:'es',native_name:'Español',status:'active'},{code:'en',native_name:'English',status:'active'}];
 const languageOptions=languages.some(language=>language.code===settings.locale)?languages:
  [...languages,{code:settings.locale,native_name:settings.locale.toUpperCase(),status:'active'}];
 const currentLanguage=languageOptions.find(language=>language.code===settings.locale)?.native_name||settings.locale.toUpperCase();
 const themeName=ui(themes.find(theme=>theme.value===settings.theme)?.title||'Automático');
 function update<K extends 'locale'|'theme'|'rows_per_page'>(key:K,value:Settings[K]){
  setSettings(previous=>({...previous,[key]:value}));
  setError('');
 }
 function patch<K extends keyof Settings>(key:K,value:Settings[K]){
  setSettings(previous=>({...previous,[key]:value}));setError('');
 }
 function reset(){setSettings(persisted);setError('');}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!dirty||busy)return;
  setBusy(true);setError('');
  try{
   const changed=Object.fromEntries((Object.keys(settings) as (keyof Settings)[])
    .filter(key=>settings[key]!==persisted[key]).map(key=>[key,settings[key]]));
   const result:Settings={...settings,...await api('preferences','PATCH',changed)};
   setSettings(result);setPersisted(result);
   localStorage.setItem('school-locale',result.locale);
   document.documentElement.dataset.schoolTheme=result.theme;
   window.dispatchEvent(new Event('school-locale-changed'));
   const root=document.documentElement;
   root.dataset.schoolContrast=String(result.high_contrast);
   root.dataset.schoolLargeText=String(result.large_text);
   root.dataset.schoolReduceMotion=String(result.reduce_motion);
   root.dataset.schoolTableDensity=result.table_density;
   root.dataset.schoolHideSensitive=String(result.hide_sensitive_data);
   localStorage.setItem('school-preferences',JSON.stringify(result));
   window.dispatchEvent(new Event('school-preferences-changed'));
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
<nav className="sc-pref-section-tabs" aria-label={ui('Categorías de preferencias')}>
   {([['appearance','Apariencia e idioma'],['alerts','Notificaciones'],['lists','Tablas y listados'],
    ['calendar','Fecha y calendario'],['accessibility','Accesibilidad'],['privacy','Privacidad']] as const).map(([id,label])=>
    <button type="button" key={id} className={section===id?'is-active':''} aria-current={section===id?'page':undefined}
     onClick={()=>setSection(id)}>{ui(label)}</button>)}
   </nav>
   {section!=='appearance'&&<section className="sc-pref-card sc-pref-extra" aria-label={ui('Opciones personales')}>
    <div className="sc-pref-card-heading"><div><h2>{ui(({alerts:'Notificaciones y avisos',lists:'Tablas y listados',calendar:'Fecha y calendario',accessibility:'Accesibilidad',privacy:'Privacidad y seguridad'} as Record<string,string>)[section])}</h2>
     <p>{ui('Estos ajustes pertenecen a tu cuenta y se conservarán cuando guardes.')}</p></div></div>
    <div className="sc-pref-extra-controls">
     {section==='alerts'&&<>
      {([['notification_school','Avisos de la escuela'],['notification_email','Canal de correo electrónico'],
       ['notification_grades','Calificaciones'],['notification_attendance','Asistencias'],
       ['notification_events','Eventos y actividades']] as const).map(([key,label])=>
       <label className="sc-pref-toggle" key={key}><span>{ui(label)}</span><input type="checkbox" checked={settings[key]} onChange={event=>patch(key,event.target.checked)}/></label>)}
      <label>{ui('Frecuencia de correo electrónico')}<select value={settings.notification_digest} onChange={event=>patch('notification_digest',event.target.value)}>
       <option value="immediate">{ui('Inmediatamente')}</option><option value="daily">{ui('Resumen diario')}</option><option value="weekly">{ui('Resumen semanal')}</option></select></label>
      <p className="sc-pref-help-line">{ui('Las notificaciones críticas de seguridad se mantienen activas. Las preferencias de correo requieren un servicio de envíos configurado.')}</p>
     </>}
     {section==='lists'&&<>
      <label>{ui('Densidad de tablas')}<select value={settings.table_density} onChange={event=>patch('table_density',event.target.value)}>
       <option value="comfortable">{ui('Cómoda')}</option><option value="compact">{ui('Compacta')}</option><option value="spacious">{ui('Amplia')}</option></select></label>
      <label className="sc-pref-toggle">{ui('Recordar filtros de listados')}<input type="checkbox" checked={settings.remember_filters} onChange={event=>patch('remember_filters',event.target.checked)}/></label>
      <p className="sc-pref-help-line">{ui('Puedes configurar los registros por página en Apariencia e idioma.')}</p>
     </>}
     {section==='calendar'&&<>
      <label>{ui('Formato de hora')}<select value={settings.time_format} onChange={event=>patch('time_format',event.target.value)}>
       <option value="24h">24 horas</option><option value="12h">12 horas</option></select></label>
      <label>{ui('Formato de fecha')}<select value={settings.date_format} onChange={event=>patch('date_format',event.target.value)}>
       <option value="dd/mm/yyyy">DD/MM/AAAA</option><option value="mm/dd/yyyy">MM/DD/AAAA</option><option value="yyyy-mm-dd">AAAA-MM-DD</option></select></label>
      <label>{ui('Primer día de la semana')}<select value={settings.week_start} onChange={event=>patch('week_start',event.target.value)}>
       <option value="monday">{ui('Lunes')}</option><option value="sunday">{ui('Domingo')}</option></select></label>
      <label>{ui('Vista inicial del calendario')}<select value={settings.calendar_view} onChange={event=>patch('calendar_view',event.target.value)}>
       <option value="month">{ui('Mes')}</option><option value="week">{ui('Semana')}</option><option value="day">{ui('Día')}</option></select></label>
     </>}
     {section==='accessibility'&&<>
      {([['large_text','Texto ampliado'],['high_contrast','Contraste alto'],['reduce_motion','Reducir animaciones']] as const).map(([key,label])=>
       <label className="sc-pref-toggle" key={key}>{ui(label)}<input type="checkbox" checked={settings[key]} onChange={event=>patch(key,event.target.checked)}/></label>)}
     </>}
     {section==='privacy'&&<>
      {([['hide_sensitive_data','Ocultar datos sensibles de la cuenta'],['hide_notification_previews','Ocultar vista previa de notificaciones']] as const).map(([key,label])=>
       <label className="sc-pref-toggle" key={key}>{ui(label)}<input type="checkbox" checked={settings[key]} onChange={event=>patch(key,event.target.checked)}/></label>)}
      <p className="sc-pref-help-line">{ui('Para cerrar sesiones de otros dispositivos, utiliza Seguridad de la cuenta.')}</p>
     </>}
    </div>
   </section>}
   {section==='appearance'&&<>
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
   </>}
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
