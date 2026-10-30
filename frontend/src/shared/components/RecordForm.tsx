import {useSchoolLocale} from '../i18n/LocaleContext';
import {useEffect,useState,type FormEvent} from 'react';
import type {Field,Row} from '../../modules';
import Combobox,{type Choice} from './Combobox';
import {MapPin,Users,ShieldCheck,FileText} from 'lucide-react';

export default function RecordForm({fields,initial,onSubmit,onCancel,busy,options,optionName,error,fieldErrors={},layout}:{
 fields:Field[];initial:Row;onSubmit:(v:Row)=>void;onCancel:()=>void;busy:boolean;
 options:(source:string,values:Row)=>Row[];optionName:(record:Row)=>string;error:string;
 fieldErrors?:Record<string,string[]>;layout?:'addresses'|'contacts'|'notes';
}) {
 const {locale,ui}=useSchoolLocale();
 const [values,setValues]=useState<Row>(initial);
 const [step,setStep]=useState(0);
 const wizard=!layout&&fields.length>=6;
 const split=Math.ceil(fields.length/2);
 const [errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{const mapped:Record<string,string>={};
  for(const field of fields){
   const text=fieldErrors[field.key]?.[0];
   if(text)mapped[field.key]=field.label+' '+text.replace(/\.$/,'')+'.';
  }
  if(Object.keys(mapped).length&&wizard){const firstError=fields.findIndex(field=>mapped[field.key]);if(firstError>=split)setStep(1);}
  if(Object.keys(mapped).length) setErrors(existing=>{
    const unchanged=Object.entries(mapped).every(([key,value])=>existing[key]===value);
    return unchanged?existing:{...existing,...mapped};
  });
 },[fieldErrors,fields,wizard,split]);
 function update(key:string,value:string){setValues(v=>({...v,[key]:value,...(key==='course_id'?{enrollment_id:''}:{})}));setErrors(v=>({...v,[key]:''}));}
 function handleSubmit(event:FormEvent){
  event.preventDefault();
  const next:Record<string,string>={};const clean:Row={};
  for(const field of fields){
   const value=values[field.key]??'';
   if(!field.optional&&String(value).trim()==='')next[field.key]=field.label+(locale==='en'?' cannot be empty.':' no puede estar vacío.');
   if(field.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))next[field.key]=field.label+(locale==='en'?' has an invalid format.':' no tiene un formato válido.');
   if(field.type==='datetime-local'&&value){const date=new Date(value);if(!Number.isNaN(date.getTime()))clean[field.key]=date.toISOString();else next[field.key]=field.label+(locale==='en'?' is not a valid date.':' no tiene una fecha válida.');}
   else clean[field.key]=value===''?null:value;
  }
  setErrors(next);
  if(!Object.keys(next).length)onSubmit(clean);
 }
 function localDateTime(value:string){if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
 return <form noValidate onSubmit={handleSubmit}>
  {layout?<div className="sc-dossier-form-groups">{(layout==='addresses'?
   [{title:'Ubicación del domicilio',detail:'Identificación y dirección principal',keys:['country_code','purpose','line1','line2'],icon:MapPin},{title:'Referencia geográfica',detail:'Colonia, municipio y código postal',keys:['neighborhood','locality','region','postal_code'],icon:MapPin},{title:'Preferencia',detail:'Prioridad de este domicilio en el expediente',keys:['primary'],icon:ShieldCheck}]:
   layout==='contacts'?[{title:'Identidad del familiar',detail:'Datos para identificar y contactar a la persona',keys:['name','relationship','email'],icon:Users},{title:'Autorizaciones',detail:'Emergencias y recogida segura del alumno',keys:['emergency','pickup_authorized','primary'],icon:ShieldCheck}]:
   [{title:'Registro de seguimiento',detail:'Describe la observación o acuerdo institucional',keys:['body'],icon:FileText},{title:'Clasificación y privacidad',detail:'Organiza y controla quién puede consultar la nota',keys:['category','visibility'],icon:ShieldCheck}]).map(group=>{
    const Icon=group.icon;
    return <section className="sc-dossier-fieldset" key={group.title}><header><span><Icon size={19}/></span><div><h4>{ui(group.title)}</h4><p>{ui(group.detail)}</p></div></header><div className="form-grid">{fields.filter(field=>group.keys.includes(field.key)).map(field=>{
   const value=String(values[field.key]??'');
   const hasChoices=!!(field.source||field.options);
   const choices:Choice[]=hasChoices?(field.options||options(field.source!,values).map(r=>[String(r.id),optionName(r)] as [string,string]))
    .map(([id,title])=>({value:String(id),label:String(title)})):[];
   return <div className={'sc-record-field'+(field.type==='textarea'?' full':'')} key={field.key}>
    <label htmlFor={'record-'+field.key}>{field.label}{!field.optional&&<span className="required" aria-hidden="true"> *</span>}</label>
    {hasChoices?<Combobox searchable={choices.length>7} id={"record-"+field.key} value={value} label={field.label} options={choices} invalid={!!errors[field.key]} describedBy={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={v=>update(field.key,v)}/>:
      field.type==='textarea'?<textarea id={'record-'+field.key} value={value} placeholder={field.label}
       aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={e=>update(field.key,e.target.value)}/>:
      <input id={'record-'+field.key} value={field.type==='datetime-local'?localDateTime(value):value} placeholder={field.label}
       type={field.type||'text'} min={field.min} max={field.max} step={field.key==='score'?'0.1':field.type==='number'?'1':undefined}
       aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={e=>update(field.key,e.target.value)}/>}
    {errors[field.key]&&<p className="sc-field-error" id={'record-'+field.key+'-error'} role="alert">{errors[field.key]}</p>}
   </div>;
})}</div></section>;
   })}</div>:<div className="sc-workbench-form"><header className="sc-workbench-form-intro"><span>{ui('CONFIGURACIÓN DEL REGISTRO')}</span><h3>{ui('Datos principales')}</h3><p>{ui('Completa los campos obligatorios; revisa los detalles adicionales antes de guardar.')}</p>{wizard&&<div className="sc-workbench-steps" aria-label={ui('Pasos del formulario')}><span aria-current={step===0?'step':undefined}>1 · {ui('Información básica')}</span><span aria-current={step===1?'step':undefined}>2 · {ui('Detalles y confirmación')}</span></div>}</header><div className="form-grid">{(wizard?(step===0?fields.slice(0,split):fields.slice(split)):fields).map(field=>{
   const value=String(values[field.key]??'');
   const hasChoices=!!(field.source||field.options);
   const choices:Choice[]=hasChoices?(field.options||options(field.source!,values).map(r=>[String(r.id),optionName(r)] as [string,string]))
    .map(([id,title])=>({value:String(id),label:String(title)})):[];
   return <div className={'sc-record-field'+(field.type==='textarea'?' full':'')} key={field.key}>
    <label htmlFor={'record-'+field.key}>{field.label}{!field.optional&&<span className="required" aria-hidden="true"> *</span>}</label>
    {hasChoices?<Combobox searchable={choices.length>7} id={"record-"+field.key} value={value} label={field.label} options={choices} invalid={!!errors[field.key]} describedBy={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={v=>update(field.key,v)}/>:
      field.type==='textarea'?<textarea id={'record-'+field.key} value={value} placeholder={field.label}
       aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={e=>update(field.key,e.target.value)}/>:
      <input id={'record-'+field.key} value={field.type==='datetime-local'?localDateTime(value):value} placeholder={field.label}
       type={field.type||'text'} min={field.min} max={field.max} step={field.key==='score'?'0.1':field.type==='number'?'1':undefined}
       aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key]?'record-'+field.key+'-error':undefined}
       onChange={e=>update(field.key,e.target.value)}/>}
    {errors[field.key]&&<p className="sc-field-error" id={'record-'+field.key+'-error'} role="alert">{errors[field.key]}</p>}
   </div>;
})}</div></div>}

  {error&&<p className="error" role="alert">{error}</p>}
  <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>{ui('Cancelar')}</button>
   {wizard&&step===1&&<button className="secondary" type="button" onClick={()=>setStep(0)}>{ui('Anterior')}</button>}
   {wizard&&step===0?<button className="primary" type="button" onClick={()=>{const missing=fields.slice(0,split).find(field=>!field.optional&&!String(values[field.key]??'').trim());if(missing){setErrors(v=>({...v,[missing.key]:missing.label+(locale==='en'?' cannot be empty.':' no puede estar vacío.')}));return;}setStep(1);}}>{ui('Siguiente')}</button>:
   <button className="primary" type="submit" disabled={busy}>{busy?ui('Guardando…'):ui('Guardar')}</button>}</div>
 </form>;
}
