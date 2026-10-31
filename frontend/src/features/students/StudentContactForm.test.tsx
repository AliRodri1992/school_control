// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import StudentContactForm,{studentContactFormValues,studentContactPayload,validateStudentContact} from './StudentContactForm';
import {parseFamilyCurp} from '../contacts/familyCurp';

vi.mock('sweetalert2',()=>({default:{fire:vi.fn(async()=>({isConfirmed:true}))}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const chars='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
function curp(part:string){const sum=[...part].reduce((v,ch,i)=>v+chars.indexOf(ch)*(18-i),0);return part+((10-sum%10)%10);}
const initial={
 id:91,first_name:'María',middle_name:'Elena',paternal_surname:'Salinas',maternal_surname:'Lara',
 curp:curp('SALS850720MDFLLF0'),name:'María Elena Salinas Lara',legacy_phone:'5512345678',
 relationship:'Madre',email:'maria@example.test',emergency:true,pickup_authorized:false,primary:true
};
const props={initial,studentName:'Andrea Salinas',busy:false,error:'',fieldErrors:{},onSave:vi.fn(),onCancel:vi.fn()};

it('preloads all four names and CURP when editing a dossier contact',()=>{
 render(<StudentContactForm {...props}/>);
 expect((screen.getByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('María');
 expect((screen.getByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('Elena');
 expect((screen.getByLabelText(/Apellido paterno/) as HTMLInputElement).value).toBe('Salinas');
 expect((screen.getByLabelText(/Apellido materno/) as HTMLInputElement).value).toBe('Lara');
 expect((screen.getByLabelText(/CURP/) as HTMLInputElement).value).toBe(initial.curp);
 expect(screen.getByText('Nombre completo generado automáticamente')).toBeTruthy();
 expect(screen.getByText('Andrea Salinas')).toBeTruthy();
 expect(screen.getByRole('switch',{name:'Contacto principal'})).toBeTruthy();
});

it('updates the full name preview when optional name fields are cleared',async()=>{
 render(<StudentContactForm {...props}/>);
 await userEvent.clear(screen.getByLabelText(/Segundo nombre/));
 await userEvent.clear(screen.getByLabelText(/Apellido materno/));
 expect(screen.getAllByText('María Salinas').length).toBeGreaterThan(0);
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(props.onSave).toHaveBeenCalledWith(expect.objectContaining({
  first_name:'María',middle_name:null,paternal_surname:'Salinas',maternal_surname:null,
  legacy_phone:'5512345678',curp:initial.curp,primary:true
 }));
 const sent=vi.mocked(props.onSave).mock.calls[0][0];
 expect(sent).not.toHaveProperty('name');
 expect(sent).not.toHaveProperty('birth_date');
 expect(sent).not.toHaveProperty('sex');
});

it('rejects invalid CURP and empty mandatory names with inline messages',async()=>{
 const save=vi.fn();
 render(<StudentContactForm {...props} onSave={save}/>);
 await userEvent.clear(screen.getByLabelText(/Primer nombre/));
 await userEvent.clear(screen.getByLabelText(/CURP/));
 await userEvent.type(screen.getByLabelText(/CURP/),'NOEXISTE');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(screen.getByText('Primer nombre es obligatorio.')).toBeTruthy();
 expect(screen.getByText(/CURP debe contener 18 caracteres/)).toBeTruthy();
 expect(save).not.toHaveBeenCalled();
});

it('saves linked contacts through the family module without changing primary or student IDs',()=>{
 const mirror={...initial,legacy_student_contact_id:12};
 const values=studentContactFormValues(mirror);
 const payload=studentContactPayload(values,true);
 expect(payload).toHaveProperty('phone','5512345678');
 expect(payload).not.toHaveProperty('legacy_phone');
 expect(payload).not.toHaveProperty('primary');
 expect(payload).not.toHaveProperty('student_id');
 expect(parseFamilyCurp(initial.curp)).not.toBeNull();
 render(<StudentContactForm {...props} initial={mirror}/>);
 expect(screen.getByText(/Los cambios se sincronizan con ambos módulos/)).toBeTruthy();
 expect(screen.queryByRole('switch',{name:'Contacto principal'})).toBeNull();
});

it('asks confirmation before discarding edits',async()=>{
 const onCancel=vi.fn();
 render(<StudentContactForm {...props} onCancel={onCancel}/>);
 await userEvent.type(screen.getByLabelText(/Segundo nombre/),' Patricia');
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(Swal.fire).toHaveBeenCalledOnce();
 expect(onCancel).toHaveBeenCalledOnce();
});

it('checks identity and phone constraints',()=>{
 const values=studentContactFormValues({...initial,curp:'INVALIDO',legacy_phone:'123'});
 const errors=validateStudentContact(values);
 expect(errors).toHaveProperty('curp');
 expect(errors).toHaveProperty('legacy_phone');
});
