import {forwardRef,type CSSProperties} from 'react';
import {Bell,ChevronRight,HelpCircle,Languages,LogOut,ShieldCheck,UserRound} from 'lucide-react';
import type {Row} from '../modules';
import {userInitials} from './userInitials';
import type {SidebarAccountPosition} from './sidebarAccountPlacement';

type Labels={menu:string;profile:string;preferences:string;notifications:string;help:string;signout:string};
type Props={
 user:Row;locale:string;role:string;labels:Labels;position:SidebarAccountPosition|null;
 onNavigate:(destination:string)=>void;onSignOut:()=>void;
};

/** Readable account flyout independent of dark sidebar text and clipping. */
export const SidebarAccountMenu=forwardRef<HTMLElement,Props>(function SidebarAccountMenu(
 {user,locale,role,labels,position,onNavigate,onSignOut},ref
){
 const english=locale==='en';
 const actions=[
  {key:'profile',label:labels.profile,description:english?'Personal details and access':'Datos personales y acceso',icon:UserRound},
  {key:'preferences',label:labels.preferences,description:english?'Language and appearance':'Idioma y apariencia',icon:Languages},
  {key:'notifications',label:labels.notifications,description:english?'Recent activity':'Actividad reciente',icon:Bell},
  {key:'help',label:labels.help,description:english?'Guides and support':'Guías y asistencia',icon:HelpCircle}
 ];
 const style:CSSProperties=position
  ?{position:'fixed',left:position.left,top:position.top,width:position.width}
  :{position:'fixed',visibility:'hidden'};
 const actionButton=({key,label,description,icon:Icon}:typeof actions[number])=>
  <button type="button" key={key} className="sc-sam-action" aria-label={label} onClick={()=>onNavigate(key)}>
   <span className="sc-sam-action-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.85}/></span>
   <span className="sc-sam-action-copy"><strong>{label}</strong><small>{description}</small></span>
   <ChevronRight size={15} className="sc-sam-chevron" aria-hidden="true"/>
  </button>;
 return <section id="sc-sidebar-account-panel" ref={ref} className="sc-sidebar-account-panel"
   role="group" aria-label={labels.menu} style={style}>
  <header className="sc-sam-header">
   <span className="sc-sam-eyebrow">{english?'MY ACCOUNT':'MI CUENTA'}</span>
   <div className="sc-sam-identity">
    <span className="sc-sam-avatar" aria-hidden="true">{userInitials(user.name)}</span>
    <span className="sc-sam-identity-copy">
     <strong title={user.name}>{user.name}</strong>
     <small title={user.email}>{user.email}</small>
    </span>
   </div>
   <span className="sc-sam-role"><ShieldCheck size={13} aria-hidden="true"/>{role}</span>
  </header>
  <div className="sc-sam-options">
   <span className="sc-sam-section-label">{english?'ACCOUNT':'CUENTA'}</span>
   {actions.slice(0,3).map(actionButton)}
   <div className="sc-sam-divider"/>
   {actions.slice(3).map(actionButton)}
  </div>
  <footer className="sc-sam-footer">
   <button type="button" className="sc-sam-action sc-sam-signout" onClick={onSignOut}>
    <span className="sc-sam-action-icon" aria-hidden="true"><LogOut size={18}/></span>
    <span className="sc-sam-action-copy"><strong>{labels.signout}</strong></span>
    <ChevronRight size={15} className="sc-sam-chevron" aria-hidden="true"/>
   </button>
  </footer>
 </section>;
});
