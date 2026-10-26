import {LocaleProvider} from '../shared/i18n/LocaleContext';
import TopbarCommands from './TopbarCommands';
import {useTopbarMenuPosition} from './useTopbarMenuPosition';
import {sidebarSections,sidebarExpandedSections,sidebarExpandedStorageKey} from './sidebarPresentation';
import {revealActiveSidebarItem,useSidebarScroll} from './useSidebarScroll';
import {SidebarBrand} from './SidebarBrand';
import LanguageMenu from './LanguageMenu';
import NotificationPopover,{type NotificationPreview} from './NotificationPopover';
import {userInitials} from './userInitials';
import {SidebarAccountMenu} from './SidebarAccountMenu';
import {TopbarAccountAvatar} from './TopbarAccountAvatar';
import {placeSidebarAccountMenu,placeTopbarAccountMenu,type SidebarAccountPosition} from './sidebarAccountPlacement';
import {PortalFooter} from './PortalFooter';
import {translateUiText} from '../shared/i18n/english';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Bell,BookOpen,House,MoreHorizontal,CalendarClock,ChevronDown,ChevronRight,HelpCircle,Languages,LogOut,Menu,PanelLeftClose,PanelLeftOpen,UserRound,X,LayoutDashboard,Users,GraduationCap,BookOpenCheck,CalendarDays,MessageSquare,BarChart3,Settings,School,FolderOpen,ClipboardList,UserRoundCheck,ClipboardCheck,ClipboardPenLine,BookMarked,FileSpreadsheet,ShieldCheck,Mail,Globe2,Code2,FileText,ContactRound,ChartNoAxesCombined,NotebookTabs,IdCard} from 'lucide-react';
import {api} from '../api';
import Combobox from '../shared/components/Combobox';
import type {Row} from '../modules';
import {currentPortal,makePortalUrl,portalLabels,visibleGroups,findNavPath,breadcrumbPath,breadcrumbDestination,breadcrumbTranslationKey,shouldCondenseBreadcrumbs,resolveNavigationLabel,type NavItem} from './portalNavigation';

export function PortalChrome({user,school,page,mobile,onMobile,can,pendingAdmissions,onNavigate,onSearchNavigate,onSearchStudent,searchCollections={},onSignOut,children,childrenList=[],selectedChildId='',onSelectChild=()=>undefined}:{
 user:Row;school:Row;page:string;mobile:boolean;onMobile:(open:boolean)=>void;
 can:(permission:string)=>boolean;pendingAdmissions:number;onNavigate:(page:string)=>void;onSignOut:()=>Promise<void>;
 onSearchNavigate?:(page:string,query?:string)=>void;onSearchStudent?:(student:Row)=>void;searchCollections?:Record<string,Row[]>;
 children:ReactNode;childrenList?:Row[];selectedChildId?:string;onSelectChild?:(id:string)=>void;
}) {
 const portal=currentPortal(user.role),groups=visibleGroups(portal,can);
 const sections=sidebarSections(portal,groups);
 const [expanded,setExpanded]=useState<string[]>(()=>sidebarExpandedSections(portal,sections,localStorage.getItem(sidebarExpandedStorageKey(portal))));
 const [collapsed,setCollapsed]=useState(()=>localStorage.getItem('school-sidebar-collapsed')==='true');
 const [compactGroup,setCompactGroup]=useState<string|null>(null);
 const [languageOpen,setLanguageOpen]=useState(false);
 const compactGroupTrigger=useRef<HTMLButtonElement|null>(null);
 const compactFlyoutRef=useRef<HTMLDivElement|null>(null);
 const mobileTrigger=useRef<HTMLButtonElement|null>(null);
 const mobileCloseTrigger=useRef<HTMLButtonElement|null>(null);
 const sidebarRef=useRef<HTMLElement|null>(null);
 const sidebarNavRef=useRef<HTMLElement|null>(null);
 useSidebarScroll(sidebarNavRef);
 // Keep the selected destination visible in a scrollbar-free navigation rail.
 useEffect(()=>{
  revealActiveSidebarItem(sidebarNavRef.current);
 },[page,collapsed,mobile,expanded.join('|')]);
 const [compactPosition,setCompactPosition]=useState<{left:number;top:number}|null>(null);
 const languageRef=useRef<HTMLDivElement>(null);
 const notificationRef=useRef<HTMLDivElement>(null);
 const [crumbMenuOpen,setCrumbMenuOpen]=useState(false);
 const crumbMenuTrigger=useRef<HTMLButtonElement>(null);
 const crumbMenuRef=useRef<HTMLDivElement>(null);
 const breadcrumbNavRef=useRef<HTMLElement>(null);
 const [breadcrumbCondensed,setBreadcrumbCondensed]=useState(false);
 useEffect(()=>{localStorage.setItem('school-sidebar-collapsed',String(collapsed));},[collapsed]);
 useEffect(()=>{setExpanded(sidebarExpandedSections(portal,sections,localStorage.getItem(sidebarExpandedStorageKey(portal))));},[portal]);
 useEffect(()=>{localStorage.setItem(sidebarExpandedStorageKey(portal),JSON.stringify(expanded));},[expanded,portal]);
 useEffect(()=>{const changed=()=>setLocale(localStorage.getItem('school-locale')||'es');window.addEventListener('school-locale-changed',changed);return()=>window.removeEventListener('school-locale-changed',changed);},[]);
 useEffect(()=>{function close(event:PointerEvent){const node=event.target as Node;if(!languageRef.current?.contains(node))setLanguageOpen(false);if(!notificationRef.current?.contains(node))setNotificationsOpen(false);}document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const compact=collapsed&&!mobile;
 const [locale,setLocale]=useState<string>(()=>localStorage.getItem('school-locale')||'es');
 const [availableLocales,setAvailableLocales]=useState<{id:number;code:string;name:string;native_name:string;status:string;text_direction:string}[]>([]);
 const [translations,setTranslations]=useState<Record<string,string>>({});
 const fallbackEn:Record<string,string>={'shell.portal':'Portal','shell.locale':'Language','shell.profile':'My profile and security','shell.help':'Help and user guide','shell.signout':'Sign out','shell.notifications':'Notifications','shell.no_notifications':'No recent notifications.','shell.view_all':'View all notifications','nav.dashboard':'Dashboard','nav.students':'Students and records','nav.student_records':'Records','nav.student_contacts':'Family contacts','nav.documents':'Documents','nav.admissions':'Admissions','nav.enrollments':'Enrollment and history','nav.academic_years':'School years','nav.groups':'Groups','nav.courses':'Classes','nav.subjects':'Subjects','nav.schedule':'Schedules','nav.attendances':'Attendance','nav.grades':'Grades','nav.classroom':'Virtual classroom','nav.messages':'Messages','nav.announcements':'Announcements','nav.calendar_events':'Calendar','nav.reports':'Reports','nav.imports':'Imports','nav.users':'Users','nav.access_roles':'Roles and permissions','nav.school':'My school','nav.email_templates':'Email templates','nav.languages':'Languages and translations','nav.api_docs':'API documentation','group.Inicio':'Home','group.Gestión escolar':'School management','group.Gestión académica':'Academic management','group.Comunicación':'Communication','group.Análisis y sistema':'Analytics and system','group.Mi actividad':'My activity','group.Mi escuela':'My school','group.Mi familia':'My family','group.Comunidad':'Community','group.Seguimiento':'Progress'};
 const translate=(key:string,fallback:string)=>translations[key]||(locale==='en'?fallbackEn[key]:undefined)||translateUiText(locale,fallback);
 const sectionIcons:Record<string,ReactNode>={'Inicio':<House size={21}/>,'Alumnos':<Users size={21}/>,'Matrícula':<GraduationCap size={21}/>,'Académico':<BookOpen size={21}/>,'Asistencia':<ClipboardCheck size={21}/>,'Documentos':<FolderOpen size={21}/>,'Reportes':<BarChart3 size={21}/>,'Configuración':<Settings size={21}/>, 'Gestión escolar':<Users size={21}/>, 'Gestión académica':<GraduationCap size={21}/>, 'Comunicación':<MessageSquare size={21}/>, 'Análisis y sistema':<BarChart3 size={21}/>, 'Mi actividad':<BookOpenCheck size={21}/>, 'Mi escuela':<School size={21}/>, 'Mi familia':<Users size={21}/>, 'Comunidad':<MessageSquare size={21}/>, 'Seguimiento':<ClipboardList size={21}/>};
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
 const sidebarMenuRef=useRef<HTMLElement>(null);
 const [sidebarMenuPosition,setSidebarMenuPosition]=useState<SidebarAccountPosition|null>(null);
 const topbarAccountRef=useRef<HTMLDivElement>(null);
 const topbarAccountMenuRef=useRef<HTMLElement>(null);
 const [topbarAccountPosition,setTopbarAccountPosition]=useState<SidebarAccountPosition|null>(null);
 const focusTopbarAccountMenu=useRef(false);
 useLayoutEffect(()=>{
  if(accountTarget!=='sidebar'){setSidebarMenuPosition(null);return;}
  const update=()=>{
   const trigger=sidebarAccountRef.current?.querySelector<HTMLButtonElement>('.sc-sidebar-account');
   const panel=sidebarMenuRef.current;
   if(!trigger||!panel)return;
   setSidebarMenuPosition(placeSidebarAccountMenu(
    trigger.getBoundingClientRect(),panel.getBoundingClientRect().height,
    {width:window.innerWidth,height:window.innerHeight},collapsed&&!mobile
   ));
  };
  update();
  window.addEventListener('resize',update);
  window.addEventListener('scroll',update,true);
  return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
 },[accountTarget,collapsed,mobile,locale,translations]);
 useLayoutEffect(()=>{
  if(accountTarget!=='topbar'){setTopbarAccountPosition(null);return;}
  const position=()=>{
   const trigger=topbarAccountRef.current?.querySelector<HTMLButtonElement>('.sc-account-button');
   const panel=topbarAccountMenuRef.current;
   if(!trigger||!panel)return;
   setTopbarAccountPosition(placeTopbarAccountMenu(
    trigger.getBoundingClientRect(),panel.getBoundingClientRect().height,
    {width:window.innerWidth,height:window.innerHeight}
   ));
  };
  position();
  window.addEventListener('resize',position);
  window.addEventListener('scroll',position,true);
  return()=>{window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);};
 },[accountTarget,locale,translations]);
 useEffect(()=>{
  if(accountTarget==='topbar'&&focusTopbarAccountMenu.current){
   topbarAccountMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
   focusTopbarAccountMenu.current=false;
  }
 },[accountTarget]);
 useEffect(()=>{
   function closeOnEscape(event:KeyboardEvent){if(event.key==='Escape')setAccountTarget(null);}
   function closeOutside(event:PointerEvent){
     const element=event.target as Node;
     if(!sidebarAccountRef.current?.contains(element)&&!sidebarMenuRef.current?.contains(element)&&!topbarAccountRef.current?.contains(element)&&!topbarAccountMenuRef.current?.contains(element))setAccountTarget(null);
   }
   document.addEventListener('keydown',closeOnEscape);
   document.addEventListener('pointerdown',closeOutside);
   return()=>{document.removeEventListener('keydown',closeOnEscape);document.removeEventListener('pointerdown',closeOutside);};
 },[]);
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [unread,setUnread]=useState(0);
 const [notificationItems,setNotificationItems]=useState<NotificationPreview[]>([]);
 const [noticeError,setNoticeError]=useState('');
 const [notificationLoading,setNotificationLoading]=useState(true);
 const [notificationBusy,setNotificationBusy]=useState(false);
 useTopbarMenuPosition(languageOpen,languageRef,210);
 useTopbarMenuPosition(notificationsOpen,notificationRef,408);
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
   }catch(e){if(active)setNoticeError((e as Error).message);}
   finally{if(active)setNotificationLoading(false);}}
   setNotificationLoading(true);void update();const interval=window.setInterval(()=>void update(),60000);
   return()=>{active=false;window.clearInterval(interval);}
 },[user.id]);
 // Refresh on opening as well as on the background interval, so the flyout isn't stale.
 useEffect(()=>{
   if(!notificationsOpen)return;
   let active=true;
   void api('notifications').then(result=>{
     if(!active)return;
     setUnread(result.unread_count||0);
     setNotificationItems(result.items||[]);
     setNoticeError('');
   }).catch(error=>{if(active)setNoticeError((error as Error).message);})
     .finally(()=>{if(active)setNotificationLoading(false);});
   return()=>{active=false;};
 },[notificationsOpen,user.id]);
 useEffect(()=>{
   const selectedPage=page==='student_details'?'students':page;
   const group=sections.find(section=>section.items.some(item=>item.key===selectedPage||findNavPath([{title:'',items:[item]}],selectedPage).length>0));
   const path=findNavPath(groups,selectedPage).slice(0,-1).map(item=>item.key);
   setExpanded(current=>{
     const next=(group&&!group.directPage)||path.length?[...new Set([...(group?[group.id]:[]),...path])]:current;
     return next.length===current.length?current:next;
   });
 },[page,portal]);
 function toggle(key:string){setExpanded(v=>v.includes(key)?v.filter(x=>x!==key):[key]);}
 function navigate(next:string){
   onNavigate(next);
   setCompactGroup(null);
   setAccountTarget(null);
   setNotificationsOpen(false);
   setLanguageOpen(false);
   setCrumbMenuOpen(false);
   if(mobile){onMobile(false);mobileTrigger.current?.focus();}
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
       const controls=[
        ...sidebarRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')||[],
        ...(accountTarget==='sidebar'?[...sidebarMenuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]]:[])
       ];
       if(!controls.length)return;
       const first=controls[0],last=controls[controls.length-1];
       const inside=sidebarRef.current?.contains(document.activeElement)||sidebarMenuRef.current?.contains(document.activeElement);
       if(event.shiftKey&&(document.activeElement===first||!inside)){
         event.preventDefault();last.focus();
       }else if(!event.shiftKey&&(document.activeElement===last||!inside)){
         event.preventDefault();first.focus();
       }
       return;
     }
     if(event.key!=='Escape')return;
     if(crumbMenuOpen)crumbMenuTrigger.current?.focus();
     setCrumbMenuOpen(false);
     if(languageOpen)languageRef.current?.querySelector('button')?.focus();
     else if(notificationsOpen)notificationRef.current?.querySelector('button')?.focus();
     else if(accountTarget==='topbar')topbarAccountRef.current?.querySelector('button')?.focus();
     else if(accountTarget==='sidebar')sidebarAccountRef.current?.querySelector('button')?.focus();
     if(mobile){onMobile(false);mobileTrigger.current?.focus();}
     if(compactGroup){setCompactGroup(null);compactGroupTrigger.current?.focus();}
     setAccountTarget(null);
     setNotificationsOpen(false);
     setLanguageOpen(false);
   }
   document.addEventListener('keydown',onKeydown);
   return()=>document.removeEventListener('keydown',onKeydown);
 },[mobile,onMobile,compactGroup,languageOpen,notificationsOpen,accountTarget,crumbMenuOpen]);
 async function read(item:NotificationPreview){
   if(notificationBusy)return;
   setNotificationBusy(true);
   try{
     await api('notifications/'+item.id+'/read','POST');
     setUnread(v=>Math.max(0,v-(item.read_at?0:1)));
     setNotificationItems(v=>v.map(x=>x.id===item.id?{...x,read_at:new Date().toISOString()}:x));
     setNoticeError('');
     if(item.page)navigate(item.page);
   }catch(e){setNoticeError((e as Error).message);}
   finally{setNotificationBusy(false);}
 }
 async function readAllNotifications(){
   if(notificationBusy)return;
   setNotificationBusy(true);
   try{
     await api('notifications/read_all','POST');
     const now=new Date().toISOString();
     setNotificationItems(v=>v.map(x=>({...x,read_at:x.read_at||now})));
     setUnread(0);
     setNoticeError('');
   }catch(e){setNoticeError((e as Error).message);}
   finally{setNotificationBusy(false);}
 }
 function renderItem(item:NavItem,depth:number):ReactNode{
   const children=item.children||[];
   const exact=(item.key==='students'&&page==='student_details')||item.key===page;
   const isAncestor=!exact&&findNavPath([{title:'',items:[item]}],page).length>0;
   const isOpen=expanded.includes(item.key);
   const translated=resolveNavigationLabel(portal,item.key,translate('nav.'+item.key,item.title));
   return <div className="sc-nav-node" key={item.key+'-'+depth}>
     <div className={'sc-nav-item'+(exact?' is-active':'')+(isAncestor?' is-ancestor':'')}
       style={{paddingLeft:Math.min(depth,3)*8}}>
       <button className="sc-nav-main" type="button" title={translated} aria-label={translated}
         aria-current={exact?'page':undefined} onClick={()=>navigate(item.key)}>
         <span className="sc-nav-mark" aria-hidden="true">{moduleIcons[item.key]||(depth?<span className="sc-nav-dot"/>:<FolderOpen size={18}/>)}</span>
         <span className="sc-nav-label">{translated}</span>
         {item.key==='admissions'&&pendingAdmissions>0&&<span className="sc-nav-count">{pendingAdmissions}</span>}
       </button>
       {children.length>0&&<button className="sc-nav-expand" type="button" title={(isOpen?(locale==='en'?'Collapse ':'Contraer '):(locale==='en'?'Expand ':'Expandir '))+translated} aria-expanded={isOpen}
         aria-label={(isOpen?(locale==='en'?'Collapse ':'Contraer '):(locale==='en'?'Expand ':'Expandir '))+translated}
         onClick={()=>toggle(item.key)}>
         {isOpen?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
       </button>}
     </div>
     {children.length>0&&isOpen&&<div className="sc-nav-children">{children.map(child=>renderItem(child,depth+1))}</div>}
   </div>;
 }
 const trail=breadcrumbPath(groups,page,portal);
 const crumbLabel=(key:string,title:string)=>resolveNavigationLabel(portal,key,translate(breadcrumbTranslationKey(key),title));
 // Measure the complete trail whenever the content or available space changes.
 // Collapsed ancestors remain accessible in the existing overflow menu.
 const crumbKey=trail.map(item=>item.key).join('|');
 const displayedPage=page;
 // Use the current route as the UI source of truth on every navigation change.
 useLayoutEffect(()=>{
  const nav=breadcrumbNavRef.current;
  if(!nav)return;
  const measure=()=>{
   // Measure expanded content; never measure a hidden/condensed trail as the baseline.
   nav.classList.remove('sc-crumbs-condensed');
   const condensed=shouldCondenseBreadcrumbs(nav.scrollWidth,nav.clientWidth);
   nav.classList.toggle('sc-crumbs-condensed',condensed);
   setBreadcrumbCondensed(previous=>previous===condensed?previous:condensed);
  };
  let active=true;
  measure();
  if(document.fonts?.ready)void document.fonts.ready.then(()=>{if(active)measure();});
  window.addEventListener('resize',measure);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
  if(observer&&nav.parentElement)observer.observe(nav.parentElement);
  return()=>{
   active=false;
   observer?.disconnect();
   window.removeEventListener('resize',measure);
  };
 },[crumbKey,displayedPage,locale,translations,collapsed,mobile]);
 const crumbIcon=(key:string):ReactNode=>{
  const special:Record<string,ReactNode>={
   students:<Users size={17}/>,student_records:<BookOpen size={17}/>,
   student_contacts:<Users size={17}/>,academic_years:<CalendarDays size={17}/>,
   groups:<Users size={17}/>,courses:<BookOpenCheck size={17}/>,
   student_details:<GraduationCap size={17}/>
  };
  return special[key]||moduleIcons[key]||<FolderOpen size={16}/>;
 };
 useEffect(()=>{setCrumbMenuOpen(false);},[page,locale]);
 useEffect(()=>{
  if(!crumbMenuOpen)return;
  function outside(event:PointerEvent){
   if(!crumbMenuRef.current?.contains(event.target as Node))setCrumbMenuOpen(false);
  }
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[crumbMenuOpen]);
 useEffect(()=>{
  document.documentElement.lang=locale;
  document.documentElement.dir=availableLocales.find(item=>item.code===locale)?.text_direction==='rtl'?'rtl':'ltr';
 },[locale,availableLocales]);
 function setLanguage(language:string){setLanguageOpen(false);languageRef.current?.querySelector<HTMLButtonElement>('.sc-language-button')?.focus();if(language===locale||!availableLocales.some(item=>item.code===language))return;setLocale(language);localStorage.setItem('school-locale',language);window.dispatchEvent(new Event('school-locale-changed'));
   void api('preferences','PATCH',{locale:language}).catch(e=>setNoticeError((e as Error).message));}
 return <div className={'app sc-shell'+(compact?' sc-shell-collapsed':'')+(mobile?' sc-shell-mobile-open':'')}>
   {mobile&&<button type="button" className="sc-sidebar-backdrop" aria-label={translateUiText(locale,'Cerrar menú lateral')} onClick={()=>{setAccountTarget(null);onMobile(false);mobileTrigger.current?.focus();}}/>}

   <aside id="school-sidebar" ref={sidebarRef} className={'sidebar sc-sidebar'+(mobile?' open':'')} role={mobile?'dialog':undefined} aria-modal={mobile?true:undefined} aria-label={translateUiText(locale,'Barra lateral principal')}>
     <SidebarBrand schoolName={school.name} locale={locale} compact={compact} closeRef={mobileCloseTrigger}
       onClose={()=>{setAccountTarget(null);onMobile(false);mobileTrigger.current?.focus();}}/>
          <nav ref={sidebarNavRef} className="sc-sidebar-nav" tabIndex={0} aria-keyshortcuts="Home End PageUp PageDown ArrowUp ArrowDown" aria-label={translateUiText(locale,'Navegación principal')}>
       {sections.map(section=>{
         const current=page==='student_details'?'students':page;
         const active=section.items.some(item=>item.key===current||findNavPath([{title:'',items:[item]}],current).length>0);
         const label=portal==='admin'?(locale==='en'?section.en:section.es):translate('group.'+section.es,section.es);
         const isOpen=!section.directPage&&(compact?compactGroup===section.id:expanded.includes(section.id));
         return <section className={'sc-nav-section'+(active?' has-active-item':'')+(section.directPage&&active?' is-primary-active':'')} key={section.id}>
          <button className="sc-nav-section-title" type="button" title={label} aria-label={label}
           aria-current={section.directPage&&active?'page':undefined}
           aria-expanded={section.directPage?undefined:isOpen}
           onClick={event=>section.directPage?navigate(section.directPage):compact?toggleCompactGroup(section.id,event.currentTarget):toggle(section.id)}>
           <span className="sc-section-icon" aria-hidden="true">{sectionIcons[section.id]||<FolderOpen size={21}/>}</span>
           <span className="sc-section-label">{label}</span>
           {!section.directPage&&(isOpen?<ChevronDown className="sc-section-chevron" size={17}/>:<ChevronRight className="sc-section-chevron" size={17}/>)}
          </button>
          {!compact&&!section.directPage&&isOpen&&<div className="sc-section-children">{section.items.map(item=>renderItem(item,0))}</div>}
         </section>;
        })}
     </nav>
     <div className="sidebar-bottom sc-sidebar-foot sc-flyout-holder" ref={sidebarAccountRef}>
       <button className="sc-sidebar-account" type="button" aria-label={translateUiText(locale,'Opciones de cuenta de ')+user.name}
         aria-haspopup="true" aria-controls="sc-sidebar-account-panel" aria-expanded={accountTarget==='sidebar'} onClick={()=>{setAccountTarget(v=>v==='sidebar'?null:'sidebar');setNotificationsOpen(false);setLanguageOpen(false);setCompactGroup(null);}}>
         <span className="sc-sidebar-avatar" aria-hidden="true">
           <TopbarAccountAvatar name={user.name} avatarUrl={typeof user.avatar_url==='string'?user.avatar_url:undefined}/>
          </span>
         <span className="sc-sidebar-user"><strong>{user.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span><ChevronDown className="sc-sidebar-user-chevron" size={16}/>
       </button>
       
     </div>
   </aside>
   {accountTarget==='sidebar'&&createPortal(
     <SidebarAccountMenu ref={sidebarMenuRef} locale={locale} user={user}
      role={translateUiText(locale,portalLabels[portal])}
      labels={{
       menu:translateUiText(locale,'Menú de cuenta'),
       profile:translate('shell.profile','Mi perfil y seguridad'),
       preferences:translate('shell.preferences','Preferencias'),
       notifications:translate('shell.notification_center','Centro de notificaciones'),
       help:translate('shell.help','Ayuda y guía de uso'),
       signout:translate('shell.signout','Cerrar sesión')
      }}
      position={sidebarMenuPosition} onNavigate={navigate}
      onSignOut={()=>{setAccountTarget(null);void onSignOut();}}/>,
     document.body
   )}
   {compact&&compactGroup&&createPortal(
     <div className="sc-compact-flyout" ref={compactFlyoutRef} role="region"
       aria-label={(portal==='admin'?(locale==='en'?sections.find(section=>section.id===compactGroup)?.en:compactGroup):translate('group.'+compactGroup,compactGroup))}
       style={compactPosition?{top:compactPosition.top,left:compactPosition.left}:undefined}>
       <strong>{(portal==='admin'?(locale==='en'?sections.find(section=>section.id===compactGroup)?.en:compactGroup):translate('group.'+compactGroup,compactGroup))}</strong>
       {sections.find(section=>section.id===compactGroup)?.items.map(item=>renderItem(item,0))}
     </div>,document.body)}
   <main className="sc-main">
     <header className="topbar sc-topbar">
       <button ref={mobileTrigger} type="button" className="mobile" aria-label={locale==='en'?'Open menu':'Abrir menú'} aria-controls="school-sidebar" aria-expanded={mobile} onClick={()=>onMobile(true)}><Menu/></button>
       <button type="button" className="sc-collapse-toggle" aria-label={translateUiText(locale,collapsed?'Expandir barra lateral':'Colapsar barra lateral')} aria-expanded={!collapsed} onClick={()=>{setCollapsed(v=>!v);setCompactGroup(null);}}>{collapsed?<PanelLeftOpen size={21}/>:<PanelLeftClose size={21}/>}</button>
       <button type="button" className="sc-topbar-brand" onClick={()=>navigate('dashboard')} aria-label={translateUiText(locale,'Ir al inicio de ')+school.name}>
         {school.logo_url?<img src={school.logo_url} alt=""/>:<span className="sc-topbar-mark"><BookOpen size={22}/></span>}
         <span className="sc-topbar-brand-text"><strong>{school.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span>
       </button>
       {portal==='tutors'&&childrenList.length>0&&<div className="sc-child-picker">
         <Combobox value={selectedChildId} label={translateUiText(locale,'Seleccionar hijo')} placeholder={translateUiText(locale,'Todos mis hijos')} onChange={onSelectChild}
           options={childrenList.map(child=>({value:String(child.id),label:child.full_name||child.first_name}))}/>
       </div>}
       <TopbarCommands groups={groups} records={searchCollections} can={can} locale={locale} translate={translate}
        onNavigate={(target,search)=>onSearchNavigate?onSearchNavigate(target,search):navigate(target)}
        onStudent={student=>onSearchStudent?onSearchStudent(student):navigate('students')}
                onOpen={()=>{setAccountTarget(null);setNotificationsOpen(false);setLanguageOpen(false);setCompactGroup(null);}}/>
       <div className="sc-top-actions">
         <div className="sc-language sc-flyout-holder" ref={languageRef}>
           <button type="button" className="sc-icon-button sc-language-button" aria-label={translate('shell.locale','Idioma')} title={translate('shell.locale','Idioma')} aria-haspopup="true" aria-expanded={languageOpen} onClick={()=>{setLanguageOpen(v=>!v);setNotificationsOpen(false);setAccountTarget(null);setCompactGroup(null);}}><Languages size={18}/><span className="sc-language-code">{locale.toUpperCase()}</span><ChevronDown className="sc-language-chevron" size={13}/></button>
           {languageOpen&&<LanguageMenu label={translateUiText(locale,"Idiomas disponibles")}
             currentLocale={locale} onSelect={setLanguage}
             languages={availableLocales.length?availableLocales:[{code:'es',native_name:'Español'},{code:'en',native_name:'English'}]}/>}

         </div>
         <div className="sc-flyout-holder" ref={notificationRef}>
           <button className="sc-icon-button sc-notification-button" aria-label={(locale==='en'?'Notifications: ':'Notificaciones: ')+unread+(locale==='en'?' unread':' sin leer')} aria-haspopup="true" aria-expanded={notificationsOpen}
             onClick={()=>{setNotificationsOpen(v=>!v);setAccountTarget(null);setLanguageOpen(false);setCompactGroup(null);}}><Bell size={19}/>{unread>0&&<b className="sc-notification-count">{unread>99?'99+':unread}</b>}</button>
           {notificationsOpen&&<NotificationPopover locale={locale} items={notificationItems} unread={unread}
             loading={notificationLoading} busy={notificationBusy} error={noticeError}
             onRead={item=>void read(item)} onReadAll={()=>void readAllNotifications()}
             onClose={()=>{setNotificationsOpen(false);notificationRef.current?.querySelector<HTMLButtonElement>('.sc-notification-button')?.focus();}}
             onViewAll={()=>navigate('notifications')}/>}
         </div>
         <div className="sc-flyout-holder" ref={topbarAccountRef}>
           <button className="sc-account-button" type="button" aria-label={translateUiText(locale,'Opciones de cuenta de ')+user.name}
             aria-haspopup="true" aria-controls="sc-topbar-account-panel" aria-expanded={accountTarget==='topbar'}
             onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();focusTopbarAccountMenu.current=true;setAccountTarget('topbar');if(accountTarget==='topbar')topbarAccountMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();}
              else if(event.key==='Enter'||event.key===' ')focusTopbarAccountMenu.current=true;}}
             onClick={()=>{setAccountTarget(v=>v==='topbar'?null:'topbar');setNotificationsOpen(false);setLanguageOpen(false);setCompactGroup(null);}}>
             <span className="sc-topbar-avatar"><TopbarAccountAvatar name={user.name} avatarUrl={typeof user.avatar_url==='string'?user.avatar_url:undefined}/></span>
             <span className="sc-account-identity"><strong>{user.name}</strong><small>{translateUiText(locale,portalLabels[portal])}</small></span><ChevronDown className="sc-account-chevron" size={16}/>
           </button>
           
         </div>
       </div>
     </header>
     {accountTarget==='topbar'&&createPortal(
       <SidebarAccountMenu ref={topbarAccountMenuRef} locale={locale} user={user}
        role={translateUiText(locale,portalLabels[portal])} variant="topbar"
        labels={{
         menu:translateUiText(locale,'Menú de cuenta'),
         profile:translate('shell.profile','Mi perfil y seguridad'),
         preferences:translate('shell.preferences','Preferencias'),
         notifications:translate('shell.notification_center','Centro de notificaciones'),
         help:translate('shell.help','Ayuda y guía de uso'),
         signout:translate('shell.signout','Cerrar sesión')
        }}
        position={topbarAccountPosition} onNavigate={navigate}
        onSignOut={()=>{setAccountTarget(null);void onSignOut();}}/>,
       document.body
      )}
      <div className="sc-breadcrumb-bar sc-breadcrumb-design-one">
       <nav ref={breadcrumbNavRef} className={'sc-crumbs'+(breadcrumbCondensed?' sc-crumbs-condensed':'')}
         data-current-page={displayedPage} data-breadcrumb-trail={crumbKey}
         aria-label={translateUiText(locale,"Ruta de navegación")}>
         <button className="sc-crumb-home" type="button" aria-label={translateUiText(locale,"Ir al inicio")}
           title={translateUiText(locale,"Ir al inicio")} onClick={()=>navigate('dashboard')}>
           <House size={18} strokeWidth={2.25} aria-hidden="true"/>
           <span className="sc-crumb-home-label">{translate('group.Inicio','Inicio')}</span>
         </button>
         {trail.map((item,index)=><span className={'sc-crumb-step'+(index===trail.length-1?' sc-crumb-current':' sc-crumb-ancestor')} key={item.key}>
           <ChevronRight className="sc-crumb-divider" size={15} strokeWidth={2} aria-hidden="true"/>
           {index===trail.length-1?
             <span className="sc-crumb-current-label" aria-current="page" title={crumbLabel(item.key,item.title)}>{crumbLabel(item.key,item.title)}</span>:
             <button className="sc-crumb-link" type="button" title={crumbLabel(item.key,item.title)}
               onClick={()=>navigate(breadcrumbDestination(item.key))}>
               <span className="sc-crumb-icon" aria-hidden="true">{crumbIcon(item.key)}</span>
               <span className="sc-crumb-label">{crumbLabel(item.key,item.title)}</span>
             </button>}
         </span>)}
         {trail.length>1&&<div className="sc-crumb-more" ref={crumbMenuRef}>
           <ChevronRight className="sc-crumb-divider" size={15} strokeWidth={2} aria-hidden="true"/>
           <button type="button" className="sc-crumb-more-trigger" ref={crumbMenuTrigger}
             aria-expanded={crumbMenuOpen} aria-label={translateUiText(locale,"Mostrar páginas anteriores")}
             onClick={()=>setCrumbMenuOpen(open=>!open)}><MoreHorizontal size={17} aria-hidden="true"/></button>
           {crumbMenuOpen&&<div className="sc-crumb-more-menu" role="group" aria-label={translateUiText(locale,"Páginas anteriores")}>
             {trail.slice(0,-1).map(item=><button key={item.key} type="button" onClick={()=>navigate(breadcrumbDestination(item.key))}>
               <span className="sc-crumb-icon" aria-hidden="true">{crumbIcon(item.key)}</span>
               <span>{crumbLabel(item.key,item.title)}</span>
             </button>)}
           </div>}
         </div>}
       </nav>
     </div>
     <div className="sc-main-content"><LocaleProvider locale={locale} translations={translations}>{children}</LocaleProvider></div>
     <PortalFooter locale={locale} onNavigate={navigate}/>
   </main>
 </div>;
}
