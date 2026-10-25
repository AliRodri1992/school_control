import {expect,it} from 'vitest';
import {previewBootStage,shouldShowBootPreview} from './bootPreview';

it('resolves only real loading stages without fabricating progress',()=>{
 expect(previewBootStage('')).toBe('connecting');
 expect(previewBootStage('?stage=modules')).toBe('modules');
 expect(previewBootStage('?stage=invalid')).toBe('connecting');
 expect(previewBootStage('?anything=yes&stage=modules')).toBe('modules');
});
it('exposes the isolated screen only at the exact development preview route',()=>{
 expect(shouldShowBootPreview(true,'/__preview/preparing')).toBe(true);
 expect(shouldShowBootPreview(false,'/__preview/preparing')).toBe(false);
 expect(shouldShowBootPreview(true,'/admin/dashboard')).toBe(false);
 expect(shouldShowBootPreview(true,'/__preview/preparing/extra')).toBe(false);
});
