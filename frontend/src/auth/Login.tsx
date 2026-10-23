import {useState, type FormEvent} from 'react';
import {ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail, UserRound} from 'lucide-react';
import PasswordRecovery from '../PasswordRecovery';
import {api} from '../api';
import {notify} from '../notifications';
import type {Row} from '../modules';

type Values = {name:string;email:string;password:string;password_confirmation:string};
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName,string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyValues:Values = {name:'',email:'',password:'',password_confirmation:''};

export default function Login({school,initialError,onLogin}:{school:Row;initialError:string;onLogin:(user:Row)=>Promise<void>}) {
  const [recovering,setRecovering] = useState(false);
  const [register,setRegister] = useState(false);
  const [values,setValues] = useState<Values>(emptyValues);
  const [errors,setErrors] = useState<Errors>({});
  const [error,setError] = useState(initialError);
  const [busy,setBusy] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [showConfirmation,setShowConfirmation] = useState(false);

  function setField(name:FieldName,value:string) {
    setValues(current=>({...current,[name]:value}));
    setErrors(current=>({...current,[name]:undefined}));
    if(error)setError('');
  }

  function validate():Errors {
    const next:Errors = {};
    if(register&&!values.name.trim()) next.name='Nombre completo no puede estar vacío.';
    if(!values.email.trim()) next.email='Correo electrónico no puede estar vacío.';
    else if(!emailPattern.test(values.email.trim())) next.email='Correo electrónico no tiene un formato válido.';
    if(!values.password) next.password='Contraseña no puede estar vacía.';
    else if(register&&values.password.length<12) next.password='Contraseña debe contener al menos 12 caracteres.';
    if(register) {
      if(!values.password_confirmation) next.password_confirmation='Confirmación de contraseña no puede estar vacía.';
      else if(values.password_confirmation!==values.password) next.password_confirmation='Confirmación de contraseña no coincide.';
    }
    return next;
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next=validate();
    setErrors(next);
    if(Object.keys(next).length) return;
    setBusy(true);setError('');
    try {
      const payload={email:values.email.trim().toLowerCase(),password:values.password,
        ...(register?{name:values.name.trim(),password_confirmation:values.password_confirmation}:{})};
      const result=await api(register?'registration':'session','POST',payload);
      await onLogin(result.user);
      void notify(register?'Cuenta creada correctamente.':'Sesión iniciada correctamente.');
    } catch(cause) {
      const failure=cause as Error & {fieldErrors?:Record<string,string[]>};
      if(failure.fieldErrors) {
        const nextErrors:Errors={};
        for(const name of Object.keys(emptyValues) as FieldName[]) {
          const messages=failure.fieldErrors[name];
          if(messages?.length) {
            const label:Record<FieldName,string>={name:'Nombre completo',email:'Correo electrónico',password:'Contraseña',password_confirmation:'Confirmación de contraseña'};
            nextErrors[name]=label[name]+' '+messages[0].replace(/\.$/,'')+'.';
          }
        }
        setErrors(nextErrors);
        if(!Object.keys(nextErrors).length)setError(failure.message);
      } else setError(failure.message);
    } finally {setBusy(false);}
  }

  if(recovering)return <PasswordRecovery schoolName={school.name} onClose={()=>setRecovering(false)}/>;

  function field(name:FieldName,label:string,type:string,placeholder:string,required=true) {
    const visible=(name==='password'&&showPassword)||(name==='password_confirmation'&&showConfirmation);
    const actualType=type==='password'&&visible?'text':type;
    return <div className="sc-field" key={name}>
      <label htmlFor={'auth-'+name}>{label}{required&&<span className="sc-required" aria-hidden="true"> *</span>}</label>
      <div className={'sc-input-wrap'+(errors[name]?' is-invalid':'')}>
        {name==='email'?<Mail size={19} aria-hidden="true"/>:name==='name'?<UserRound size={19} aria-hidden="true"/>:<LockKeyhole size={19} aria-hidden="true"/>}
        <input id={'auth-'+name} name={name} type={actualType} value={values[name]}
          autoComplete={name==='name'?'name':name==='email'?'email':register?'new-password':'current-password'}
          aria-invalid={!!errors[name]} aria-describedby={errors[name]?'auth-'+name+'-error':undefined}
          placeholder={placeholder} onChange={e=>setField(name,e.target.value)} required={required}/>
        {type==='password'&&<button type="button" className="sc-visibility" aria-label={visible?'Ocultar '+label.toLowerCase():'Mostrar '+label.toLowerCase()}
          onClick={()=>name==='password'?setShowPassword(x=>!x):setShowConfirmation(x=>!x)}>
          {visible?<EyeOff size={18}/>:<Eye size={18}/>}
        </button>}
      </div>
      {errors[name]&&<p id={'auth-'+name+'-error'} className="sc-field-error" role="alert">{errors[name]}</p>}
    </div>;
  }

  return <div className="login sc-auth">
    <section className="login-story sc-login-story" aria-label="Bienvenida">
      <div className="brand sc-login-brand">
        {school.logo_url?<img src={school.logo_url} alt="Logotipo de la escuela"/>:<span className="sc-brand-symbol"><BookOpen size={24}/></span>}
        <div><strong>{school.name}</strong><small>School Control</small></div>
      </div>
      <div className="sc-login-copy">
        <span className="sc-kicker">UNA COMUNIDAD QUE APRENDE JUNTA</span>
        <h1>Una gran historia<br/>comienza en el aula.</h1>
        <p>Conecta familias, docentes y estudiantes en una experiencia escolar más simple, humana e inteligente.</p>
      </div>
      <img className="sc-auli-hero" src="/illustrations/auli-welcome.svg" alt="Auli, el loro asistente escolar, da la bienvenida"/>
      <div className="sc-login-foot"><span className="sc-status-light"/> Diseño pensado para cada etapa del aprendizaje.</div>
    </section>
    <section className="login-form sc-login-panel">
      <div className="sc-auth-top"><span className="sc-auth-eyebrow">TU PORTAL ESCOLAR</span><span className="sc-auth-locale">Español (México)</span></div>
      <div className="sc-auth-heading"><span className="sc-auth-mark"><BookOpen size={22}/></span>
        <h2>{register?'Crea tu cuenta familiar':'Bienvenido de nuevo'}</h2>
        <p>{register?'Regístrate para dar seguimiento a las solicitudes escolares de tus hijos.':'Ingresa tus credenciales para continuar.'}</p>
      </div>
      <form noValidate onSubmit={submit} className="sc-auth-form">
        {register&&field('name','Nombre completo','text','Tu nombre y apellidos')}
        {field('email','Correo electrónico','email','nombre@correo.com')}
        {field('password','Contraseña','password',register?'Al menos 12 caracteres':'Ingresa tu contraseña')}
        {register&&field('password_confirmation','Confirmación de contraseña','password','Repite tu contraseña')}
        {error&&<p className="sc-auth-error" role="alert">{error}</p>}
        {!register&&<div className="sc-forgot"><button type="button" className="text-button" onClick={()=>setRecovering(true)}>¿Olvidaste tu contraseña?</button></div>}
        <button className="primary sc-auth-submit" type="submit" disabled={busy} aria-busy={busy}>
          {busy?'Procesando…':register?'Crear cuenta familiar':'Iniciar sesión'}<ArrowRight size={19}/>
        </button>
      </form>
      <p className="sc-auth-switch">{register?'¿Ya tienes una cuenta?':'¿Eres padre, madre o tutor?'}{' '}
        <button className="text-button" type="button" onClick={()=>{setRegister(x=>!x);setErrors({});setError('');setShowPassword(false);setShowConfirmation(false);}}>
          {register?'Inicia sesión':'Regístrate aquí'}
        </button>
      </p>
      <p className="sc-auth-hint">Los accesos de docentes y estudiantes los proporciona la administración de la escuela.</p>
      <footer className="sc-auth-footer">School Control · Experiencia escolar conectada</footer>
    </section>
  </div>;
}
