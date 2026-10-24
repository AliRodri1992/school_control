import {useSchoolLocale} from '../../shared/i18n/LocaleContext';
import Combobox from '../../shared/components/Combobox';
import {useEffect,useState,type FormEvent} from 'react';
import {Languages,Save,Settings2,SunMoon} from 'lucide-react';
import {api} from '../../api';
type Settings={locale:string;theme:'system'|'light'|'dark';rows_per_page:number;selected_child_id:number|null};
const baseline:Settings={locale:'es',theme:'system',rows_per_page:15,selected_child_id:null};
export default function Preferences({onSaved}:{onSaved?:(settings:Settings)=>void}){
 const {ui}=useSchoolLocale();
 const [settings,setSettings]=useState(baseline),[available,setAvailable]=useState<{code:string;native_name:string}[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 useEffect(()=>{
  let active=true;
  void Promise.all([api('preferences'),api('languages')]).then(([prefs,langs])=>{
    if(active){setSettings(prefs);setAvailable(langs.filter((item:{status:string})=>item.status==='active'));}
  }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 async function save(event:FormEvent){event.preventDefault();setBusy(true);setError('');setSuccess('');
  try{const next=await api('preferences','PATCH',settings);setSettings(next);setSuccess(ui('Preferencias actualizadas correctamente.'));
   localStorage.setItem('school-locale',next.locale);window.dispatchEvent(new Event('school-locale-changed'));onSaved?.(next);
   document.documentElement.dataset.schoolTheme=next.theme;
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-preferences">
  <div className="page-heading"><div><span className="eyebrow">{ui("MI CUENTA / PERSONALIZACIÓN")}</span>
   <h1>{ui("Preferencias del sistema")}</h1><p>{ui("Configura el idioma y la apariencia para todos los dispositivos donde inicies sesión.")}</p></div></div>
  {loading?<p>{ui("Cargando preferencias…")}</p>:<form className="panel sc-pref-form" onSubmit={save}>
   {error&&<p className="error" role="alert">{error}</p>}
   {success&&<p className="success" role="status">{success}</p>}
   <div className="sc-pref-row"><Languages size={23}/><div><strong>{ui("Idioma")}</strong><p>{ui("Elige el idioma activo para la interfaz.")}</p></div>
    <Combobox label={ui("Idioma preferido")} value={settings.locale} onChange={value=>setSettings(previous=>({...previous,locale:value}))}
      options={(available.length?available:[{code:'es',native_name:'Español'},{code:'en',native_name:'English'}])
        .map(language=>({value:language.code,label:language.native_name}))}/></div>
   <div className="sc-pref-row"><SunMoon size={23}/><div><strong>{ui("Tema visual")}</strong><p>{ui("Modo claro, oscuro o preferencia del dispositivo.")}</p></div>
    <Combobox label={ui("Tema preferido")} value={settings.theme} onChange={value=>setSettings(previous=>({...previous,theme:value as Settings['theme']}))}
      options={[{value:'system',label:ui("Automático")},{value:'light',label:ui("Claro")},{value:'dark',label:ui("Oscuro")}]}/></div>
   <div className="sc-pref-row"><Settings2 size={23}/><div><strong>{ui("Densidad de tablas")}</strong><p>{ui("Registros visibles por página en listados extensos.")}</p></div>
    <Combobox label={ui("Registros por página")} value={String(settings.rows_per_page)}
      onChange={value=>setSettings(previous=>({...previous,rows_per_page:Number(value)}))}
      options={[10,15,25,50].map(size=>({value:String(size),label:size+' registros'}))}/></div>
   <button className="primary" disabled={busy}><Save size={17}/>{busy?'Guardando…':'Guardar preferencias'}</button>
  </form>}
 </section>;
}
