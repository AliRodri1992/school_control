// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {api} from '../../api';
import {notify} from '../../notifications';
import {acknowledgeStudentReportCard,downloadIssuedReportCard,issueStudentReportCard} from './reportCardActions';

vi.mock('../../api',()=>({api:vi.fn()}));
vi.mock('../../notifications',()=>({notify:vi.fn()}));
const request=vi.mocked(api),toast=vi.mocked(notify);
const initialPath=window.location.pathname;
let click:ReturnType<typeof vi.spyOn>;

beforeEach(()=>{
 request.mockReset();
 toast.mockReset();
 click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>undefined);
});
afterEach(()=>{
 click.mockRestore();
 document.body.innerHTML='';
});

it('shows a toast only after successfully issuing a report card',async()=>{
 request.mockResolvedValueOnce({id:18,version:2});
 expect(toast).not.toHaveBeenCalled();
 const result=await issueStudentReportCard({studentId:42,enrollmentId:7,term:1});
 expect(result).toEqual({id:18,version:2});
 expect(request).toHaveBeenCalledWith('students/42/issue_report_card','POST',
  {enrollment_id:7,term:1,layout:'school'});
 expect(toast).toHaveBeenCalledWith('Boleta v2 emitida correctamente.');
 expect(click).toHaveBeenCalledOnce();
 expect(document.querySelector('a[href*="/report_cards/18/download"]')).toBeNull();
 expect(window.location.pathname).toBe(initialPath);
});

it('does not show a success toast or download when PDF emission fails',async()=>{
 request.mockRejectedValueOnce(new Error('No fue posible generar la boleta'));
 await expect(issueStudentReportCard({studentId:42,enrollmentId:7,term:0}))
  .rejects.toThrow('No fue posible generar la boleta');
 expect(toast).not.toHaveBeenCalled();
 expect(click).not.toHaveBeenCalled();
});

it('initiates a PDF download without leaving a mounted link or changing the route',()=>{
 downloadIssuedReportCard(42,11);
 expect(click).toHaveBeenCalledOnce();
 const link=click.mock.instances[0] as HTMLAnchorElement;
 expect(link.getAttribute('href')).toBe('/api/students/42/report_cards/11/download');
 expect(link.download).toBe('');
 expect(link.isConnected).toBe(false);
 expect(window.location.pathname).toBe(initialPath);
});

it('confirms consultation only after acknowledgment succeeds',async()=>{
 request.mockResolvedValueOnce({acknowledged_at:'2026-10-31T15:00:00Z'});
 await acknowledgeStudentReportCard(42,11);
 expect(request).toHaveBeenCalledWith('students/42/report_cards/11/acknowledge','POST');
 expect(toast).toHaveBeenCalledWith('Consulta de boleta confirmada.');
 request.mockRejectedValueOnce(new Error('No autorizado'));
 await expect(acknowledgeStudentReportCard(42,12)).rejects.toThrow('No autorizado');
 expect(toast).toHaveBeenCalledTimes(1);
});
