/** Extracts a calendar-valid birth date from the YYMMDD portion of an 18-character CURP. */
export function birthDateFromCurp(input:string,today=new Date()):string|null{
 const curp=input.trim().toUpperCase();
 if(!/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(curp))return null;
 const yy=Number(curp.slice(4,6)),month=Number(curp.slice(6,8)),day=Number(curp.slice(8,10));
 // CURP century boundary: recent years use 2000; earlier dates use 1900.
 const currentYear=today.getFullYear();
 const year=(2000+yy<=currentYear?2000:1900)+yy;
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 const result=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const currentDate=`${currentYear}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 return result<=currentDate?result:null;
}
