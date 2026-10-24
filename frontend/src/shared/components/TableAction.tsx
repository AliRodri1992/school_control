import {useEffect,useId,useRef} from 'react';
import {
  BadgeCheck,CheckCircle2,ClipboardCheck,ClipboardList,Download,Eye,FilePenLine,
  History,MessageSquareText,Pencil,RotateCcw,Send,Trash2,UserCheck,UserX,XCircle
} from 'lucide-react';

export type TableActionKind =
  'view'|'edit'|'delete'|'approve'|'reject'|'complete'|'activate'|'deactivate'|
  'report'|'review'|'publish'|'correct'|'history'|'requests'|'download'|'retry'|'open';

const actionConfig={
  view:{label:'Ver',Icon:Eye},
  edit:{label:'Editar',Icon:Pencil},
  delete:{label:'Eliminar',Icon:Trash2},
  approve:{label:'Aprobar',Icon:CheckCircle2},
  reject:{label:'Rechazar',Icon:XCircle},
  complete:{label:'Cerrar ciclo',Icon:BadgeCheck},
  activate:{label:'Activar',Icon:UserCheck},
  deactivate:{label:'Desactivar',Icon:UserX},
  report:{label:'Boleta',Icon:ClipboardList},
  review:{label:'Revisar',Icon:ClipboardCheck},
  publish:{label:'Publicar',Icon:Send},
  correct:{label:'Corregir',Icon:FilePenLine},
  history:{label:'Historial',Icon:History},
  requests:{label:'Solicitudes',Icon:MessageSquareText},
  download:{label:'Descargar',Icon:Download},
  retry:{label:'Reintentar',Icon:RotateCcw},
  open:{label:'Abrir',Icon:Eye}
} as const;

type Props={
  kind:TableActionKind;
  onClick?:()=>void;
  href?:string;
  ariaLabel?:string;
  tooltip?:string;
  disabled?:boolean;
  className?:string;
};

/**
 * Use native pointer/focus listeners for the floating hint. The tooltip lives
 * under document.body so overflow:auto table containers cannot clip it.
 * Keep the native title as a fallback if scripting or styling is interrupted.
 */
export default function TableAction({kind,onClick,href,ariaLabel,tooltip,disabled=false,className=''}:Props){
 const {Icon,label}=actionConfig[kind];
 const text=tooltip||label;
 const id=useId();
 const anchor=useRef<HTMLButtonElement|HTMLAnchorElement>(null);

 useEffect(()=>{
   const element=anchor.current;
   if(!element||disabled)return;
   const hint=document.createElement('span');
   hint.id=id;
   hint.setAttribute('role','tooltip');
   hint.className='sc-table-action-tooltip';
   hint.textContent=text;
   hint.style.display='none';
   document.body.appendChild(hint);
   const place=()=>{
     const rect=element.getBoundingClientRect();
     const below=rect.top<54;
     hint.style.left=Math.min(Math.max(rect.left+rect.width/2,64),window.innerWidth-64)+'px';
     hint.style.top=(below?rect.bottom+9:rect.top-9)+'px';
     hint.classList.toggle('is-below',below);
   };
   const show=()=>{
     if(hint.style.display!=='none')return;
     place();
     hint.style.display='block';
     element.setAttribute('aria-describedby',id);
   };
   const hide=()=>{
     hint.style.display='none';
     element.removeAttribute('aria-describedby');
   };
   const reposition=()=>{if(hint.style.display!=='none')place();};
   element.addEventListener('pointerenter',show);
   element.addEventListener('mouseenter',show);
   element.addEventListener('mousemove',show);
   element.addEventListener('focus',show);
   element.addEventListener('pointerleave',hide);
   element.addEventListener('mouseleave',hide);
   element.addEventListener('blur',hide);
   window.addEventListener('scroll',reposition,true);
   window.addEventListener('resize',reposition);
   return()=>{
     element.removeEventListener('pointerenter',show);
     element.removeEventListener('mouseenter',show);
     element.removeEventListener('mousemove',show);
     element.removeEventListener('focus',show);
     element.removeEventListener('pointerleave',hide);
     element.removeEventListener('mouseleave',hide);
     element.removeEventListener('blur',hide);
     window.removeEventListener('scroll',reposition,true);
     window.removeEventListener('resize',reposition);
     element.removeAttribute('aria-describedby');
     hint.remove();
   };
 },[disabled,id,text]);

 const props={
   ref:(node:HTMLAnchorElement|HTMLButtonElement|null)=>{anchor.current=node;},
   className:'sc-table-action is-'+kind+(className?' '+className:''),
   'aria-label':ariaLabel||text,
   title:text
 };
 return href?<a {...props} href={href} onClick={onClick}><Icon size={18} strokeWidth={1.9} aria-hidden="true"/></a>:
  <button {...props} type="button" disabled={disabled} onClick={onClick}><Icon size={18} strokeWidth={1.9} aria-hidden="true"/></button>;
}
