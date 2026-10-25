import {useEffect,useRef,useState} from 'react';
import type {Row} from '../../modules';

type FetchStudentReport=(studentId:number|string)=>Promise<Row>;

/** Read-only report access: never triggers a save, mutation toast, or catalog refresh. */
export function useStudentReport(fetchStudentReport:FetchStudentReport){
 const [report,setReport]=useState<Row|null>(null);
 const [loadingStudentId,setLoadingStudentId]=useState<string|null>(null);
 const [error,setError]=useState('');
 const requestId=useRef(0);

 useEffect(()=>()=>{requestId.current+=1;},[]);

 async function open(studentId:number|string){
  const current=++requestId.current;
  setReport(null);
  setError('');
  setLoadingStudentId(String(studentId));
  try{
   const result=await fetchStudentReport(studentId);
   if(requestId.current===current)setReport(result);
  }catch(cause){
   if(requestId.current===current){
    setError(cause instanceof Error?cause.message:'No fue posible consultar la boleta.');
   }
  }finally{
   if(requestId.current===current)setLoadingStudentId(null);
  }
 }

 function close(){
  requestId.current+=1;
  setReport(null);
  setLoadingStudentId(null);
  setError('');
 }

 return {report,loadingStudentId,error,open,close,clearError:()=>setError('')};
}
