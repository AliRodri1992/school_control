import {useEffect,useState,type FormEvent} from 'react';
import {Languages,Save,Settings2,SunMoon} from 'lucide-react';
import {api} from '../../api';
type Settings={locale:string;theme:'system'|'light'|'dark';rows_per_page:number;selected_child_id:number|null};
const baseline:Settings={locale:'es',theme:'system',rows_per_page:15,selected_child_id:null};
export default function Preferences({onSaved}:{onSaved?:(settings:Settings)=>void}){
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
  try{const next=await api('preferences','PATCH',settings);setSettings(next);setSuccess('Preferencias actualizadas correctamente.');
   localStorage.setItem('school-locale',next.locale);onSaved?.(next);
   document.documentElement.dataset.schoolTheme=next.theme;
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="sc-preferences">
  <div className="page-heading"><div><span className="eyebrow">MI CUENTA / PERSONALIZACIÓN</span>
   <h1>Preferencias del sistema</h1><p>Configura el idioma y la apariencia para todos los dispositivos donde inicies sesión.</p></div></div>
  {loading?<p>Cargando preferencias…</p>:<form className="panel sc-pref-form" onSubmit={save}>
   {error&&<p className="error" role="alert">{error}</p>}
   {success&&<p className="success" role="status">{success}</p>}
   <div className="sc-pref-row"><Languages size={23}/><div><strong>Idioma</strong><p>Elige el idioma activo para la interfaz.</p></div>
    <select aria-label="Idioma preferido" value={settings.locale} onChange={e=>setSettings(v=>({...v,locale:e.target.value}))}>
     {(available.length?available:[{code:'es',native_name:'Español'},{code:'en',native_name:'English'}]).map(l=><option value={l.code} key={l.code}>{l.native_name}</option>)}
    </select></div>
   <div className="sc-pref-row"><SunMoon size={23}/><div><strong>Tema visual</strong><p>Modo claro, oscuro o preferencia del dispositivo.</p></div>
    <select aria-label="Tema preferido" value={settings.theme} onChange={e=>setSettings(v=>({...v,theme:e.target.value as Settings['theme']}))}>
      <option value="system">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option>
    </select></div>
   <div className="sc-pref-row"><Settings2 size={23}/><div><strong>Densidad de tablas</strong><p>Registros visibles por página en listados extensos.</p></div>
    <select aria-label="Registros por página" value={settings.rows_per_page} onChange={e=>setSettings(v=>({...v,rows_per_page:Number(e.target.value)}))}>
      {[10,15,25,50].map(size=><option key={size} value={size}>{size} registros</option>)}
    </select></div>
   <button className="primary" disabled={busy}><Save size={17}/>{busy?'Guardando…':'Guardar preferencias'}</button>
  </form>}
 </section>;
}
