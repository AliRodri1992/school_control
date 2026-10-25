import type {Ref} from 'react';
import {BookOpen,X} from 'lucide-react';
import {translateUiText} from '../shared/i18n/english';

type SidebarBrandProps={
 schoolName:string;
 locale:string;
 compact?:boolean;
 closeRef:Ref<HTMLButtonElement>;
 onClose:()=>void;
};

/** Shares the topbar's header row while keeping the mobile close action accessible. */
export function SidebarBrand({schoolName,locale,compact=false,closeRef,onClose}:SidebarBrandProps){
 return <header className="brand sc-shell-brand" title={schoolName} data-compact={compact}
   aria-label={'School Control · '+schoolName}>
   <span className="sc-sidebar-system-mark" aria-hidden="true"><BookOpen size={32} strokeWidth={2.25}/></span>
   <div className="sc-sidebar-brand-text">
     <strong>School Control</strong>
     <small>{locale==='en'?'Smart school management':'Gestión escolar inteligente'}</small>
   </div>
   <button ref={closeRef} className="mobile close" type="button"
     aria-label={translateUiText(locale,'Cerrar menú')} onClick={onClose}><X/></button>
 </header>;
}
