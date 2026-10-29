// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {api} from '../../api';
import AdmissionDetail from './AdmissionDetail';
vi.mock('../../api',()=>({api:vi.fn()}));
afterEach(()=>{cleanup();vi.mocked(api).mockReset();});
it('shows a family their application and allows continuing only a draft',async()=>{
 vi.mocked(api).mockImplementation(async path=>path.endsWith('/history')?[]:{status:'draft',missing_for_submission:['Domicilio principal'],missing_for_formalization:[]});
 const onContinue=vi.fn();
 render(<AdmissionDetail admission={{id:4,status:'draft',grade_level:1,student_name:'Ana',year_name:'2026-2027'}}
  student={{full_name:'Ana Pérez',curp:'DEMO200101HDFRNN01'}} onClose={vi.fn()} onContinue={onContinue}/>);
 expect(screen.getByRole('heading',{name:'Ana'})).toBeTruthy();
 expect(await screen.findByText('Domicilio principal')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Continuar expediente'}));
 expect(onContinue).toHaveBeenCalledOnce();
 expect(screen.queryByRole('button',{name:'Aprobar solicitud'})).toBeNull();
});
