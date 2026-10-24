// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradeRequests from './GradeRequests';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
const request=vi.mocked(api),grade={id:1,lock_version:2,status:'published',score:8,feedback:'Original',student_name:'Alex',subject_name:'Matemáticas',term:1};
const pending={id:3,status:'pending',previous_score:8,score:9,reason:'Error de captura',requester_name:'Docente',created_at:'2026-10-23T12:00:00Z',can_resolve:true};
beforeEach(()=>{request.mockReset();request.mockResolvedValue([]);});
afterEach(cleanup);

it('submits the proposed change with the displayed version and leaves the mark unchanged',async()=>{
  const changed=vi.fn().mockResolvedValue(undefined);
  render(<GradeRequests grade={grade} onChanged={changed}/>);
  await userEvent.click(screen.getByRole('button',{name:'Solicitudes de corrección'}));
  await userEvent.clear(screen.getByLabelText('Calificación propuesta'));
  await userEvent.type(screen.getByLabelText('Calificación propuesta'),'9');
  await userEvent.type(screen.getByLabelText('Motivo de solicitud'),'Error de captura');
  await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud'}));
  await waitFor(()=>expect(changed).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith('grades/1/change_requests','POST',{score:'9',feedback:'Original',reason:'Error de captura',lock_version:'2'});
  expect(grade.score).toBe(8);
});

it('resolves a pending change with a reason and hides duplicate submission',async()=>{
  request.mockResolvedValue([pending]);
  render(<GradeRequests grade={grade} onChanged={vi.fn().mockResolvedValue(undefined)}/>);
  await userEvent.click(screen.getByRole('button',{name:'Solicitudes de corrección'}));
  expect(screen.queryByRole('button',{name:'Enviar solicitud'})).toBeNull();
  await userEvent.click(screen.getByRole('combobox',{name:'Resolución de solicitud 3'}));
  await userEvent.click(screen.getByRole('option',{name:'Rechazar'}));
  await userEvent.type(screen.getByLabelText('Motivo de resolución'),'Sin evidencia suficiente');
  await userEvent.click(screen.getByRole('button',{name:'Guardar resolución'}));
  await waitFor(()=>expect(request).toHaveBeenCalledWith('grades/1/change_requests/3/resolve','POST',{decision:'rejected',resolution_reason:'Sin evidencia suficiente'}));
});

it('does not offer resolution when the server denies it',async()=>{
  request.mockResolvedValue([{...pending,can_resolve:false}]);
  render(<GradeRequests grade={grade} onChanged={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Solicitudes de corrección'}));
  expect(screen.getByText('8 → 9 · Pendiente')).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Guardar resolución'})).toBeNull();
});

it('preserves the request after a stale approval error',async()=>{
  request.mockResolvedValueOnce([pending]).mockRejectedValueOnce(new Error('La calificación cambió.'));
  render(<GradeRequests grade={grade} onChanged={vi.fn()}/>);
  await userEvent.click(screen.getByRole('button',{name:'Solicitudes de corrección'}));
  await userEvent.click(screen.getByRole('combobox',{name:'Resolución de solicitud 3'}));
  await userEvent.click(screen.getByRole('option',{name:'Aprobar'}));
  await userEvent.type(screen.getByLabelText('Motivo de resolución'),'Revisado');
  await userEvent.click(screen.getByRole('button',{name:'Guardar resolución'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','La calificación cambió.');
  expect(screen.getByLabelText('Motivo de resolución')).toHaveProperty('value','Revisado');
});
