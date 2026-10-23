import {useEffect,useState,type ReactNode} from 'react';
import {Bell,BookOpen,CalendarClock,ChevronDown,ChevronRight,HelpCircle,Languages,LogOut,Menu,Search,UserRound,X} from 'lucide-react';
import {api} from '../api';
import type {Row} from '../modules';
import {currentPortal,makePortalUrl,portalLabels,visibleGroups,type NavItem} from './portalNavigation';

export function PortalChrome({user,school,page,mobile,onMobile,can,pendingAdmissions,onNavigate,onSignOut,children}:{
 user:Row;school:Row;page:string;mobile:boolean;onMobile:(open:boolean)=>void;
 can:(permission:string)=>boolean;pendingAdmissions:number;onNavigate:(page:string)=>void;onSignOut:()=>Promise<void>;children:ReactNode;
}) {
 const portal=currentPortal(user.role),groups=visibleGroups(portal,can);
 const [expanded,setExpanded]=useState<string[]>(['Inicio','Mi actividad','Mi escuela','Mi familia','Gestión escolar']);
 const [query,setQuery]=useState('');
 const [clock,setClock]=useState(()=>new Date());
 const [locale,setLocale]=useState<'es'|'en'>(()=>localStorage.getItem('school-locale')==='en'?'en':'es');
 const [accountOpen,setAccountOpen]=useState(false);
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [unread,setUnread]=useState(0);
 const [notificationItems,setNotificationItems]=useState<Row[]>([]);
 const [noticeError,setNoticeError]=useState('');
 useEffect(()=>{const interval=window.setInterval(()=>setClock(new Date()),1000);return()=>window.clearInterval(interval)},[]);
 useEffect(()=>{
   let active=true;
   async function update(){try{
     const result=await api('notifications');
     if(active){setUnread(result.unread_count||0);setNotificationItems(result.items||[]);setNoticeError('');}
   }catch(e){if(active)setNoticeError((e as Error).message);}}
   void update();const interval=window.setInterval(()=>void update(),60000);
   return()=>{active=false;window.clearInterval(interval);}
 },[user.id]);
 function toggle(key:string){setExpanded(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key]);}
 function navigate(next:string){onNavigate(next);setAccountOpen(false);setNotificationsOpen(false);}
 async function read(item:Row){
   try{
     await api('notifications/'+item.id+'/read','POST');
     setUnread(v=>Math.max(0,v-(item.read_at?0:1)));
     setNotificationItems(v=>v.map(x=>x.id===item.id?{...x,read_at:new Date().toISOString()}:x));
     if(item.page)navigate(item.page);
   }catch(e){setNoticeError((e as Error).message);}
 }
 function renderItem(item:NavItem,depth:number):ReactNode{
   const children=item.children||[],isActive=page===item.key||children.some(child=>child.key===page);
   const isOpen=expanded.includes(item.key);
   return <div className="sc-nav-node" key={item.key+'-'+depth}>
     <div className={'sc-nav-item'+(isActive?' is-active':'')} style={{paddingLeft:depth?19:4}}>
       <button className="sc-nav-main" type="button" aria-current={page===item.key?'page':undefined} onClick={()=>navigate(item.key)}>
         <span className="sc-nav-mark">{depth?'·':<ChevronRight size={15}/>}</span><span>{item.title}</span>
         {item.key==='admissions'&&pendingAdmissions>0&&<span className="sc-nav-count">{pendingAdmissions}</span>}
       </button>
       {children.length>0&&<button className="sc-nav-expand" type="button" aria-expanded={isOpen}
         aria-label={(isOpen?'Contraer ':'Expandir ')+item.title} onClick={()=>toggle(item.key)}>
         {isOpen?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
       </button>}
     </div>
     {children.length>0&&isOpen&&<div className="sc-nav-children">{children.map(child=>renderItem(child,depth+1))}</div>}
   </div>;
 }
 const matches=groups.map(g=>({...g,items:g.items.filter(item=>!query||(item.title+' '+(item.children||[]).map(c=>c.title).join(' ')).toLowerCase().includes(query.toLowerCase()))})).filter(g=>g.items.length);
 const label=page==='dashboard'?'Inicio':page==='profile'?'Mi perfil':page==='notifications'?'Notificaciones':groups.flatMap(g=>g.items.flatMap(i=>[i,...(i.children||[])])).find(i=>i.key===page)?.title||page;
 const tz=school.timezone||'America/Mexico_City';
 const formatted=new Intl.DateTimeFormat(locale==='es'?'es-MX':'en-US',{dateStyle:'medium',timeZone:tz}).format(clock);
 const time=new Intl.DateTimeFormat(locale==='es'?'es-MX':'en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:tz}).format(clock);
 function setLanguage(language:'es'|'en'){setLocale(language);localStorage.setItem('school-locale',language);}
 return <div className="app sc-shell">
   <aside className={'sidebar sc-sidebar'+(mobile?' open':'')}>
     <div className="brand sc-shell-brand">
       {school.logo_url?<img src={school.logo_url} alt="Logotipo de la escuela"/>:<div className="brand-icon"><BookOpen/></div>}
       <div><strong>{school.name}</strong><small>SCHOOL CONTROL</small></div>
       <button className="mobile close" aria-label="Cerrar menú" onClick={()=>onMobile(false)}><X/></button>
     </div>
     <div className="workspace sc-workspace"><span className="status-dot"/>{portalLabels[portal]}<span className="tag">Portal</span></div>
     <div className="sc-nav-search"><Search size={16}/><input aria-label="Buscar módulos" placeholder="Buscar módulo…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
     <nav className="sc-sidebar-nav" aria-label="Navegación principal">
       {matches.map(group=><section className="sc-nav-section" key={group.title}>
         <button type="button" className="sc-nav-section-title" aria-expanded={expanded.includes(group.title)||!!query} onClick={()=>toggle(group.title)}>
           <span>{group.title.toUpperCase()}</span>{expanded.includes(group.title)||query?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
         </button>
         {(expanded.includes(group.title)||query)&&group.items.map(item=>renderItem(item,0))}
       </section>)}
     </nav>
     <div className="sidebar-bottom sc-sidebar-foot"><div className="avatar">{user.name.slice(0,2).toUpperCase()}</div>
       <div><strong>{user.name}</strong><small>{portalLabels[portal]}</small></div>
     </div>
   </aside>
   <main className="sc-main">
     <header className="topbar sc-topbar">
       <button className="mobile" aria-label="Abrir menú" onClick={()=>onMobile(true)}><Menu/></button>
       <div className="sc-crumbs" aria-label="Ruta de navegación">
         <button type="button" onClick={()=>navigate('dashboard')}>{portalLabels[portal]}</button>
         <ChevronRight size={14}/><span aria-current="page">{label}</span>
       </div>
       <div className="sc-top-actions">
         <div className="sc-clock" title={'Zona horaria: '+tz}><CalendarClock size={17}/><time>{formatted} · {time}</time></div>
         <label className="sc-language"><Languages size={17}/><span className="sr-only">Idioma</span>
           <select value={locale} onChange={e=>setLanguage(e.target.value as 'es'|'en')} aria-label="Idioma"><option value="es">ES</option><option value="en">EN</option></select>
         </label>
         <div className="sc-flyout-holder">
           <button className="sc-icon-button" aria-label={'Notificaciones: '+unread+' sin leer'} aria-expanded={notificationsOpen}
             onClick={()=>{setNotificationsOpen(v=>!v);setAccountOpen(false);}}><Bell size={19}/>{unread>0&&<b className="sc-notification-count">{unread>99?'99+':unread}</b>}</button>
           {notificationsOpen&&<section className="sc-flyout" aria-label="Notificaciones">
             <div className="sc-flyout-title"><strong>Notificaciones</strong><button aria-label="Cerrar" onClick={()=>setNotificationsOpen(false)}><X size={16}/></button></div>
             {noticeError&&<p role="alert">{noticeError}</p>}
             {notificationItems.slice(0,6).map(item=><button className="sc-flyout-link" key={item.id} onClick={()=>void read(item)}>{!item.read_at&&<span className="sc-unread"/>}{item.title}</button>)}
             {!notificationItems.length&&<p>No hay notificaciones recientes.</p>}
             <button className="sc-flyout-link sc-all" onClick={()=>navigate('notifications')}>Ver todas las notificaciones</button>
           </section>}
         </div>
         <div className="sc-flyout-holder">
           <button className="sc-account-button" aria-label={'Cuenta de '+user.name} aria-expanded={accountOpen} onClick={()=>{setAccountOpen(v=>!v);setNotificationsOpen(false);}}>
             <span>{user.name.slice(0,2).toUpperCase()}</span><ChevronDown size={14}/>
           </button>
           {accountOpen&&<section className="sc-flyout" aria-label="Menú de cuenta">
             <div className="sc-account-details"><strong>{user.name}</strong><small>{user.email}</small></div>
             <button className="sc-flyout-link" onClick={()=>navigate('profile')}><UserRound size={16}/>Mi perfil y seguridad</button>
             <button className="sc-flyout-link" onClick={()=>navigate('notifications')}><Bell size={16}/>Centro de notificaciones</button>
             <button className="sc-flyout-link" onClick={()=>setLanguage(locale==='es'?'en':'es')}><Languages size={16}/>Idioma: {locale.toUpperCase()}</button>
             <button className="sc-flyout-link" onClick={()=>navigate('dashboard')}><HelpCircle size={16}/>Inicio y ayuda</button>
             <button className="sc-flyout-link sc-logout" onClick={()=>void onSignOut()}><LogOut size={16}/>Cerrar sesión</button>
           </section>}
         </div>
       </div>
     </header>
     {children}
   </main>
 </div>;
}
