import {useInterfaceLocale} from './shared/i18n/LocaleContext';
import {useState,type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';

type Field='email'|'password'|'password_confirmation';
const empty={email:'',password:'',password_confirmation:''};
const names:Record<Field,string>={email:'Correo electrónico',password:'Nueva contraseña',password_confirmation:'Confirmar nueva contraseña'};

export default function PasswordRecovery({schoolName,token,onClose}:{schoolName:string;token?:string;onClose:()=>void}) {
 const {ui}=useInterfaceLocale();
 const [values,setValues]=useState(empty),[errors,setErrors]=useState<Partial<Record<Field,string>>>({});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 function update(name:Field,value:string){setValues(v=>({...v,[name]:value}));setErrors(v=>({...v,[name]:undefined}));setError('');}
 function validate(){
  const next:Partial<Record<Field,string>>={};
  if(token){
   if(!values.password)next.password='Nueva contraseña no puede estar vacía.';
   else if(values.password.length<12)next.password='Nueva contraseña debe tener al menos 12 caracteres.';
   if(!values.password_confirmation)next.password_confirmation='Confirmar nueva contraseña no puede estar vacía.';
   else if(values.password_confirmation!==values.password)next.password_confirmation='Confirmar nueva contraseña no coincide.';
  }else if(!values.email.trim())next.email='Correo electrónico no puede estar vacío.';
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))next.email='Correo electrónico no tiene un formato válido.';
  return next;
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const next=validate();setErrors(next);if(Object.keys(next).length)return;
  setBusy(true);setError('');
  try{
   const payload=token?{password:values.password,password_confirmation:values.password_confirmation,token}:{email:values.email.trim()};
   const result=await api('password_reset',token?'PATCH':'POST',payload);
   if(token){void notify(result.message);onClose();}else setMessage(result.message);
  }catch(e){
   const failure=e as Error & {fieldErrors?:Record<string,string[]>};
   if(failure.fieldErrors){
    const fieldErrors:Partial<Record<Field,string>>={};
    for(const name of Object.keys(empty) as Field[]){
     const m=failure.fieldErrors[name]?.[0];
     if(m)fieldErrors[name]=names[name]+' '+m.replace(/\.$/,'')+'.';
    }
    setErrors(fieldErrors);if(!Object.keys(fieldErrors).length)setError(failure.message);
   }else setError(failure.message);
  }finally{setBusy(false);}
 }
 function field(name:Field,type:string,placeholder:string){
  return <div className="sc-field" key={name}>
    <label htmlFor={'recovery-'+name}>{ui(names[name])}</label>
    <div className={'sc-input-wrap'+(errors[name]?' is-invalid':'')}>
     <input id={'recovery-'+name} name={name} type={type} autoComplete={name==='email'?'email':'new-password'}
      required placeholder={placeholder} value={values[name]} aria-invalid={!!errors[name]}
      aria-describedby={errors[name]?'recovery-'+name+'-error':undefined} onChange={e=>update(name,e.target.value)}/>
    </div>
    {errors[name]&&<p className="sc-field-error" id={'recovery-'+name+'-error'} role="alert">{errors[name]}</p>}
   </div>;
 }
 return <div className="boot sc-recovery"><section className="panel settings sc-recovery-card" style={{width:'min(100%,480px)',textAlign:'left'}}>
  <span className="eyebrow">{schoolName}</span><h1>{ui(token?'Nueva contraseña':'Recupera tu acceso')}</h1>
  <p>{ui(token?'El enlace vence en 15 minutos. Al guardar, se cerrarán todas tus sesiones.':'Te enviaremos un enlace al correo de tu cuenta.')}</p>
  {message?<p role="status">{message}</p>:<form noValidate onSubmit={submit}>
   {token?<>{field('password','password',ui('Al menos 12 caracteres'))}{field('password_confirmation','password',ui('Repite tu nueva contraseña'))}</>:field('email','email','nombre@correo.com')}
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary" disabled={busy}>{ui(busy?'Procesando…':token?'Guardar nueva contraseña':'Enviar enlace')}</button>
  </form>}
  <button type="button" className="text-button" disabled={busy} onClick={onClose}>{ui("Volver al inicio de sesión")}</button>
 </section></div>;
}
