// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {applyDisplaySettings,displayNotificationTitle,readDisplaySettings,schoolDate,schoolTime} from './displayPreferences';
afterEach(()=>localStorage.removeItem('school-preferences'));
it('applies accessible account appearance settings',()=>{
 applyDisplaySettings({high_contrast:true,large_text:true,reduce_motion:true,table_density:'compact',week_start:'sunday'});
 expect(document.documentElement.dataset.schoolContrast).toBe('true');
 expect(document.documentElement.dataset.schoolReduceMotion).toBe('true');
 expect(document.documentElement.dataset.schoolTableDensity).toBe('compact');
 expect(document.documentElement.dataset.schoolWeekStart).toBe('sunday');
});
it('hides notification titles when privacy is enabled',()=>{
 localStorage.setItem('school-preferences',JSON.stringify({hide_notification_previews:true}));
 expect(displayNotificationTitle('Sensitive event','es')).toBe('Vista previa oculta');
 expect(displayNotificationTitle('Sensitive event','en')).toBe('Notification preview hidden');
});
it('handles invalid stored preferences without crashing',()=>{
 localStorage.setItem('school-preferences','{broken');
 expect(readDisplaySettings()).toEqual({});
});
it('formats stored date and clock preferences',()=>{
 expect(schoolDate('2026-10-25T10:00:00Z','es',{date_format:'yyyy-mm-dd'})).toMatch(/^2026-10-/);
 expect(schoolTime('2026-10-25T10:00:00Z','en',{time_format:'12h'})).toMatch(/AM|PM/i);
});
