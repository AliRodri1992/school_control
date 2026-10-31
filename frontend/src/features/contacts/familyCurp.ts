/** Structural check only; a matching CURP is not proof of RENAPO registration. */
const alphabet='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
const states=new Set('AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TS TL VZ YN ZS NE'.split(' '));
const pattern=/^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

export type FamilyCurpDetails={birthDate:string;sex:'H'|'M'};
export function parseFamilyCurp(input:string,today=new Date()):FamilyCurpDetails|null{
 const value=input.trim().toUpperCase();
 if(!pattern.test(value)||!states.has(value.slice(11,13)))return null;
 const sum=[...value.slice(0,17)].reduce((total,char,index)=>total+alphabet.indexOf(char)*(18-index),0);
 if((10-sum%10)%10!==Number(value[17]))return null;
 const yy=Number(value.slice(4,6)),mm=Number(value.slice(6,8)),dd=Number(value.slice(8,10));
 const year=(/\d/.test(value[16])?1900:2000)+yy;
 const date=new Date(Date.UTC(year,mm-1,dd));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==mm-1||date.getUTCDate()!==dd)return null;
 const birthDate=[year,String(mm).padStart(2,'0'),String(dd).padStart(2,'0')].join('-');
 const todayIso=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 if(birthDate>todayIso)return null;
 return {birthDate,sex:value[10] as 'H'|'M'};
}
