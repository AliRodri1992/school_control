// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import EditFamilyContactForm,{validateFamilyContact} from './EditFamilyContactForm';

vi.mock('sweetalert2',()=>({default:{fire:vi.fn(async()=>({isConfirmed:true}))}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const initial={id:11,student_id:7,name:'Sofía Elena Salinas Lara',first_name:'Sofía',middle_name:'Elena',
 paternal_surname:'Salinas',maternal_surname:'Lara',curp:'SALS850720MDFLLF03',relationship:'Madre',
 phone:'55 1234 5678',email:'sofia@example.test',emergency:'true',pickup_authorized:false};
const props={initial,studentName:'Andrea Salinas',busy:false,error:'',fieldErrors:{},onCancel:vi.fn(),onSubmit:vi.fn()};
const alphabet='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
function withDigit(s:string){const n=[...s].reduce((a,c,i)=>a+alphabet.indexOf(c)*(18-i),0);return s+((10-n%10)%10);}

it('shows separate names and CURP; the student cannot be reassigned on edit',()=>{
 const row={...initial,curp:withDigit('SALS850720MDFLLF0')};
 render(<EditFamilyContactForm {...props} initial={row}/>);
 expect(screen.getByText('Andrea Salinas')).toBeTruthy();
 expect((screen.getByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('Sofía');
 expect((screen.getByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('Elena');
 expect((screen.getByLabelText(/Apellido paterno/) as HTMLInputElement).value).toBe('Salinas');
 expect((screen.getByLabelText(/Apellido materno/) as HTMLInputElement).value).toBe('Lara');
 expect((screen.getByRole('switch',{name:'Contacto de emergencia'}) as HTMLInputElement).checked).toBe(true);
 expect(screen.queryByRole('combobox',{name:'Alumno'})).toBeNull();
});

it('submits only writable attributes; date and sex always belong to backend CURP derivation',async()=>{
 const submit=vi.fn(),row={...initial,curp:withDigit('SALS850720MDFLLF0')};
 render(<EditFamilyContactForm {...props} initial={row} onSubmit={submit}/>);
 await userEvent.clear(screen.getByLabelText(/Teléfono/));
 await userEvent.type(screen.getByLabelText(/Teléfono/),'5511112233');
 await userEvent.click(screen.getByRole('switch',{name:'Autorizado para recoger'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(submit).toHaveBeenCalledWith(expect.objectContaining({first_name:'Sofía',middle_name:'Elena',
  paternal_surname:'Salinas',maternal_surname:'Lara',curp:row.curp,phone:'5511112233',
  emergency:true,pickup_authorized:true}));
 for(const key of ['student_id','name','birth_date','sex'])expect(submit.mock.calls[0][0]).not.toHaveProperty(key);
});

it('requires identity fields, checks CURP structure and shows field-specific errors',async()=>{
 const row={...initial,curp:withDigit('SALS850720MDFLLF0')};
 render(<EditFamilyContactForm {...props} initial={row}/>);
 await userEvent.clear(screen.getByLabelText(/Primer nombre/));
 await userEvent.clear(screen.getByLabelText(/CURP/));
 await userEvent.type(screen.getByLabelText(/CURP/),'INVALIDA');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(screen.getByText('Primer nombre no puede estar vacío.')).toBeTruthy();
 expect(screen.getByText(/CURP ingresa una clave de 18 caracteres/)).toBeTruthy();
 expect(props.onSubmit).not.toHaveBeenCalled();
});

it('allows registering contacts with student dropdown and structured identity',async()=>{
 const submit=vi.fn();
 render(<EditFamilyContactForm {...props} initial={{}} students={[{id:7,full_name:'Andrea Salinas'}]} onSubmit={submit}/>);
 expect(screen.getByRole('heading',{name:'Registrar contacto'})).toBeTruthy();
 await userEvent.click(screen.getByRole('combobox',{name:'Alumno'}));
 await userEvent.click(screen.getByRole('option',{name:'Andrea Salinas'}));
 await userEvent.type(screen.getByLabelText(/Primer nombre/),'Sofia');
 await userEvent.type(screen.getByLabelText(/Apellido paterno/),'Salinas');
 await userEvent.type(screen.getByLabelText(/CURP/),withDigit('SALS850720MDFLLF0'));
 await userEvent.type(screen.getByLabelText(/Parentesco/),'Madre');
 await userEvent.type(screen.getByLabelText(/Teléfono/),'5512345678');
 await userEvent.click(screen.getByRole('button',{name:'Registrar contacto'}));
 expect(submit).toHaveBeenCalledWith(expect.objectContaining({student_id:'7',first_name:'Sofia',paternal_surname:'Salinas'}));
});

it('handles legacy records without pretending to know their surnames or CURP',()=>{
 render(<EditFamilyContactForm {...props} initial={{...initial,first_name:null,middle_name:null,paternal_surname:null,maternal_surname:null,curp:null}}/>);
 expect(screen.getByText(/registro es anterior a los campos separados/)).toBeTruthy();
 expect((screen.getByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('');
});

it('asks confirmation before discarding unsaved data',async()=>{
 const onCancel=vi.fn();
 render(<EditFamilyContactForm {...props} onCancel={onCancel}/>);
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(onCancel).toHaveBeenCalledOnce();
 await userEvent.type(screen.getByLabelText(/Segundo nombre/),' Ana');
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(Swal.fire).toHaveBeenCalledOnce();
 expect(onCancel).toHaveBeenCalledTimes(2);
});

it('checks lengths without inventing names',()=>{
 const values={first_name:'A'.repeat(81),middle_name:'',paternal_surname:'Gómez',
  maternal_surname:'',curp:withDigit('SALS850720MDFLLF0'),relationship:'Tía',
  phone:'5512345678',email:'',student_id:'7',emergency:true,pickup_authorized:false};
 expect(validateFamilyContact(values)).toHaveProperty('first_name');
});
