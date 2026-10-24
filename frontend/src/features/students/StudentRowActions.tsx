import {ClipboardList,IdCard,Pencil} from 'lucide-react';
import type {Row} from '../../modules';

type Props={
 student:Row;
 canView:boolean;
 canReport:boolean;
 canEdit:boolean;
 onView:()=>void;
 onReport:()=>void;
 onEdit:()=>void;
};

/** Keep labels accessible while giving the student table compact SVG actions. */
export default function StudentRowActions({student,canView,canReport,canEdit,onView,onReport,onEdit}:Props){
 const name=String(student.full_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'alumno');
 return <div className="sc-student-row-actions" role="group" aria-label={`Acciones de ${name}`}>
  {canView&&<button type="button" className="sc-student-row-action is-view" title="Ver expediente"
    aria-label={`Ver expediente de ${name}`} onClick={onView}><IdCard size={18} strokeWidth={1.9} aria-hidden="true"/></button>}
  {canReport&&<button type="button" className="sc-student-row-action is-report" title="Boleta e historial"
    aria-label={`Ver boleta e historial de ${name}`} onClick={onReport}><ClipboardList size={18} strokeWidth={1.9} aria-hidden="true"/></button>}
  {canEdit&&<button type="button" className="sc-student-row-action is-edit" title="Editar alumno"
    aria-label={`Editar alumno ${name}`} onClick={onEdit}><Pencil size={17} strokeWidth={2} aria-hidden="true"/></button>}
 </div>;
}
