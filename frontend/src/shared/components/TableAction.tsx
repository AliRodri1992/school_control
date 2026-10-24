import {useEffect,useId,useState,type FocusEvent,type MouseEvent} from 'react';
import {createPortal} from 'react-dom';
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

type Position={left:number;top:number;below:boolean};
type Props={
  kind:TableActionKind;
  onClick?:()=>void;
  href?:string;
  ariaLabel?:string;
  tooltip?:string;
  disabled?:boolean;
  className?:string;
};

export default function TableAction({kind,onClick,href,ariaLabel,tooltip,disabled=false,className=''}:Props){
 const {Icon,label}=actionConfig[kind];
 const text=tooltip||label;
 const id=useId();
 const [position,setPosition]=useState<Position|null>(null);
 const place=(event:MouseEvent<HTMLElement>|FocusEvent<HTMLElement>)=>{
   const rect=event.currentTarget.getBoundingClientRect();
   const below=rect.top<55;
   setPosition({
     left:Math.min(Math.max(rect.left+rect.width/2,70),window.innerWidth-70),
     top:below?rect.bottom+9:rect.top-9,
     below
   });
 };
 useEffect(()=>{
   if(!position)return;
   const dismiss=()=>setPosition(null);
   window.addEventListener('scroll',dismiss,true);
   window.addEventListener('resize',dismiss);
   return()=>{
     window.removeEventListener('scroll',dismiss,true);
     window.removeEventListener('resize',dismiss);
   };
 },[position]);

 const props={
   className:'sc-table-action is-'+kind+(className?' '+className:''),
   'aria-label':ariaLabel||text,
   'aria-describedby':position?id:undefined,
   title:position?undefined:text,
   onMouseEnter:place,
   onMouseLeave:()=>setPosition(null),
   onFocus:place,
   onBlur:()=>setPosition(null)
 };
 return <>
  {href?<a {...props} href={href} onClick={onClick}><Icon size={18} strokeWidth={1.9} aria-hidden="true"/></a>:
    <button {...props} type="button" disabled={disabled} onClick={onClick}><Icon size={18} strokeWidth={1.9} aria-hidden="true"/></button>}
  {position&&createPortal(
   <span id={id} role="tooltip" className={'sc-table-action-tooltip'+(position.below?' is-below':'')}
     style={{left:position.left,top:position.top}}>{text}</span>,document.body)}
 </>;
}
