// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuliGuide from './AuliGuide';

afterEach(cleanup);

it('shows a clearly labeled empty-state message with Auli',()=>{
 render(<AuliGuide title="Aún no hay alumnos registrados"
  text="Cuando registres al primer alumno, su expediente aparecerá aquí." mood="thinking" compact/>);
 expect(screen.getByText('INFORMACIÓN DEL SISTEMA')).toBeTruthy();
 expect(screen.getByText('Aún no hay alumnos registrados')).toBeTruthy();
 const mascot=screen.getByRole('img',{name:'Auli, el loro asistente escolar: thinking'});
 expect(mascot.getAttribute('src')).toBe('/illustrations/auli-thinking.svg');
});

it('distinguishes permissions from a normal empty state',()=>{
 render(<AuliGuide mood="warning" title="No tienes permisos para ver esta sección"
  text="Tu rol no tiene autorización para consultar los registros de este módulo."/>);
 expect(screen.getByText('ATENCIÓN')).toBeTruthy();
 expect(screen.getByRole('img',{name:'Auli, el loro asistente escolar: warning'})).toBeTruthy();
});

it('dismisses an optional Auli tip',async()=>{
 render(<AuliGuide mood="help" title="Sugerencia" text="Consulta la guía." dismissible/>);
 await userEvent.click(screen.getByRole('button',{name:'Ocultar consejo de Auli'}));
 expect(screen.queryByLabelText('Asistente escolar Auli')).toBeNull();
});
