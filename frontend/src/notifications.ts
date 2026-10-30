import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type Kind = 'success'|'error'|'info'|'warning';
const classes = {popup:'school-dialog',title:'school-dialog-title',confirmButton:'school-dialog-confirm',cancelButton:'school-dialog-cancel'};

export function notify(title:string,icon:Kind='success') {
 return Swal.fire({
  title, icon, toast:true, position:'top-end',
  showConfirmButton:false, timer:3200, timerProgressBar:true,
  customClass:{popup:'school-toast',title:'school-toast-title'}
 });
}
export async function confirmDanger(title:string,text:string,confirmText='Eliminar',mascot=false) {
 const result=await Swal.fire({
  title,text,icon:mascot?undefined:'warning',imageUrl:mascot?'/illustrations/auli-warning.svg':undefined,
  imageWidth:mascot?112:undefined,imageHeight:mascot?112:undefined,imageAlt:mascot?'Auli advierte que se eliminará información':undefined,
  showCancelButton:true,
  confirmButtonText:confirmText,cancelButtonText:'Cancelar',
  reverseButtons:true,focusCancel:true,buttonsStyling:false,customClass:classes
 });
 return result.isConfirmed;
}
