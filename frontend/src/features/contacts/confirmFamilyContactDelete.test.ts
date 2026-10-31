// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import Swal from 'sweetalert2';
import {confirmFamilyContactDelete,familyContactDeleteContent} from './confirmFamilyContactDelete';

vi.mock('sweetalert2',()=>({default:{
 fire:vi.fn(),isLoading:vi.fn(()=>false),showValidationMessage:vi.fn()
}}));
const sample={id:7,student_id:10,student_name:'Ana Gómez',name:'María López',relationship:'Madre',emergency:true,pickup_authorized:true,phone:'5512345678'};
const other={id:8,student_id:11,name:'Otra persona',emergency:true,pickup_authorized:true};
beforeEach(()=>{vi.clearAllMocks();});
afterEach(()=>{document.body.replaceChildren();});

it('identifies the person, pupil, both authorizations and last-contact risks',()=>{
 const element=familyContactDeleteContent(sample,[sample,other],'Ana Gómez');
 const text=element.textContent||'';
 expect(text).toContain('María López');
 expect(text).toContain('Ana Gómez');
 expect(text).toContain('Madre');
 expect(text).toContain('Emergencia');
 expect(text).toContain('Recogida autorizada');
 expect(text).toContain('único contacto de emergencia');
 expect(text).toContain('única persona autorizada para recoger');
 expect(element.querySelector('.sc-family-delete-summary')?.children).toHaveLength(2);
 expect(text).not.toContain('Revisa la información de la persona');
 expect(text).toContain('expediente');
 expect(text).toContain('No se puede deshacer.');
});

it('does not execute untrusted contact names as HTML',()=>{
 const contact={...sample,name:'<img src=x onerror=alert(1)>'};
 const element=familyContactDeleteContent(contact,[contact],'Ana');
 expect(element.textContent).toContain('<img src=x onerror=alert(1)>');
 expect(element.querySelector('img')).toBeNull();
});

it('omits irrelevant risk labels when the contact has no authorizations',()=>{
 const contact={...sample,emergency:false,pickup_authorized:false};
 const element=familyContactDeleteContent(contact,[contact],'Ana Gómez');
 expect(element.querySelector('.sc-family-delete-flags')).toBeNull();
 expect(element.textContent).not.toContain('único contacto de emergencia');
});

it('only executes the API mutation after a successful explicit confirmation',async()=>{
 const action=vi.fn().mockResolvedValue(undefined);
 vi.mocked(Swal.fire).mockImplementation(async options=>{
  const opts=options as unknown as {preConfirm:()=>Promise<unknown>};
  expect(opts.preConfirm).toBeTypeOf('function');
  expect(action).not.toHaveBeenCalled();
  await opts.preConfirm();
  return {isConfirmed:true} as Awaited<ReturnType<typeof Swal.fire>>;
 });
 expect(await confirmFamilyContactDelete(sample,[sample],'Ana Gómez',action)).toBe(true);
 expect(action).toHaveBeenCalledTimes(1);
 const opts=vi.mocked(Swal.fire).mock.calls[0][0] as unknown as {focusCancel:boolean;showLoaderOnConfirm:boolean;confirmButtonText:string;cancelButtonText:string};
 expect(opts.focusCancel).toBe(true);
 expect(opts.showLoaderOnConfirm).toBe(true);
 expect(opts.confirmButtonText).toBe('Sí, eliminar contacto');
 expect(opts.cancelButtonText).toBe('Conservar contacto');
 expect((opts as typeof opts & {width:number}).width).toBe(700);
});

it('keeps the alert open and displays the API error on failure',async()=>{
 const action=vi.fn().mockRejectedValue(new Error('El contacto está protegido.'));
 vi.mocked(Swal.fire).mockImplementation(async options=>{
  const result=await (options as unknown as {preConfirm:()=>Promise<boolean>}).preConfirm();
  expect(result).toBe(false);
  return {isConfirmed:false} as Awaited<ReturnType<typeof Swal.fire>>;
 });
 expect(await confirmFamilyContactDelete(sample,[sample],'Ana Gómez',action)).toBe(false);
 expect(Swal.showValidationMessage).toHaveBeenCalledWith(expect.stringContaining('El contacto está protegido.'));
});
