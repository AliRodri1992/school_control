// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAddressForm,{studentAddressPayload,studentAddressValues,validateStudentAddress} from './StudentAddressForm';

afterEach(cleanup);

it('rehydrates an existing address including location details and the primary switch',()=>{
 const initial={id:42,country_code:'MX',purpose:'home',line1:'Calle Roble 12',
  line2:'Interior B',neighborhood:'Los Olivos',locality:'Cuautitlán Izcalli',
  region:'Estado de México',postal_code:'54700',primary:true};
 const onSubmit=vi.fn();
 render(<StudentAddressForm initial={initial} studentName="Sara López"
  busy={false} error="" onSubmit={onSubmit} onCancel={vi.fn()}/>);
 expect(screen.getByRole('heading',{name:'Ubicación del alumno'})).toBeTruthy();
 expect((screen.getByLabelText(/Calle y número/) as HTMLInputElement).value).toBe('Calle Roble 12');
 expect((screen.getByLabelText('Código postal') as HTMLInputElement).value).toBe('54700');
 expect((screen.getByRole('switch',{name:'Domicilio principal'}) as HTMLInputElement).checked).toBe(true);
 expect(screen.getByRole('combobox',{name:'Tipo de domicilio'}).textContent).toContain('Domicilio particular');
 expect(screen.getByRole('heading',{name:'Así se verá en el expediente'})).toBeTruthy();
});

it('updates an address without discarding the existing purpose, details or primary flag',async()=>{
 const onSubmit=vi.fn();
 const original={id:7,line1:'Avenida Hidalgo 15',line2:'Edificio 2',country_code:'MX',
  purpose:'home',neighborhood:'Centro',locality:'Toluca',region:'México',postal_code:'50000',primary:true};
 render(<StudentAddressForm initial={original} studentName="Luis" busy={false} error=""
  onSubmit={onSubmit} onCancel={vi.fn()}/>);
 await userEvent.clear(screen.getByLabelText(/Calle y número/));
 await userEvent.type(screen.getByLabelText(/Calle y número/),'Avenida Hidalgo 16');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(onSubmit).toHaveBeenCalledWith({
  country_code:'MX',purpose:'home',line1:'Avenida Hidalgo 16',
  line2:'Edificio 2',neighborhood:'Centro',locality:'Toluca',region:'México',
  postal_code:'50000',primary:true
 });
});

it('shows field-specific errors, focuses the first issue and does not save invalid addresses',async()=>{
 const onSubmit=vi.fn();
 render(<StudentAddressForm initial={{}} studentName="Sara" busy={false} error=""
  onSubmit={onSubmit} onCancel={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Registrar dirección'}));
 expect(screen.getByRole('alert').textContent).toContain('Calle y número es obligatorio.');
 expect(document.activeElement).toBe(screen.getByLabelText(/Calle y número/));
 expect(onSubmit).not.toHaveBeenCalled();
});

it('validates Mexican postal codes but preserves optional addresses and country values',()=>{
 const base=studentAddressValues({line1:'Calle 1',country_code:'MX',purpose:'home'});
 expect(validateStudentAddress({...base,postal_code:'12'}).postal_code).toContain('5 dígitos');
 expect(validateStudentAddress({...base,postal_code:'54700'})).toEqual({});
 expect(validateStudentAddress({...base,country_code:'US',postal_code:'90210'})).toEqual({});
 expect(studentAddressValues({country_code:'CA',primary:'true',line2:''}).primary).toBe(true);
 expect(studentAddressPayload({...base,line1:' Calle 1 ',line2:' ',primary:false})).toMatchObject({
  line1:'Calle 1',line2:null,primary:false,country_code:'MX'
 });
});

it('does not submit while a save is in progress',async()=>{
 const onSubmit=vi.fn();
 render(<StudentAddressForm initial={{line1:'Calle 1',purpose:'home',country_code:'MX'}}
  studentName="Sara" busy error="" onSubmit={onSubmit} onCancel={vi.fn()}/>);
 expect(screen.getByRole('button',{name:'Guardando…'})).toHaveProperty('disabled',true);
 expect(onSubmit).not.toHaveBeenCalled();
});
