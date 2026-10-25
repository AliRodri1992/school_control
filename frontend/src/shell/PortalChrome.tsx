import {LocaleProvider} from '../shared/i18n/LocaleContext';
import {translateUiText} from '../shared/i18n/english';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Bell,BookOpen,CalendarClock,ChevronDown,ChevronRight,HelpCircle,Languages,LogOut,Menu,PanelLeftClose,PanelLeftOpen,UserRound,X,LayoutDashboard,Users,GraduationCap,BookOpenCheck,CalendarDays,MessageSquare,BarChart3,Settings,School,FolderOpen,ClipboardList,UserRoundCheck,ClipboardCheck,ClipboardPenLine,BookMarked,FileSpreadsheet,ShieldCheck,Mail,Globe2,Code2,FileText,ContactRound,ChartNoAxesCombined,NotebookTabs,IdCard} from 'lucide-react';
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
 const compactGroupTrigger=useRef<HTMLButtonElement|null>(null);
 const compactFlyoutRef=useRef<HTMLDivElement|null>(null);
 const mobileTrigger=useRef<HTMLButtonElement|null>(null);
 const mobileCloseTrigger=useRef<HTMLButtonElement|null>(null);
 const sidebarRef=useRef<HTMLElement|null>(null);
 const [compactPosition,setCompactPosition]=useState<{left:number;top:number}|null>(null);
 const languageRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{localStorage.setItem('school-sidebar-collapsed',String(collapsed));},[collapsed]);
 useEffect(()=>{const changed=()=>setLocale(localStorage.getItem('school-locale')||'es');window.addEventListener('school-locale-changed',changed);return()=>window.removeEventListener('school-locale-changed',changed);},[]);
 useEffect(()=>{function close(event:PointerEvent){if(!languageRef.current?.contains(event.target as Node))setLanguageOpen(false);}document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const compact=collapsed&&!mobile;
 const [clock,setClock]=useState(()=>new Date());
 const [locale,setLocale]=useState<string>(()=>localStorage.getItem('school-locale')||'es');
 const [availableLocales,setAvailableLocales]=useState<{id:number;code:string;name:string;native_name:string;status:string;text_direction:string}[]>([]);
 const [translations,setTranslations]=useState<Record<string,string>>({});
 const fallbackEn:Record<string,string>={'shell.portal':'Portal','shell.locale':'Language','shell.profile':'My profile and security','shell.help':'Help and user guide','shell.signout':'Sign out','shell.notifications':'Notifications','shell.no_notifications':'No recent notifications.','shell.view_all':'View all notifications','nav.dashboard':'Overview','nav.students':'Students and records','nav.student_contacts':'Family contacts','nav.documents':'Documents','nav.admissions':'Admissions','nav.enrollments':'Enrollment and history','nav.academic_years':'School years','nav.groups':'Groups','nav.courses':'Classes','nav.subjects':'Subjects','nav.schedule':'Schedules','nav.attendances':'Attendance','nav.grades':'Grades','nav.classroom':'Virtual classroom','nav.messages':'Messages','nav.announcements':'Announcements','nav.calendar_events':'Calendar','nav.reports':'Reports','nav.imports':'Imports','nav.users':'Users','nav.access_roles':'Roles and permissions','nav.school':'My school','nav.email_templates':'Email templates','nav.languages':'Languages and translations','nav.api_docs':'API documentation','group.Inicio':'Home','group.Gestión escolar':'School management','group.Gestión académica':'Academic management','group.Comunicación':'Communication','group.Análisis y sistema':'Analytics and system','group.Mi actividad':'My activity','group.Mi escuela':'My school','group.Mi familia':'My family','group.Comunidad':'Community','group.Seguimiento':'Progress'};
 const translate=(key:string,fallback:string)=>translations[key]||(locale==='en'?fallbackEn[key]:undefined)||translateUiText(locale,fallback);
 const sectionIcons:Record<string,ReactNode>={'Inicio':<LayoutDashboard size={21}/>, 'Gestión escolar':<Users size={21}/>, 'Gestión académica':<GraduationCap size={21}/>, 'Comunicación':<MessageSquare size={21}/>, 'Análisis y sistema':<BarChart3 size={21}/>, 'Mi actividad':<BookOpenCheck size={21}/>, 'Mi escuela':<School size={21}/>, 'Mi familia':<Users size={21}/>, 'Comunidad':<MessageSquare size={21}/>, 'Seguimiento':<ClipboardList size={21}/>};
 const moduleIcons:Record<string,ReactNode>={
  dashboard:<LayoutDashboard size={18}/>,students:<GraduationCap size={18}/>,
  student_contacts:<ContactRound size={18}/>,documents:<FolderOpen size={18}/>,
  admissions:<ClipboardCheck size={18}/>,enrollments:<IdCard size={18}/>,
  academic_years:<CalendarDays size={18}/>,groups:<Users size={18}/>,
  courses:<BookOpenCheck size={18}/>,subjects:<BookMarked size={18}/>,
  schedule:<CalendarClock size={18}/>,attendances:<ClipboardPenLine size={18}/>,
  grades:<GraduationCap size={18}/>,classroom:<NotebookTabs size={18}/>,
  messages:<MessageSquare size={18}/>,announcements:<FileText size={18}/>,
  calendar_events:<CalendarDays size={18}/>,reports:<ChartNoAxesCombined size={18}/>,
  imports:<FileSpreadsheet size={18}/>,users:<UserRoundCheck size={18}/>,
  access_roles:<ShieldCheck size={18}/>,school:<School size={18}/>,
  email_templates:<Mail size={18}/>,languages:<Globe2 size={18}/>,
  api_docs:<Code2 size={18}/>,settings:<Settings size={18}/>
 };
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
     if(settings.locale){setLocale(settings.locale);localStorage.setItem('school-locale',settings.locale);window.dispatchEvent(new Event('school-locale-changed'));}
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
 useEffect(()=>{
   const selectedPage=page==='student_details'?'students':page;
   const group=groups.find(item=>findNavPath([item],selectedPage).length>0);
   const path=findNavPath(groups,selectedPage).slice(0,-1).map(item=>item.key);
   setExpanded(current=>{
     const next=[...new Set([...current,...(group?[group.title]:[]),...path])];
     return next.length===current.length?current:next;
   });
 },[page,portal]);
 function toggle(key:string){setExpanded(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key]);}
 function navigate(next:string){
   onNavigate(next);
   setCompactGroup(null);
   setAccountTarget(null);
   setNotificationsOpen(false);
 }
 function positionCompactMenu(){
   const trigger=compactGroupTrigger.current;
   if(!trigger)return;
   const rect=trigger.getBoundingClientRect();
   const width=270;
   const height=compactFlyoutRef.current?.offsetHeight||360;
   const left=Math.max(12,Math.min(rect.right+10,window.innerWidth-width-12));
   const top=Math.max(12,Math.min(rect.top-8,window.innerHeight-height-12));
   setCompactPosition({left,top});
 }
 function toggleCompactGroup(title:string,element:HTMLButtonElement){
   if(compactGroup===title){setCompactGroup(null);return;}
   compactGroupTrigger.current=element;
   const rect=element.getBoundingClientRect();
   setCompactPosition({left:Math.max(12,Math.min(rect.right+10,window.innerWidth-282)),top:Math.max(12,Math.min(rect.top-8,window.innerHeight-372))});
   setCompactGroup(title);
 }
 useEffect(()=>{
   if(!compactGroup)return;
   positionCompactMenu();
   function outside(event:PointerEvent){
     const node=event.target as Node;
     if(!compactFlyoutRef.current?.contains(node)&&!compactGroupTrigger.current?.contains(node))setCompactGroup(null);
   }
   window.addEventListener('resize',positionCompactMenu);
   window.addEventListener('scroll',positionCompactMenu,true);
   document.addEventListener('pointerdown',outside);
   return()=>{
     window.removeEventListener('resize',positionCompactMenu);
     window.removeEventListener('scroll',positionCompactMenu,true);
     document.removeEventListener('pointerdown',outside);
   };
 },[compactGroup]);
 useEffect(()=>{
   if(!mobile)return;
   const prior=document.body.style.overflow;
   document.body.style.overflow='hidden';
   mobileCloseTrigger.current?.focus();
   return()=>{document.body.style.overflow=prior;};
 },[mobile]);
 useEffect(()=>{
   function onKeydown(event:KeyboardEvent){
     if(event.key==='Tab'&&mobile){
       const controls=[...sidebarRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]];
       if(!controls.length)return;
       const first=controls[0],last=controls[controls.length-1];
       if(event.shiftKey&&(document.activeElement===first||!sidebarRef.current?.contains(document.activeElement))){
         event.preventDefault();last.focus();
       }else if(!event.shiftKey&&(document.activeElement===last||!sidebarRef.current?.contains(document.activeElement))){
         event.preventDefault();first.focus();
       }
       return;
     }
     if(event.key!=='Escape')return;
     if(mobile){onMobile(false);mobileTrigger.current?.focus();}
     if(compactGroup){setCompactGroup(null);compactGroupTrigger.current?.focus();}
     setAccountTarget(null);
     setNotificationsOpen(false);
     setLanguageOpen(false);
   }
   document.addEventListener('keydown',onKeydown);
   return()=>document.removeEventListener('keydown',onKeydown);
 },[mobile,onMobile,compactGroup]);
 async function read(item:Row){
   try{
     await api('notifications/'+item.id+'/read','POST');
     setUnread(v=>Math.max(0,v-(item.read_at?0:1)));
     setNotificationItems(v=>v.map(x=>x.id===item.id?{...x,read_at:new Date().toISOString()}:x));
     if(item.page)navigate(item.page);
   }catch(e){setNoticeError((e as Error).message);}
 }
 function renderItem(item:NavItem,depth:number):ReactNode{
   const children=item.children||[];
   const exact=(item.key==='students'&&page==='student_details')||item.key===page;
   const isAncestor=!exact&&findNavPath([{title:'',items:[item]}],page).length>0;
   const isOpen=expanded.includes(item.key);
   const translated=translate('nav.'+item.key,item.title);
   return <div className="sc-nav-node" key={item.key+'-'+depth}>
     <div className={'sc-nav-item'+(exact?' is-active':'')+(isAncestor?' is-ancestor':'')}
       style={{paddingLeft:Math.min(depth,3)*8}}>
       <button className="sc-nav-main" type="button" title={translated} aria-label={translated}
         aria-current={exact?'page':undefined} onClick={()=>navigate(item.key)}>
         <span className="sc-nav-mark" aria-hidden="true">{moduleIcons[item.key]||(depth?<span className="sc-nav-dot"/>:<FolderOpen size={18}/>)}</span>
         <span className="sc-nav-label">{translated}</span>
         {item.key==='admissions'&&pendingAdmissions>0&&<span className="sc-nav-count">{pendingAdmissions}</span>}
       </button>
       {children.length>0&&<button className="sc-nav-expand" type="button" aria-expanded={isOpen}
         aria-label={(isOpen?(locale==='en'?'Collapse ':'Contraer '):(locale==='en'?'Expand ':'Expandir '))+translated}
         onClick={()=>toggle(item.key)}>
         {isOpen?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
       </button>}
     </div>
     {children.length>0&&isOpen&&<div className="sc-nav-children">{children.map(child=>renderItem(child,depth+1))}</div>}
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
 function setLanguage(language:string){setLanguageOpen(false);if(language===locale||!availableLocales.some(item=>item.code===language))return;setLocale(language);localStorage.setItem('school-locale',language);window.dispatchEvent(new Event('school-locale-changed'));
   void api('preferences','PATCH',{locale:language}).catch(e=>setNoticeError((e as Error).message));}
 function accountMenu(){
   return <section className="sc-flyout sc-account-menu" aria-label="Menú de cuenta">
     <div className="sc-account-details"><strong>{user.name}</strong><small>{user.email}</small><small>{translateUiText(locale,portalLabels[portal])}</small></div>
     <button className="sc-flyout-link" onClick={()=>navigate('profile')}><UserRound size={17}/>{translate("shell.profile","Mi perfil y seguridad")}</button>
     <button className="sc-flyout-link" onClick={()=>navigate('preferences')}><Languages size={17}/>{translate("shell.preferences","Preferencias")}</button>
     <button className="sc-flyout-link" onClick={()=>navigate('notifications')}><Bell size={17}/>{translate("shell.notification_center","Centro de notificaciones")}</button>
     <button className="sc-flyout-link" onClick={()=>navigate('help')}><HelpCircle size={17}/>{translate("shell.help","Ayuda y guía de uso")}</button>
     <div className="sc-account-menu-divider"/>
     <button className="sc-flyout-link sc-logout" onClick={()=>{setAccountTarget(null);void onSignOut();}}>
       <LogOut size={17}/>{translate("shell.signout","Cerrar sesión")}
     </button>
   </section>;
 }
 return <div className={'app sc-shell'+(compact?' sc-shell-collapsed':'')+(mobile?' sc-shell-mobile-open':'')}>
   {mobile&&<button type="button" className="sc-sidebar-backdrop" aria-label={translateUiText(locale,'Cerrar menú lateral')} onClick={()=>{onMobile(false);mobileTrigger.current?.focus();}}/>}

   <aside id="school-sidebar" ref={sidebarRef} className={'sidebar sc-sidebar'+(mobile?' open':'')} aria-label={translateUiText(locale,'Barra lateral principal')}>
     <div className="brand sc-shell-brand">
       {school.logo_url?<img src={school.logo_url} alt="Logotipo de la escuela"/>:<div className="brand-icon"><BookOpen/></div>}
       <div className="sc-sidebar-brand-text"><strong>{school.name}</strong><small>SCHOOL CONTROL</small></div>
       <button ref={mobileCloseTrigger} className="mobile close" type="button" aria-label={translateUiText(locale,'Cerrar menú')} onClick={()=>{onMobile(false);mobileTrigger.current?.focus();}}><X/></button>
     </div>
     <div className="workspace sc-workspace"><span className="status-dot"/>{translateUiText(locale,portalLabels[portal])}<span className="tag">{translate('shell.portal','Portal')}</span></div>
     <nav className="sc-sidebar-nav" aria-label={translateUiText(locale,'Navegación principal')}>
       {groups.map(group=><section className={'sc-nav-section'+(findNavPath([group],page==='student_details'?'students':page).length?' has-active-item':'')} key={group.title}>
         <button type="button" className="sc-nav-section-title" title={translate("group."+group.title,group.title)} aria-label={translate("group."+group.title,group.title)} aria-expanded={compact?compactGroup===group.title:expanded.includes(group.title)}
           onClick={event=>compact?toggleCompactGroup(group.title,event.currentTarget):toggle(group.title)}>
           <span className="sc-section-icon" aria-hidden="true">{sectionIcons[group.title]||<FolderOpen size={21}/>}</span><span className="sc-section-label">{translate("group."+group.title,group.title).toUpperCase()}</span>{(compact?compactGroup===group.title:expanded.includes(group.title))?<ChevronDown className="sc-section-chevron" size={14}/>:<ChevronRight className="sc-section-chevron" size={14}/>} 
         </button>
         {!compact&&expanded.includes(group.title)&&group.items.map(item=>renderItem(item,0))}
       </section>)}
     </nav>
     <div className="sidebar-bottom sc-sidebar-foot sc-flyout-holder" ref={sidebarAccountRef}>
       <button className="sc-sidebar-account" type="button" aria-label={'Opciones de cuenta de '+user.name}
         aria-expanded={accountTarget==='sidebar'} onClick={()=>{setAccountTarget(v=>v==='sidebar'?null:'sidebar');setNotificationsOpen(false);}}>
         <span className="sc-sidebar-avatar">{user.name.slice(0,2).toUpperCase()}</span>
         <span className="sc-sidebar-user"><strong>{user.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span><ChevronDown className="sc-sidebar-user-chevron" size={16}/>
       </button>
       {accountTarget==='sidebar'&&accountMenu()}
     </div>
   </aside>
   {compact&&compactGroup&&createPortal(
     <div className="sc-compact-flyout" ref={compactFlyoutRef} role="region"
       aria-label={translate('group.'+compactGroup,compactGroup)}
       style={compactPosition?{top:compactPosition.top,left:compactPosition.left}:undefined}>
       <strong>{translate('group.'+compactGroup,compactGroup)}</strong>
       {groups.find(group=>group.title===compactGroup)?.items.map(item=>renderItem(item,0))}
     </div>,document.body)}
   <main className="sc-main">
     <header className="topbar sc-topbar">
       <button ref={mobileTrigger} type="button" className="mobile" aria-label={locale==='en'?'Open menu':'Abrir menú'} aria-controls="school-sidebar" aria-expanded={mobile} onClick={()=>onMobile(true)}><Menu/></button>
       <button type="button" className="sc-collapse-toggle" aria-label={collapsed?'Expandir barra lateral':'Colapsar barra lateral'} aria-expanded={!collapsed} onClick={()=>{setCollapsed(v=>!v);setCompactGroup(null);}}>{collapsed?<PanelLeftOpen size={21}/>:<PanelLeftClose size={21}/>}</button>
       <button type="button" className="sc-topbar-brand" onClick={()=>navigate('dashboard')} aria-label={'Ir al inicio de '+school.name}>
         {school.logo_url?<img src={school.logo_url} alt=""/>:<span className="sc-topbar-mark"><BookOpen size={22}/></span>}
         <span className="sc-topbar-brand-text"><strong>{school.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span>
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
             <span className="sc-account-identity"><strong>{user.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span>
             <span className="sc-topbar-avatar">{user.name.slice(0,2).toUpperCase()}</span><ChevronDown size={16}/>
           </button>
           {accountTarget==='topbar'&&accountMenu()}
         </div>
       </div>
     </header>
     <div className="sc-breadcrumb-bar">
       <nav className="sc-crumbs" aria-label="Ruta de navegación">
         <button type="button" onClick={()=>navigate('dashboard')}>{translateUiText(locale,portalLabels[portal])}</button>
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
