// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmissionRequirements from './AdmissionRequirements';
import {api} from '../../api';
vi.mock('../../api',()=>({api:vi.fn()}));
afterEach(()=>{cleanup();vi.mocked(api).mockReset();});
it('lets an administrator define required documents per grade and cycle',async()=>{
 vi.mocked(api).mockImplementation(async(path,method)=>method==='POST'?{id:4,title:'Acta de nacimiento',grade_level:1,academic_year_id:3,required_for_submission:true,required_for_formalization:true}:[]);
 render(<AdmissionRequirements years={[{id:3,name:'2026-2027'}]}/>);
 await userEvent.type(screen.getByPlaceholderText('Ej. Acta de nacimiento'),'Acta de nacimiento');
 await userEvent.click(screen.getByRole('button',{name:'Agregar requisito'}));
 expect(api).toHaveBeenCalledWith('admission_document_requirements','POST',expect.objectContaining({academic_year_id:3,grade_level:1,title:'Acta de nacimiento'}));
 expect(await screen.findByText('Acta de nacimiento')).toBeTruthy();
});
