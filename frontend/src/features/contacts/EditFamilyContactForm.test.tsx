// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Swal from 'sweetalert2';
import EditFamilyContactForm,{validateFamilyContact} from './EditFamilyContactForm';

vi.mock('sweetalert2',()=>({default:{fire:vi.fn(async()=>({isConfirmed:true}))}}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const initial={id:11,student_id:7,name:'María López',relationship:'Madre',phone:'55 1234 5678',email:'maria@example.com',emergency:'true',pickup_authorized:false};
const props={initial,studentName:'Andrea López',busy:false,error:'',fieldErrors:{},onCancel:vi.fn(),onSubmit:vi.fn()};

it('shows the contact and linked student while keeping the student immutable',()=>{
 render(<EditFamilyContactForm {...props}/>);
 expect(screen.getByRole('heading',{name:'Editar contacto'})).toBeTruthy();
 expect(screen.getByText('Andrea López')).toBeTruthy();
 expect((screen.getByLabelText(/Nombre completo/) as HTMLInputElement).value).toBe('María López');
 expect((screen.getByRole('switch',{name:'Contacto de emergencia'}) as HTMLInputElement).checked).toBe(true);
 expect((screen.getByRole('switch',{name:'Autorizado para recoger'}) as HTMLInputElement).checked).toBe(false);
 expect(screen.queryByRole('combobox',{name:'Alumno'})).toBeNull();
 expect((screen.getByRole('button',{name:'Guardar cambios'}) as HTMLButtonElement).disabled).toBe(true);
});

it('sends only editable fields and real booleans when saving changes',async()=>{
 const onSubmit=vi.fn();
 render(<EditFamilyContactForm {...props} onSubmit={onSubmit}/>);
 await userEvent.clear(screen.getByLabelText(/Teléfono/));
 await userEvent.type(screen.getByLabelText(/Teléfono/),'5511112233');
 await userEvent.click(screen.getByRole('switch',{name:'Autorizado para recoger'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(onSubmit).toHaveBeenCalledWith({
  name:'María López',relationship:'Madre',phone:'5511112233',email:'maria@example.com',
  emergency:true,pickup_authorized:true
 });
 expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('student_id');
});

it('validates required data and phone and email format inline before saving',async()=>{
 const onSubmit=vi.fn();
 render(<EditFamilyContactForm {...props} onSubmit={onSubmit}/>);
 await userEvent.clear(screen.getByLabelText(/Nombre completo/));
 await userEvent.clear(screen.getByLabelText(/Teléfono/));
 await userEvent.type(screen.getByLabelText(/Teléfono/),'123');
 await userEvent.clear(screen.getByLabelText(/Correo electrónico/));
 await userEvent.type(screen.getByLabelText(/Correo electrónico/),'bad-email');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(screen.getByText('Nombre completo no puede estar vacío.')).toBeTruthy();
 expect(screen.getByText(/Teléfono ingresa un número válido/)).toBeTruthy();
 expect(screen.getByText('Correo electrónico ingresa una dirección válida.')).toBeTruthy();
 expect(onSubmit).not.toHaveBeenCalled();
});

it('shows backend errors beneath fields, clearing them when corrected',async()=>{
 render(<EditFamilyContactForm {...props} fieldErrors={{phone:['ya existe']}}/>);
 expect(screen.getByText('Teléfono ya existe.')).toBeTruthy();
 await userEvent.type(screen.getByLabelText(/Teléfono/),'1');
 expect(screen.queryByText('Teléfono ya existe.')).toBeNull();
});

it('asks before discarding unsaved changes, and closes immediately when unchanged',async()=>{
 const onCancel=vi.fn();
 render(<EditFamilyContactForm {...props} onCancel={onCancel}/>);
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(onCancel).toHaveBeenCalledTimes(1);
 await userEvent.type(screen.getByLabelText(/Nombre completo/),' A');
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(Swal.fire).toHaveBeenCalledTimes(1);
 expect(onCancel).toHaveBeenCalledTimes(2);
});

it('validates model-compatible field limits',()=>{
 expect(validateFamilyContact({...initial,name:'x'.repeat(151),emergency:true,pickup_authorized:false})).toHaveProperty('name');
});
