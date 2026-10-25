import TableAction from '../../shared/components/TableAction';
import type {Row} from '../../modules';

type Props={
 student:Row;
 canView:boolean;
 canReport:boolean;
 reportLoading?:boolean;
 canEdit:boolean;
 onView:()=>void;
 onReport:()=>void;
 onEdit:()=>void;
};

export default function StudentRowActions({student,canView,canReport,reportLoading=false,canEdit,onView,onReport,onEdit}:Props){
 const name=String(student.full_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'alumno');
 return <div className="sc-table-action-group" role="group" aria-label={`Acciones de ${name}`}>
  {canView&&<TableAction kind="view" tooltip="Expediente" ariaLabel={`Ver expediente de ${name}`} onClick={onView}/>}
  {canReport&&<TableAction kind="report" tooltip={reportLoading?"Cargando boleta…":"Boleta"}
   ariaLabel={reportLoading?`Cargando boleta de ${name}`:`Ver boleta e historial de ${name}`}
   disabled={reportLoading} onClick={onReport}/>}
  {canEdit&&<TableAction kind="edit" ariaLabel={`Editar alumno ${name}`} onClick={onEdit}/>}
 </div>;
}
