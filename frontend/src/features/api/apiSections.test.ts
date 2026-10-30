import {describe,expect,it} from 'vitest';
import {apiSectionFor,apiSectionCounts,filterApiEntries} from './apiSections';
const entries=[{path:'/api/students',verb:'get',operation:{tags:['students'],summary:'List students'}},{path:'/api/grades',verb:'post',operation:{tags:['grades'],summary:'Add grade'}},{path:'/api/users',verb:'get',operation:{tags:['users'],summary:'Users'}}];
describe('API documentation sections',()=>{
 it('groups endpoints into functional areas',()=>{expect(apiSectionFor(['students'])).toBe('students');expect(apiSectionFor(['grades'])).toBe('assessment');expect(apiSectionFor(['users'])).toBe('administration');});
 it('counts all operations and allows searching in a section',()=>{expect(apiSectionCounts(entries)).toMatchObject({all:3,students:1,assessment:1,administration:1});expect(filterApiEntries(entries,'students','STUDENTS')).toHaveLength(1);expect(filterApiEntries(entries,'assessment','users')).toHaveLength(0);});
});
