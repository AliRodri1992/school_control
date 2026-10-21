import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
export function notify(title: string) {
  return Swal.fire({title, icon: 'success', toast: true, position: 'top-end',
    showConfirmButton: false, timer: 3200, timerProgressBar: true,
    customClass: {popup: 'school-toast', title: 'school-toast-title'}});
}
