import type {Row} from '../../modules';
import {familyContactFullName} from './EditFamilyContactForm';

const keys=['first_name','middle_name','paternal_surname','maternal_surname','curp','relationship','phone','email'] as const;
const normalized=(value:unknown)=>String(value??'').trim().replace(/\s+/g,' ');

export function hasFamilyContactIdentityColumns(row:Row):boolean{
 return ['first_name','middle_name','paternal_surname','maternal_surname','curp']
  .every(key=>Object.prototype.hasOwnProperty.call(row,key));
}


export function familyContactDisplayName(row:Row):string{
 const structured=familyContactFullName({
  first_name:normalized(row.first_name),middle_name:normalized(row.middle_name),
  paternal_surname:normalized(row.paternal_surname),maternal_surname:normalized(row.maternal_surname)
 });
 return structured||String(row.name||'Sin nombre').trim();
}

/** Verify both write-response and a new DB read before reporting success. */
export function verifyFamilyContactSaved(saved:Row,values:Row):void{
 const fullName=familyContactFullName({
  first_name:normalized(values.first_name),middle_name:normalized(values.middle_name),
  paternal_surname:normalized(values.paternal_surname),maternal_surname:normalized(values.maternal_surname)
 });
 const fieldValue=(key:typeof keys[number],value:unknown)=>{
  const text=normalized(value);
  return key==='email'?text.toLowerCase():key==='curp'?text.toUpperCase():text;
 };
 const matches=keys.every(key=>fieldValue(key,saved?.[key])===fieldValue(key,values[key])) &&
   normalized(saved?.name)===fullName;
 if(!matches){
  throw new Error('El servidor no conservó la identidad del familiar. No se confirmó el guardado. Actualiza el backend y ejecuta la migración de contactos familiares.');
 }
}
