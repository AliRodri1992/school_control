import {LocaleProvider} from '../shared/i18n/LocaleContext';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Bell,BookOpen,CalendarClock,ChevronDown,ChevronRight,HelpCircle,Languages,LogOut,Menu,PanelLeftClose,PanelLeftOpen,UserRound,X,LayoutDashboard,Users,GraduationCap,BookOpenCheck,CalendarDays,MessageSquare,BarChart3,Settings,School,FolderOpen,ClipboardList} from 'lucide-react';
import {api} from '../api';
import Combobox from '../shared/components/Combobox';
import type {Row} from '../modules';
import {currentPortal,makePortalUrl,portalLabels,visibleGroups,findNavPath,type NavItem} from './portalNavigation';

export function PortalChrome({user,school,page,mobile,onMobile,can,pendingAdmissions,onNavigate,onSignOut,children,childrenList=[],selectedChildId='',onSelectChild=()=>undefined}:{
 user:Row;school:Row;page:string;mobile:boolean;onMobile:(open:boolean)=>void;
 can:(permission:string)=>boolean;pendingAdmissions:number;onNavigate:(page:string)=>void;onSignOut:()=>Promise<void>;children:ReactNode;childrenList?:Row[];selectedChildId?:string;onSelectChild?:(id:string)=>void;
}) {
 const portal=currentPortal(user.role),groups=visibleGroups(portal,can);
 const [expanded,setExpanded]=useState<string[]>(['Inicio','Mi actividad','Mi escuela','Mi familia','Gestión escolar']);
 const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('school-sidebar-collapsed')==='true');
 const [compactGroup,setCompactGroup]=useState<string|null>(null);
 const [languageOpen,setLanguageOpen]=useState(false);
 const [compactItem,setCompactItem]=useState<string|null>(null);
 const languageRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{localStorage.setItem('school-sidebar-collapsed',String(collapsed));},[collapsed]);
 useEffect(()=>{function close(event:PointerEvent){if(!languageRef.current?.contains(event.target as Node))setLanguageOpen(false);}document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const compact=collapsed&&!mobile;
 const [clock,setClock]=useState(()=>new Date());
 const [locale,setLocale]=useState<string>(()=>localStorage.getItem('school-locale')||'es');
 const [availableLocales,setAvailableLocales]=useState<{id:number;code:string;name:string;native_name:string;status:string;text_direction:string}[]>([]);
 const [translations,setTranslations]=useState<Record<string,string>>({});
 const translate=(key:string,fallback:string)=>translations[key]||fallback;
 const sectionIcons:Record<string,ReactNode>={'Inicio':<LayoutDashboard size={21}/>, 'Gestión escolar':<Users size={21}/>, 'Gestión académica':<GraduationCap size={21}/>, 'Comunicación':<MessageSquare size={21}/>, 'Análisis y sistema':<BarChart3 size={21}/>, 'Mi actividad':<BookOpenCheck size={21}/>, 'Mi escuela':<School size={21}/>, 'Mi familia':<Users size={21}/>, 'Comunidad':<MessageSquare size={21}/>, 'Seguimiento':<ClipboardList size={21}/>};
 const moduleIcons:Record<string,ReactNode>={dashboard:<LayoutDashboard size={17}/>,students:<Users size={17}/>,academic_years:<CalendarDays size={17}/>,groups:<Users size={17}/>,courses:<BookOpenCheck size={17}/>,calendar_events:<CalendarDays size={17}/>,messages:<MessageSquare size={17}/>,reports:<BarChart3 size={17}/>,school:<School size={17}/>,documents:<FolderOpen size={17}/>,settings:<Settings size={17}/>};
 const [accountTarget,setAccountTarget]=useState<'sidebar'|'topbar'|null>(null);
 const sidebarAccountRef=useRef<HTMLDivElement>(null);
 const topbarAccountRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
   function closeOnEscape(event:KeyboardEvent){if(event.key==='Escape')setAccountTarget(null);}
   function closeOutside(event:PointerEvent){
     const element=event.target as Node;
     if(!sidebarAccountRef.current?.contains(element)&&!topbarAccountRef.current?.contains(element))setAccountTarget(null);
   }
   document.addEventListener('keydown',closeOnEscape);
   document.addEventListener('pointerdown',closeOutside);
   return()=>{document.removeEventListener('keydown',closeOnEscape);document.removeEventListener('pointerdown',closeOutside);};
 },[]);
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [unread,setUnread]=useState(0);
 const [notificationItems,setNotificationItems]=useState<Row[]>([]);
 const [noticeError,setNoticeError]=useState('');
 useEffect(()=>{const interval=window.setInterval(()=>setClock(new Date()),1000);return()=>window.clearInterval(interval)},[]);
 useEffect(()=>{let mounted=true;
   void api('languages').then(result=>{if(!mounted)return;
     setAvailableLocales(result.filter((row:{status:string})=>row.status==='active'));
     if(!result.some((row:{code:string;status:string})=>row.code===locale&&row.status==='active'))setLocale('es');
   }).catch(()=>undefined);return()=>{mounted=false;};
 },[]);
 useEffect(()=>{
   let mounted=true;
   void api('preferences').then(settings=>{
     if(!mounted)return;
     if(settings.locale)setLocale(settings.locale);
     if(settings.theme)document.documentElement.dataset.schoolTheme=settings.theme;
   }).catch(()=>undefined);
   return()=>{mounted=false;};
 },[user.id]);
 useEffect(()=>{let mounted=true;const selected=availableLocales.find(item=>item.code===locale);
   if(!selected){setTranslations({});return;}
   void api('languages/'+selected.id+'/bundle').then(bundle=>{if(mounted)setTranslations(bundle.translations||{});}).catch(()=>{if(mounted)setTranslations({});});
   return()=>{mounted=false;};
 },[locale,availableLocales.map(item=>item.code).join(',')]);
 useEffect(()=>{
   let active=true;
   async function update(){try{
     const result=await api('notifications');
     if(active){setUnread(result.unread_count||0);setNotificationItems(result.items||[]);setNoticeError('');}
   }catch(e){if(active)setNoticeError((e as Error).message);}}
   void update();const interval=window.setInterval(()=>void update(),60000);
   return()=>{active=false;window.clearInterval(interval);}
 },[user.id]);
 useEffect(()=>{const path=findNavPath(groups,page).slice(0,-1).map(item=>item.key);setExpanded(current=>{
   const next=[...new Set([...current,...path])];return next.length===current.length?current:next;
 });},[page]);
 function toggle(key:string){setExpanded(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key]);}
 function navigate(next:string){onNavigate(next);setAccountTarget(null);setNotificationsOpen(false);}
 async function read(item:Row){
   try{
     await api('notifications/'+item.id+'/read','POST');
     setUnread(v=>Math.max(0,v-(item.read_at?0:1)));
     setNotificationItems(v=>v.map(x=>x.id===item.id?{...x,read_at:new Date().toISOString()}:x));
     if(item.page)navigate(item.page);
   }catch(e){setNoticeError((e as Error).message);}
 }
 function renderItem(item:NavItem,depth:number,compact=false):ReactNode{
   const children=item.children||[],exact=(item.key==='students'&&page==='student_details')||item.key===page;
   const isAncestor=!exact&&findNavPath([{title:'',items:[item]}],page).length>0;
   const isOpen=expanded.includes(item.key);
   const showChildren=compact?compactItem===item.key:isOpen;
   return <div className="sc-nav-node" key={item.key+'-'+depth}>
     <div className={'sc-nav-item'+(exact?' is-active':'')+(isAncestor?' is-ancestor':'')} style={{paddingLeft:compact?0:4+Math.min(depth,3)*13}}>
       <button className="sc-nav-main" type="button" title={translate('nav.'+item.key,item.title)} aria-label={translate('nav.'+item.key,item.title)} aria-current={exact?'page':undefined} onClick={()=>{if(compact&&children.length){setCompactItem(v=>v===item.key?null:item.key);}else navigate(item.key);}}>
         <span className="sc-nav-mark">{moduleIcons[item.key]||(depth?<span className="sc-nav-dot"/>:<FolderOpen size={17}/>)}</span>{!compact&&<span>{translate('nav.'+item.key,item.title)}</span>}
         {item.key==='admissions'&&pendingAdmissions>0&&<span className="sc-nav-count">{pendingAdmissions}</span>}
       </button>
       {children.length>0&&!compact&&<button className="sc-nav-expand" type="button" aria-expanded={isOpen}
         aria-label={(isOpen?'Contraer ':'Expandir ')+item.title} onClick={()=>toggle(item.key)}>
         {isOpen?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
       </button>}
     </div>
     {children.length>0&&showChildren&&<div className="sc-nav-children">{children.map(child=>renderItem(child,depth+1,compact))}</div>}
   </div>;
 }
 const trail=page==='student_details'?[{key:'students',title:portal==='tutors'?'Mis hijos':'Alumnos'},{key:'student_details',title:'Expediente'}]:findNavPath(groups,page);
 const label=translate('nav.'+page,page==='dashboard'?'Inicio':page==='profile'?'Mi perfil':page==='help'?'Ayuda':page==='notifications'?'Notificaciones':trail.at(-1)?.title||page);
 const tz=school.timezone||'America/Mexico_City';
 const formatted=new Intl.DateTimeFormat(locale==='es'?'es-MX':locale,{dateStyle:'medium',timeZone:tz}).format(clock);
 const time=new Intl.DateTimeFormat(locale==='es'?'es-MX':locale,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:tz}).format(clock);
 useEffect(()=>{
  document.documentElement.lang=locale;
  document.documentElement.dir=availableLocales.find(item=>item.code===locale)?.text_direction==='rtl'?'rtl':'ltr';
 },[locale,availableLocales]);
 function setLanguage(language:string){setLanguageOpen(false);if(language===locale||!availableLocales.some(item=>item.code===language))return;setLocale(language);localStorage.setItem('school-locale',language);
   void api('preferences','PATCH',{locale:language}).catch(e=>setNoticeError((e as Error).message));}
 function accountMenu(){
   return <section className="sc-flyout sc-account-menu" aria-label="Menú de cuenta">
     <div className="sc-account-details"><strong>{user.name}</strong><small>{user.email}</small><small>{portalLabels[portal]}</small></div>
     <button className="sc-flyout-link" onClick={()=>navigate('profile')}><UserRound size={17}/>{translate("shell.profile","Mi perfil y seguridad")}</button>
     <button className="sc-flyout-link" onClick={()=>navigate('preferences')}><Languages size={17}/>Preferencias</button>
     <button className="sc-flyout-link" onClick={()=>navigate('notifications')}><Bell size={17}/>Centro de notificaciones</button>
     <button className="sc-flyout-link" onClick={()=>navigate('help')}><HelpCircle size={17}/>{translate("shell.help","Ayuda y guía de uso")}</button>
     <div className="sc-account-menu-divider"/>
     <button className="sc-flyout-link sc-logout" onClick={()=>{setAccountTarget(null);void onSignOut();}}>
       <LogOut size={17}/>{translate("shell.signout","Cerrar sesión")}
     </button>
   </section>;
 }
 return <div className={'app sc-shell'+(compact?' sc-shell-collapsed':'')}>
   <aside className={'sidebar sc-sidebar'+(mobile?' open':'')}>
     <div className="brand sc-shell-brand">
       {school.logo_url?<img src={school.logo_url} alt="Logotipo de la escuela"/>:<div className="brand-icon"><BookOpen/></div>}
       <div className="sc-sidebar-brand-text"><strong>{school.name}</strong><small>SCHOOL CONTROL</small></div>
       <button className="mobile close" aria-label="Cerrar menú" onClick={()=>onMobile(false)}><X/></button>
     </div>
     <div className="workspace sc-workspace"><span className="status-dot"/>{portalLabels[portal]}<span className="tag">{translate('shell.portal','Portal')}</span></div>
     <nav className="sc-sidebar-nav" aria-label="Navegación principal">
       {groups.map(group=><section className="sc-nav-section" key={group.title}>
         <button type="button" className="sc-nav-section-title" title={group.title} aria-label={group.title} aria-expanded={compact?compactGroup===group.title:expanded.includes(group.title)} onClick={()=>compact?(setCompactItem(null),setCompactGroup(v=>v===group.title?null:group.title)):toggle(group.title)}>
           <span className="sc-section-icon" aria-hidden="true">{sectionIcons[group.title]||<FolderOpen size={21}/>}</span><span className="sc-section-label">{group.title.toUpperCase()}</span>{expanded.includes(group.title)?<ChevronDown className="sc-section-chevron" size={14}/>:<ChevronRight className="sc-section-chevron" size={14}/>} 
         </button>
         {compact?<>{compactGroup===group.title&&<div className="sc-compact-flyout"><strong>{group.title}</strong>{group.items.map(item=>renderItem(item,0,true))}</div>}</>:expanded.includes(group.title)&&group.items.map(item=>renderItem(item,0))}
       </section>)}
     </nav>
     <div className="sidebar-bottom sc-sidebar-foot sc-flyout-holder" ref={sidebarAccountRef}>
       <button className="sc-sidebar-account" type="button" aria-label={'Opciones de cuenta de '+user.name}
         aria-expanded={accountTarget==='sidebar'} onClick={()=>{setAccountTarget(v=>v==='sidebar'?null:'sidebar');setNotificationsOpen(false);}}>
         <span className="sc-sidebar-avatar">{user.name.slice(0,2).toUpperCase()}</span>
         <span className="sc-sidebar-user"><strong>{user.name}</strong><small>{portalLabels[portal]}</small></span><ChevronDown className="sc-sidebar-user-chevron" size={16}/>
       </button>
       {accountTarget==='sidebar'&&accountMenu()}
     </div>
   </aside>
   <main className="sc-main">
     <header className="topbar sc-topbar">
       <button className="mobile" aria-label="Abrir menú" onClick={()=>onMobile(true)}><Menu/></button>
       <button type="button" className="sc-collapse-toggle" aria-label={collapsed?'Expandir barra lateral':'Colapsar barra lateral'} aria-expanded={!collapsed} onClick={()=>{setCollapsed(v=>!v);setCompactGroup(null);}}>{collapsed?<PanelLeftOpen size={21}/>:<PanelLeftClose size={21}/>}</button>
       <button type="button" className="sc-topbar-brand" onClick={()=>navigate('dashboard')} aria-label={'Ir al inicio de '+school.name}>
         {school.logo_url?<img src={school.logo_url} alt=""/>:<span className="sc-topbar-mark"><BookOpen size={22}/></span>}
         <span className="sc-topbar-brand-text"><strong>{school.name}</strong><small>{portalLabels[portal]}</small></span>
       </button>
       {portal==='tutors'&&childrenList.length>0&&<div className="sc-child-picker">
         <Combobox value={selectedChildId} label="Seleccionar hijo" placeholder="Todos mis hijos" onChange={onSelectChild}
           options={childrenList.map(child=>({value:String(child.id),label:child.full_name||child.first_name}))}/>
       </div>}
       <div className="sc-top-actions">
         <div className="sc-clock" title={'Zona horaria: '+tz}><CalendarClock size={17}/><time>{formatted} · {time}</time></div>
         <div className="sc-language sc-flyout-holder" ref={languageRef}>
           <button type="button" className="sc-icon-button sc-language-button" aria-label={translate('shell.locale','Idioma')} title={translate('shell.locale','Idioma')} aria-expanded={languageOpen} onClick={()=>setLanguageOpen(v=>!v)}><Languages size={19}/></button>
           {languageOpen&&<div className="sc-flyout sc-language-menu" role="group" aria-label="Idiomas disponibles">
             {(availableLocales.length?availableLocales:[{id:0,code:'es',name:'Español',native_name:'Español',status:'active',text_direction:'ltr'},{id:1,code:'en',name:'English',native_name:'English',status:'active',text_direction:'ltr'}]).map(language=><button type="button" className="sc-flyout-link" key={language.code} aria-pressed={locale===language.code} onClick={()=>setLanguage(language.code)}>{language.native_name} · {language.code.toUpperCase()}</button>)}
           </div>}
         </div>
         <div className="sc-flyout-holder">
           <button className="sc-icon-button" aria-label={'Notificaciones: '+unread+' sin leer'} aria-expanded={notificationsOpen}
             onClick={()=>{setNotificationsOpen(v=>!v);setAccountTarget(null);}}><Bell size={19}/>{unread>0&&<b className="sc-notification-count">{unread>99?'99+':unread}</b>}</button>
           {notificationsOpen&&<section className="sc-flyout" aria-label="Notificaciones">
             <div className="sc-flyout-title"><strong>{translate("shell.notifications","Notificaciones")}</strong><button aria-label="Cerrar" onClick={()=>setNotificationsOpen(false)}><X size={16}/></button></div>
             {noticeError&&<p role="alert">{noticeError}</p>}
             {notificationItems.slice(0,6).map(item=><button className="sc-flyout-link" key={item.id} onClick={()=>void read(item)}>{!item.read_at&&<span className="sc-unread"/>}{item.title}</button>)}
             {!notificationItems.length&&<p>{translate("shell.no_notifications","No hay notificaciones recientes.")}</p>}
             <button className="sc-flyout-link sc-all" onClick={()=>navigate('notifications')}>{translate("shell.view_all","Ver todas las notificaciones")}</button>
           </section>}
         </div>
         <div className="sc-flyout-holder" ref={topbarAccountRef}>
           <button className="sc-account-button" type="button" aria-label={'Opciones de cuenta de '+user.name}
             aria-expanded={accountTarget==='topbar'} onClick={()=>{setAccountTarget(v=>v==='topbar'?null:'topbar');setNotificationsOpen(false);}}>
             <span className="sc-account-identity"><strong>{user.name}</strong><small>{portalLabels[portal]}</small></span>
             <span className="sc-topbar-avatar">{user.name.slice(0,2).toUpperCase()}</span><ChevronDown size={16}/>
           </button>
           {accountTarget==='topbar'&&accountMenu()}
         </div>
       </div>
     </header>
     <div className="sc-breadcrumb-bar">
       <nav className="sc-crumbs" aria-label="Ruta de navegación">
         <button type="button" onClick={()=>navigate('dashboard')}>{portalLabels[portal]}</button>
         {trail.length?trail.map((item,index)=><span className="sc-crumb-step" key={item.key}>
   <ChevronRight size={14}/>
   {index===trail.length-1?<span aria-current="page">{translate('nav.'+item.key,item.title)}</span>:
     <button type="button" onClick={()=>navigate(item.key)}>{translate('nav.'+item.key,item.title)}</button>}
  </span>):<><ChevronRight size={14}/><span aria-current="page">{label}</span></>}
       </nav>
     </div>
     <LocaleProvider locale={locale} translations={translations}>{children}</LocaleProvider>
   </main>
 </div>;
}
