import Swal from 'sweetalert2';
import type {Row} from '../../modules';

type ContactRow=Partial<Pick<Row,'id'|'student_id'|'student_name'|'name'|'relationship'|'phone'|'emergency'|'pickup_authorized'>>;
const enabled=(value:unknown)=>value===true||value===1||value==='true'||value==='1';

function node<K extends keyof HTMLElementTagNameMap>(tag:K,className:string,text?:string){
 const element=document.createElement(tag);
 element.className=className;
 if(text!==undefined)element.textContent=text;
 return element;
}

/** Build a DOM fragment instead of interpolating contact data into SweetAlert HTML. */
export function familyContactDeleteContent(contact:ContactRow,contacts:ContactRow[],studentName:string):HTMLElement{
 const name=String(contact.name||'Contacto sin nombre');
 const relationship=String(contact.relationship||'Parentesco no registrado');
 const student=String(studentName||contact.student_name||'Alumno no identificado');
 const emergency=enabled(contact.emergency);
 const pickup=enabled(contact.pickup_authorized);
 const sameStudent=contacts.filter(item=>String(item.student_id)===String(contact.student_id));
 const lastEmergency=emergency&&sameStudent.filter(item=>enabled(item.emergency)).length===1;
 const lastPickup=pickup&&sameStudent.filter(item=>enabled(item.pickup_authorized)).length===1;

 const content=node('div','sc-family-delete-content');
 const summary=node('div','sc-family-delete-summary');
 const identity=node('div','sc-family-delete-identity');
 const initials=name.trim().split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join('').toLocaleUpperCase();
 identity.append(node('span','sc-family-delete-avatar',initials||'?'));
 const person=node('div','sc-family-delete-person');
 person.append(node('strong','sc-family-delete-person-name',name),node('span','sc-family-delete-relationship',relationship));
 identity.append(person);

 const studentField=node('div','sc-family-delete-student');
 studentField.append(node('span','sc-family-delete-meta-label','ALUMNO'),node('strong','sc-family-delete-student-name',student));
 summary.append(identity,studentField);

 const flags=node('div','sc-family-delete-flags');
 if(emergency)flags.append(node('span','sc-family-delete-flag is-emergency','Emergencia'));
 if(pickup)flags.append(node('span','sc-family-delete-flag is-pickup','Recogida autorizada'));

 const notice=node('section','sc-family-delete-notice');
 notice.append(node('p','sc-family-delete-notice-copy',
  'Se quitará del expediente y perderá sus autorizaciones. No se puede deshacer.'));
 if(lastEmergency||lastPickup){
  const warning=lastEmergency&&lastPickup
   ?'Es el único contacto de emergencia y la única persona autorizada para recoger.'
   :lastEmergency?'Es el único contacto de emergencia.':'Es la única persona autorizada para recoger.';
  notice.append(node('p','sc-family-delete-last-warning',warning));
 }
 content.append(summary);
 if(flags.childElementCount)content.append(flags);
 content.append(notice);
 return content;
}

/** Confirmation and deletion are one transaction from the user's perspective.
 * The dialog stays open and shows the server error when the request fails.
 */
export async function confirmFamilyContactDelete(contact:ContactRow,contacts:ContactRow[],studentName:string,onDelete:()=>Promise<void>):Promise<boolean>{
 const result=await Swal.fire({
  title:'¿Eliminar este contacto?',
  html:familyContactDeleteContent(contact,contacts,studentName),
  imageUrl:'/illustrations/auli-warning.svg',
  imageWidth:58,imageHeight:58,imageAlt:'Auli advierte antes de eliminar un contacto',
  width:700,
  showCancelButton:true,
  confirmButtonText:'Sí, eliminar contacto',
  cancelButtonText:'Conservar contacto',
  reverseButtons:true,
  focusCancel:true,
  showLoaderOnConfirm:true,
  allowOutsideClick:()=>!Swal.isLoading(),
  allowEscapeKey:()=>!Swal.isLoading(),
  buttonsStyling:false,
  customClass:{
   popup:'school-dialog sc-family-delete-dialog',
   title:'school-dialog-title sc-family-delete-title',
   htmlContainer:'sc-family-delete-html',
   actions:'sc-family-delete-actions',
   confirmButton:'school-dialog-confirm sc-family-delete-confirm',
   cancelButton:'school-dialog-cancel sc-family-delete-cancel'
  },
  preConfirm:async()=>{
   try{await onDelete();return true;}
   catch(error){
    const message=error instanceof Error?error.message:'No se pudo eliminar el contacto.';
    Swal.showValidationMessage('No fue posible eliminar el contacto: '+message);
    return false;
   }
  }
 });
 return result.isConfirmed;
}
