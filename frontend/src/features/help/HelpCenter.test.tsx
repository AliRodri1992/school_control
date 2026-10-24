// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import HelpCenter from './HelpCenter';

afterEach(cleanup);
it('shows instructions only for teacher modules permitted by RBAC',()=>{
 render(<HelpCenter role="teacher" can={permission=>permission==='attendances.create'} onNavigate={()=>{}}/>);
 expect(screen.getByText('Pasar lista')).toBeTruthy();
 expect(screen.queryByText('Capturar calificaciones')).toBeNull();
});
it('provides guardian admissions guidance',()=>{
 render(<HelpCenter role="guardian" can={permission=>permission==='admissions.create'} onNavigate={()=>{}}/>);
 expect(screen.getByText('Realizar una inscripción o reinscripción')).toBeTruthy();
});
