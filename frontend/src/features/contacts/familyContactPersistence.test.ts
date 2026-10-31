import {expect,it} from 'vitest';
import {hasFamilyContactIdentityColumns,verifyFamilyContactSaved} from './familyContactPersistence';

const values={first_name:'María',middle_name:'Fernanda',paternal_surname:'Hernández',
 maternal_surname:'López',curp:'HELM850720MDFRRR01',relationship:'Madre',phone:'5512345678',email:null};
const stored={id:1,...values,name:'María Fernanda Hernández López'};

it('rejects old backend responses with missing separated identity fields',()=>{
 expect(hasFamilyContactIdentityColumns(stored)).toBe(true);
 expect(hasFamilyContactIdentityColumns({id:1,name:'María Fernanda Hernández López'})).toBe(false);
 expect(()=>verifyFamilyContactSaved({id:1,name:stored.name},values)).toThrow(/no conservó la identidad/);
});

it('confirms full server-persisted names and all separated fields',()=>{
 expect(()=>verifyFamilyContactSaved(stored,values)).not.toThrow();
 expect(()=>verifyFamilyContactSaved({...stored,first_name:null},values)).toThrow(/no conservó/);
 expect(()=>verifyFamilyContactSaved({...stored,name:'María Hernández'},values)).toThrow(/no conservó/);
});

it('allows missing optional names and generates the exact compact full name',()=>{
 const onlyRequired={...values,middle_name:null,maternal_surname:null};
 expect(()=>verifyFamilyContactSaved({...stored,...onlyRequired,name:'María Hernández'},onlyRequired)).not.toThrow();
});
