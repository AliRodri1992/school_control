import {useSchoolLocale} from '../i18n/LocaleContext';
import {useEffect,useState,type FormEvent} from 'react';
import type {Field,Row} from '../../modules';
import Combobox,{type Choice} from './Combobox';

export default function RecordForm({fields,initial,onSubmit,onCancel,busy,options,optionName,error,fieldErrors={}}:{
 fields:Field[];initial:Row;onSubmit:(v:Row)=>void;onCancel:()=>void;busy:boolean;
 options:(source:string,values:Row)=>Row[];optionName:(record:Row)=>string;error:string;
 fieldErrors?:Record<string,string[]>;
}) {
 const {locale,ui}=useSchoolLocale();
 const [values,setValues]=useState<Row>(initial);
 const [errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{const mapped:Record<string,string>={};
  for(const field of fields){
   const text=fieldErrors[field.key]?.[0];
   if(text)mapped[field.key]=field.label+' '+text.replace(/\.$/,'')+'.';
  }
  if(Object.keys(mapped).length) setErrors(existing=>{
    const unchanged=Object.entries(mapped).every(([key,value])=>existing[key]===value);
    return unchanged?existing:{...existing,...mapped};
  });
 },[fieldErrors,fields]);
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
  <div className="form-grid">{fields.map(field=>{
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
  })}</div>
  {error&&<p className="error" role="alert">{error}</p>}
  <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>{ui('Cancelar')}</button>
   <button className="primary" type="submit" disabled={busy}>{busy?ui('Guardando…'):ui('Guardar')}</button></div>
 </form>;
}
