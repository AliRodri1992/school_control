// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradeActions from './GradeActions';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
const request=vi.mocked(api),grade={id:1,lock_version:2,status:'draft',score:8,student_name:'Alex',subject_name:'Matemáticas',term:1};
beforeEach(()=>{request.mockReset();request.mockResolvedValue({});});
afterEach(cleanup);

it('offers review before publication',async()=>{
  const changed=vi.fn().mockResolvedValue(undefined);render(<GradeActions grade={grade} admin onChanged={changed}/>);
  expect(screen.queryByRole('button',{name:'Publicar'})).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Revisar'}));
  await waitFor(()=>expect(changed).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith('grades/1/review','POST',undefined);
});

it('does not offer administrative transitions to teachers',()=>{
  render(<GradeActions grade={{...grade,status:'published'}} admin={false} onChanged={vi.fn()}/>);
  expect(screen.queryByRole('button',{name:'Corregir'})).toBeNull();
  expect(screen.getByRole('button',{name:'Historial'})).toBeTruthy();
});

it('submits a correction with a mandatory reason',async()=>{
  const changed=vi.fn().mockResolvedValue(undefined);render(<GradeActions grade={{...grade,status:'published'}} admin onChanged={changed}/>);
  await userEvent.click(screen.getByRole('button',{name:'Corregir'}));
  await userEvent.clear(screen.getByLabelText('Calificación corregida'));
  await userEvent.type(screen.getByLabelText('Calificación corregida'),'9');
  await userEvent.type(screen.getByLabelText('Motivo de la corrección'),'Error verificado');
  await userEvent.click(screen.getByRole('button',{name:'Guardar corrección'}));
  await waitFor(()=>expect(changed).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith('grades/1/correct','POST',{score:'9',feedback:'',reason:'Error verificado',lock_version:'2'});
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('preserves the correction dialog and input after a server failure',async()=>{
  request.mockRejectedValue(new Error('La calificación cambió.'));
  render(<GradeActions grade={{...grade,status:'published'}} admin onChanged={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Corregir'}));
  await userEvent.type(screen.getByLabelText('Motivo de la corrección'),'Error verificado');
  await userEvent.click(screen.getByRole('button',{name:'Guardar corrección'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','La calificación cambió.');
  expect(screen.getByLabelText('Motivo de la corrección')).toHaveProperty('value','Error verificado');
});

it('renders correction history with old and new marks',async()=>{
  request.mockResolvedValue([{id:3,previous_score:8,score:9,reason:'Error verificado',actor_name:'Dirección',created_at:'2026-10-22T12:00:00Z'}]);
  render(<GradeActions grade={grade} admin onChanged={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Historial'}));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  expect(screen.getByText('8 → 9')).toBeTruthy();
  expect(screen.getByText('Error verificado')).toBeTruthy();
});
