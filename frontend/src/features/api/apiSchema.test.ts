import {expect,it} from 'vitest';
import {example,fields,rules,request} from './apiSchema';
const schemas={TestInput:{type:'object',required:['name'],properties:{name:{type:'string',maxLength:100},state:{type:'string',enum:['active','inactive']}}}};
it('resolves fields and required constraints',()=>{const body={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/TestInput'}}}};const r=request(body);expect(r.media).toBe('application/json');expect(fields(r.schema,schemas).map(x=>[x.name,x.required])).toEqual([['name',true],['state',false]]);expect(example(r.schema,schemas)).toContain('"state"');});
it('does not fabricate undocumented fields',()=>{expect(example({type:'object',additionalProperties:true},schemas)).toBeNull();expect(rules({maxLength:100})).toEqual(['Longitud: 0–100']);});
