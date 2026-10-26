import {useInterfaceLocale} from '../shared/i18n/LocaleContext';
import {lazy,Suspense,useState, type FormEvent} from 'react';
import {ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail, UserRound} from 'lucide-react';
const PasswordRecovery=lazy(()=>import('../PasswordRecovery'));
import {api} from '../api';
import {notify} from '../notifications';
import type {Row} from '../modules';

type Values = {name:string;email:string;password:string;password_confirmation:string};
type FieldName = keyof Values;
type Errors = Partial<Record<FieldName,string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emptyValues:Values = {name:'',email:'',password:'',password_confirmation:''};

export default function Login({school,initialError,onLogin}:{school:Row;initialError:string;onLogin:(user:Row)=>Promise<void>}) {
 const {ui,locale}=useInterfaceLocale();
  const [recovering,setRecovering] = useState(false);
  const [mfaRequired,setMfaRequired]=useState(false);
  const [mfaCode,setMfaCode]=useState('');
  const [register,setRegister] = useState(false);
  const [values,setValues] = useState<Values>(emptyValues);
  const [errors,setErrors] = useState<Errors>({});
  const [error,setError] = useState(initialError);
  const [busy,setBusy] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [showConfirmation,setShowConfirmation] = useState(false);
  const [mfaRequired,setMfaRequired] = useState(false);
  const [otpCode,setOtpCode] = useState('');

  function setField(name:FieldName,value:string) {
    setValues(current=>({...current,[name]:value}));
    setErrors(current=>({...current,[name]:undefined}));
    if(error)setError('');
  }

  function validate():Errors {
    const next:Errors = {};
    if(register&&!values.name.trim()) next.name=ui('Nombre completo no puede estar vacío.');
    if(!values.email.trim()) next.email=ui('Correo electrónico no puede estar vacío.');
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
      if(result.mfa_required){setMfaRequired(true);setOtpCode('');return;}
      if(result.mfa_required){
        setMfaRequired(true);setValues(emptyValues);
        return;
      }
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

  async function verifyOtp(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy||!otpCode.trim())return;
    setBusy(true);setError('');
    try{
      const result=await api('session/verify_otp','POST',{code:otpCode.trim()});
      await onLogin(result.user);
      void notify('Sesión iniciada correctamente.');
    }catch(cause){setError((cause as Error).message);}
    finally{setBusy(false);}
  }

  if(mfaRequired)return <div className="login sc-auth sc-mfa-login">
   <section className="login-story sc-login-story" aria-label={ui('Bienvenida')}>
    <div className="brand sc-login-brand">
     <span className="sc-brand-symbol"><BookOpen size={24}/></span>
     <div><strong>{school.name}</strong><small>School Control</small></div>
    </div>
    <div className="sc-login-copy">
     <span className="sc-kicker">{ui('PROTECCIÓN DE TU CUENTA')}</span>
     <h1>{ui('Un acceso escolar')}<br/>{ui('más seguro.')}</h1>
     <p>{ui('Protegemos tu información con una segunda verificación de identidad.')}</p>
    </div>
    <img className="sc-auli-hero" src="/illustrations/auli-welcome.svg" alt={ui('Auli acompaña el acceso seguro')}/>
   </section>
   <section className="login-form sc-login-panel">
    <div className="sc-auth-top"><span className="sc-auth-eyebrow">{ui('SEGUNDO FACTOR')}</span></div>
    <div className="sc-auth-heading"><span className="sc-auth-mark"><LockKeyhole size={22}/></span>
     <h2>{ui('Verifica tu identidad')}</h2>
     <p>{ui('Introduce el código de seis dígitos de tu aplicación autenticadora o un código de recuperación.')}</p>
    </div>
    <form className="sc-auth-form" onSubmit={event=>void verifyOtp(event)}>
     <div className="sc-field">
      <label htmlFor="sc-login-totp">{ui('Código de autenticación')}</label>
      <div className="sc-input-wrap">
       <LockKeyhole size={19} aria-hidden="true"/>
       <input id="sc-login-totp" autoComplete="one-time-code" value={otpCode} required
        onChange={event=>setOtpCode(event.target.value)} placeholder="000000"/>
      </div>
     </div>
     {error&&<p role="alert" className="sc-auth-error">{error}</p>}
     <button type="submit" className="primary sc-auth-submit" disabled={busy}>
      {ui(busy?'Verificando…':'Verificar y continuar')}<ArrowRight size={19}/>
     </button>
    </form>
    <button type="button" className="text-button sc-mfa-change-account" onClick={()=>{
     void api('session','DELETE').finally(()=>{setMfaRequired(false);setOtpCode('');setError('');});
    }}>{ui('Usar otra cuenta')}</button>
   </section>
  </div>;

  async function verifyMfa(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!mfaCode.trim())return;
    setBusy(true);setError('');
    try{
      const result=await api('session/verify_otp','POST',{code:mfaCode.trim()});
      await onLogin(result.user);
      void notify(ui('Sesión iniciada correctamente.'));
    }catch(cause){setError((cause as Error).message);}
    finally{setBusy(false);}
  }

  if(recovering)return <Suspense fallback={<div className="boot" role="status">{ui("Cargando recuperación de contraseña…")}</div>}><PasswordRecovery schoolName={school.name} onClose={()=>setRecovering(false)}/></Suspense>;

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
        {type==='password'&&<button type="button" className="sc-visibility" aria-label={visible?ui('Ocultar ')+label.toLowerCase():ui('Mostrar ')+label.toLowerCase()}
          onClick={()=>name==='password'?setShowPassword(x=>!x):setShowConfirmation(x=>!x)}>
          {visible?<EyeOff size={18}/>:<Eye size={18}/>}
        </button>}
      </div>
      {errors[name]&&<p id={'auth-'+name+'-error'} className="sc-field-error" role="alert">{errors[name]}</p>}
    </div>;
  }

  if(mfaRequired)return <div className="login sc-auth sc-mfa-login">
    <section className="login-story sc-login-story" aria-label={ui('Verificación de seguridad')}>
      <div className="brand sc-login-brand"><BookOpen size={24}/><strong>{school.name}</strong></div>
      <div className="sc-login-copy"><span className="sc-kicker">{ui('PROTECCIÓN DE TU CUENTA')}</span>
       <h1>{ui('Un paso más para entrar.')}</h1>
       <p>{ui('Tu escuela y tus datos personales merecen un acceso seguro.')}</p>
      </div>
      <img className="sc-auli-hero" src="/illustrations/auli-welcome.svg" alt={ui('Bienvenida de Auli')}/>
    </section>
    <section className="login-form sc-login-panel">
      <div className="sc-auth-heading"><span className="sc-auth-mark"><LockKeyhole size={23}/></span>
       <h2>{ui('Verificación en dos pasos')}</h2>
       <p>{ui('Escribe el código temporal de tu aplicación autenticadora o un código de recuperación.')}</p>
      </div>
      <form className="sc-auth-form" onSubmit={event=>void verifyMfa(event)}>
        <div className="sc-field"><label htmlFor="sc-mfa-login-code">{ui('Código de verificación')}</label>
          <div className="sc-input-wrap"><LockKeyhole size={18}/>
           <input id="sc-mfa-login-code" required autoFocus autoComplete="one-time-code"
            value={mfaCode} onChange={event=>setMfaCode(event.target.value)}
            placeholder={ui('Código de 6 dígitos o recuperación')}/>
          </div>
        </div>
        {error&&<p className="sc-auth-error" role="alert">{error}</p>}
        <button className="primary sc-auth-submit" type="submit" disabled={busy}>
          {ui(busy?'Verificando…':'Verificar e iniciar sesión')}<ArrowRight size={18}/>
        </button>
        <button type="button" className="text-button" onClick={()=>{
          setMfaRequired(false);setMfaCode('');setError('');
          void api('session','DELETE').catch(()=>undefined);
        }}>{ui('Volver al inicio de sesión')}</button>
      </form>
    </section>
  </div>;

  return <div className="login sc-auth">
    <section className="login-story sc-login-story" aria-label={ui("Bienvenida")}>
      <div className="brand sc-login-brand">
        {school.logo_url?<img src={school.logo_url} alt="Logotipo de la escuela"/>:<span className="sc-brand-symbol"><BookOpen size={24}/></span>}
        <div><strong>{school.name}</strong><small>School Control</small></div>
      </div>
      <div className="sc-login-copy">
        <span className="sc-kicker">{ui("UNA COMUNIDAD QUE APRENDE JUNTA")}</span>
        <h1>{ui("Una gran historia")}<br/>{ui("comienza en el aula.")}</h1>
        <p>{ui("Conecta familias, docentes y estudiantes en una experiencia escolar más simple, humana e inteligente.")}</p>
      </div>
      <img className="sc-auli-hero" src="/illustrations/auli-welcome.svg" alt="Auli, el loro asistente escolar, da la bienvenida"/>
      <div className="sc-login-foot"><span className="sc-status-light"/> {ui("Diseño pensado para cada etapa del aprendizaje.")}</div>
    </section>
    <section className="login-form sc-login-panel">
      <div className="sc-auth-top"><span className="sc-auth-eyebrow">{ui("TU PORTAL ESCOLAR")}</span><span className="sc-auth-locale">{ui("Español (México)")}</span></div>
      <div className="sc-auth-heading"><span className="sc-auth-mark"><BookOpen size={22}/></span>
        <h2>{ui(register?'Crea tu cuenta familiar':'Bienvenido de nuevo')}</h2>
        <p>{ui(register?'Regístrate para dar seguimiento a las solicitudes escolares de tus hijos.':'Ingresa tus credenciales para continuar.')}</p>
      </div>
      <form noValidate onSubmit={submit} className="sc-auth-form">
        {register&&field('name',ui('Nombre completo'),'text',ui('Tu nombre y apellidos'))}
        {field('email',ui('Correo electrónico'),'email','nombre@correo.com')}
        {field('password',ui('Contraseña'),'password',ui(register?'Al menos 12 caracteres':'Ingresa tu contraseña'))}
        {register&&field('password_confirmation',ui('Confirmación de contraseña'),'password',ui('Repite tu contraseña'))}
        {error&&<p className="sc-auth-error" role="alert">{error}</p>}
        {!register&&<div className="sc-forgot"><button type="button" className="text-button" onClick={()=>setRecovering(true)}>{ui("¿Olvidaste tu contraseña?")}</button></div>}
        <button className="primary sc-auth-submit" type="submit" disabled={busy} aria-busy={busy}>
          {ui(busy?'Procesando…':register?'Crear cuenta familiar':'Iniciar sesión')}<ArrowRight size={19}/>
        </button>
      </form>
      <p className="sc-auth-switch">{ui(register?'¿Ya tienes una cuenta?':'¿Eres padre, madre o tutor?')}{' '}
        <button className="text-button" type="button" onClick={()=>{setRegister(x=>!x);setErrors({});setError('');setShowPassword(false);setShowConfirmation(false);}}>
          {ui(register?'Inicia sesión':'Regístrate aquí')}
        </button>
      </p>
      <p className="sc-auth-hint">{ui("Los accesos de docentes y estudiantes los proporciona la administración de la escuela.")}</p>
      <footer className="sc-auth-footer">{ui("School Control · Experiencia escolar conectada")}</footer>
    </section>
  </div>;
}
