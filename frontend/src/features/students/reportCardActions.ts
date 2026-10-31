import {api} from '../../api';
import {notify} from '../../notifications';

type ReportCardLayout='school'|'sep_reference';
type IssueOptions={
 studentId:number|string;
 enrollmentId:number|string;
 term:number;
 layout?:ReportCardLayout;
};

/** Download the server attachment without navigating away from the student record. */
export function downloadIssuedReportCard(studentId:number|string,issueId:number|string){
 const link=document.createElement('a');
 link.href='/api/students/'+encodeURIComponent(String(studentId))+
  '/report_cards/'+encodeURIComponent(String(issueId))+'/download';
 link.download='';
 link.style.display='none';
 document.body.appendChild(link);
 try{
  link.click();
 }finally{
  link.remove();
 }
}

/** The confirmation is temporary and only appears after successful emission. */
export async function issueStudentReportCard({studentId,enrollmentId,term,layout='school'}:IssueOptions){
 const issue=await api('students/'+studentId+'/issue_report_card','POST',
  {enrollment_id:enrollmentId,term,layout});
 downloadIssuedReportCard(studentId,issue.id);
 void notify('Boleta v'+issue.version+' emitida correctamente.');
 return issue;
}

export async function acknowledgeStudentReportCard(studentId:number|string,issueId:number|string){
 await api('students/'+studentId+'/report_cards/'+issueId+'/acknowledge','POST');
 void notify('Consulta de boleta confirmada.');
}
