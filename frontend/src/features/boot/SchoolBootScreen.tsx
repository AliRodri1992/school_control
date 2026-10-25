import {CheckCircle2,ClipboardCheck,LoaderCircle,School,Wrench} from 'lucide-react';
import AuliBuilderIllustration from './AuliBuilderIllustration';

export type BootStage='connecting'|'modules';

const steps={
 es:[
  {label:'Conectando con tu escuela',short:'Conectando'},
  {label:'Verificando accesos y cargando módulos',short:'Cargando módulos'}
 ],
 en:[
  {label:'Connecting to your school',short:'Connecting'},
  {label:'Checking access and loading modules',short:'Loading modules'}
 ]
} as const;

const copy={
 es:{
  title:'Preparando',accent:'tu escuela…',
  description:'Auli está organizando todo para que tu espacio de trabajo esté listo.',
  status:'Preparación de School Control',
  heading:'Construyendo tu espacio escolar',
  footer:'Tu escuela, lista para aprender y crecer.',
  busy:'Preparando tu escuela'
 },
 en:{
  title:'Getting',accent:'your school ready…',
  description:'Auli is setting everything up so your workspace is ready.',
  status:'School Control setup',
  heading:'Building your school workspace',
  footer:'Your school, ready to learn and grow.',
  busy:'Preparing your school'
 }
} as const;

/** An independent full-screen loading view. The authenticated navbar and sidebar are never rendered here. */
export default function SchoolBootScreen({locale,stage}:{locale:string;stage:BootStage}){
 const lang=locale==='en'?'en':'es',t=copy[lang],stages=steps[lang];
 const active=stage==='connecting'?0:1;
 return <main className="sc-school-boot" role="status" aria-live="polite" aria-busy="true" aria-label={t.busy}>
  <section className="sc-school-boot-card" aria-labelledby="sc-school-boot-heading">
   <div className="sc-school-boot-scene">
    <div className="sc-school-boot-floating sc-school-boot-floating-left" aria-hidden="true">
     <strong><ClipboardCheck size={16}/>{lang==='en'?'Modules':'Módulos'}</strong>
     <span><CheckCircle2 size={15}/>{lang==='en'?'Academics':'Académico'}</span>
     <span><CheckCircle2 size={15}/>{lang==='en'?'Communication':'Comunicación'}</span>
    </div>
    <div className="sc-school-boot-floating sc-school-boot-floating-right" aria-hidden="true">
     <div className="sc-school-boot-school-mark"><School size={41} strokeWidth={1.6}/></div>
     <span className="sc-school-boot-widget-line"/><span className="sc-school-boot-widget-line short"/>
    </div>
    <div className="sc-school-boot-gear" aria-hidden="true"><Wrench size={50} strokeWidth={1.6}/></div>
    <div className="sc-school-boot-auli" data-illustration="inline-svg"><AuliBuilderIllustration locale={lang}/></div>
    <div className="sc-school-boot-cubes" aria-hidden="true"><span/><span/><span/></div>
   </div>
     <div className="sc-school-boot-copy">
      <span className="sc-school-boot-kicker"><span className="sc-school-boot-pulse"/>{t.heading}</span>
      <h1 id="sc-school-boot-heading">{t.title} <span>{t.accent}</span></h1>
      <p>{t.description}</p>
      <div className="sc-school-boot-progress">
       <div className="sc-school-boot-progress-header"><strong>{t.status}</strong><span>{stages[active].short}<LoaderCircle size={15} className="sc-school-boot-spinner"/></span></div>
       <div role="progressbar" aria-label={stages[active].label} aria-valuetext={stages[active].label} className="sc-school-boot-track">
        <div className="sc-school-boot-progress-motion"/>
       </div>
      </div>
      <ol className="sc-school-boot-steps">
       {stages.map((item,i)=><li className={i<active?'is-done':i===active?'is-current':'is-upcoming'} key={item.label}>
        <span aria-hidden="true">{i<active?<CheckCircle2 size={21}/>:i===active?<LoaderCircle size={21} className="sc-school-boot-spinner"/>:<span className="sc-school-boot-step-ring"/>}</span>
        <span>{item.label}</span>
       </li>)}
      </ol>
     </div>
  </section>
  <p className="sc-school-boot-note">{t.footer}</p>
 </main>;
}
