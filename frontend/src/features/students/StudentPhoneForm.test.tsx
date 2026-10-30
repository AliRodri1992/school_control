// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentPhoneForm,{formatInternationalPhone} from './StudentPhoneForm';
afterEach(cleanup);
it('combines a selected dial prefix with digits for an international number',()=>{
 expect(formatInternationalPhone('MX','55 1234 5678')).toBe('+525512345678');
 expect(formatInternationalPhone('ES','612 345 678')).toBe('+34612345678');
});
it('renders an editable international phone with country and submits canonical values',async()=>{
 const onSubmit=vi.fn();
 render(<StudentPhoneForm initial={{number_e164:'+525512345678',country_code:'MX',purpose:'mobile',primary:true}}
 onSubmit={onSubmit} onCancel={vi.fn()} busy={false} error=""/>);
 expect(screen.getByRole('textbox',{name:/Número telefónico/})).toHaveProperty('value','5512345678');
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({number_e164:'+525512345678',country_code:'MX',primary:true}));
});
