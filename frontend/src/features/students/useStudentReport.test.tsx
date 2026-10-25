// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {useStudentReport} from './useStudentReport';

afterEach(cleanup);

it('loads a boleta through a read-only request and never performs a save',async()=>{
 const report={student:{id:42,full_name:'Ana Pérez'},years:[]};
 const fetchReport=vi.fn(async(id:number|string)=>{expect(id).toBe(42);return report;});
 const {result}=renderHook(()=>useStudentReport(fetchReport));

 await act(async()=>{await result.current.open(42);});
 expect(fetchReport).toHaveBeenCalledOnce();
 expect(result.current.report).toEqual(report);
 expect(result.current.loadingStudentId).toBeNull();
 expect(result.current.error).toBe('');

 act(()=>result.current.close());
 expect(result.current.report).toBeNull();
});

it('shows an API error rather than reporting saved changes',async()=>{
 const fetchReport=vi.fn(async()=>{throw new Error('No se pudo consultar la boleta.');});
 const {result}=renderHook(()=>useStudentReport(fetchReport));

 await act(async()=>{await result.current.open(19);});
 expect(result.current.report).toBeNull();
 expect(result.current.error).toBe('No se pudo consultar la boleta.');
 expect(result.current.loadingStudentId).toBeNull();
 act(()=>result.current.clearError());
 expect(result.current.error).toBe('');
});

it('disables stale responses when a second student is requested',async()=>{
 let finishFirst:(report:{student:{id:number};years:unknown[]})=>void=()=>undefined;
 const fetchReport=vi.fn((id:number|string)=>id===1?
  new Promise<{student:{id:number};years:unknown[]}>(resolve=>{finishFirst=resolve;}):
  Promise.resolve({student:{id:2},years:[]}));
 const {result}=renderHook(()=>useStudentReport(fetchReport));

 let first!:Promise<void>;
 act(()=>{first=result.current.open(1);});
 await waitFor(()=>expect(result.current.loadingStudentId).toBe('1'));
 await act(async()=>{await result.current.open(2);});
 expect(result.current.report?.student.id).toBe(2);
 await act(async()=>{finishFirst({student:{id:1},years:[]});await first;});
 expect(result.current.report?.student.id).toBe(2);
});

it('does not reopen a report that was closed before its response arrived',async()=>{
 let finish:(report:{student:{id:number};years:unknown[]})=>void=()=>undefined;
 const fetchReport=()=>new Promise<{student:{id:number};years:unknown[]}>(resolve=>{finish=resolve;});
 const {result}=renderHook(()=>useStudentReport(fetchReport));
 let pending!:Promise<void>;
 act(()=>{pending=result.current.open(7);});
 act(()=>{result.current.close();});
 await act(async()=>{finish({student:{id:7},years:[]});await pending;});
 expect(result.current.report).toBeNull();
 expect(result.current.loadingStudentId).toBeNull();
});
