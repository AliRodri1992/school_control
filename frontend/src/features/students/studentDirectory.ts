import type {Row} from '../../modules';
/** Present short initials without exposing identifiers or assuming every row has a full name. */
export function studentInitials(student:Row):string{
 const name=String(student.full_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'').trim();
 const parts=name.split(/\s+/).filter(Boolean);
 return (parts.length>1?parts[0][0]+parts[parts.length-1][0]:(parts[0]||'A').slice(0,2)).toLocaleUpperCase('es-MX');
}
export function studentDirectoryStats(students:Row[]):{total:number;withCurp:number}{
 return {total:students.length,withCurp:students.filter(student=>String(student.curp||'').trim().length>0).length};
}
