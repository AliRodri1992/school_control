// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordForm from './RecordForm';

afterEach(cleanup);

it('shows required field errors directly beneath each form control',async()=>{
 const submit=vi.fn();
 render(<RecordForm initial={{}} fields={[{key:'first_name',label:'Nombre del alumno'},{key:'group_id',label:'Grupo',options:[['1','1° A']]}]}
   busy={false} error="" onSubmit={submit} onCancel={vi.fn()} options={()=>[]} optionName={r=>r.name}/>);
 await userEvent.click(screen.getByRole('button',{name:'Guardar'}));
 expect(screen.getByText('Nombre del alumno no puede estar vacío.')).toBeTruthy();
 expect(screen.getByText('Grupo no puede estar vacío.')).toBeTruthy();
 expect(submit).not.toHaveBeenCalled();
 await userEvent.type(screen.getByLabelText(/Nombre del alumno/),'Alex');
 await userEvent.click(screen.getByRole('combobox',{name:'Grupo'}));
 await userEvent.click(screen.getByRole('option',{name:'1° A'}));
 await userEvent.click(screen.getByRole('button',{name:'Guardar'}));
 expect(submit).toHaveBeenCalledWith({first_name:'Alex',group_id:'1'});
});

it('shows backend validation errors using the field label',()=>{
 render(<RecordForm initial={{first_name:'Alex'}} fields={[{key:'first_name',label:'Nombre del alumno'}]}
   busy={false} error="" fieldErrors={{first_name:['ya existe']}}
   onSubmit={vi.fn()} onCancel={vi.fn()} options={()=>[]} optionName={r=>r.name}/>);
 expect(screen.getByText('Nombre del alumno ya existe.')).toBeTruthy();
});

it('navigates both steps of a complex form and preserves entered fields',async()=>{
 const fields=Array.from({length:6},(_,i)=>({key:'field'+i,label:'Campo '+i,optional:false}));
 render(<RecordForm fields={fields} initial={{}} onSubmit={vi.fn()} onCancel={vi.fn()} busy={false} options={()=>[]} optionName={r=>r.name} error=""/>);
 expect(screen.getByText('1 · Información básica')).toBeTruthy();
 for(let i=0;i<3;i++)await userEvent.type(screen.getByLabelText('Campo '+i+' *'),'dato'+i);
 await userEvent.click(screen.getByRole('button',{name:'Siguiente'}));
 expect(screen.getByLabelText(/Campo 3/)).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Anterior'}));
 expect(screen.getAllByRole('textbox').length).toBe(3);
});
