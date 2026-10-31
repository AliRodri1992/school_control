// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplicantRegistration,{applicantStepIssues,preferredApplicantRecord,applicantDocumentState} from './ApplicantRegistration';
import {api} from '../../api';
import {readFileSync} from 'node:fs';
const applicantStyles=readFileSync(new URL('../../styles/applicant-registration.css',import.meta.url),'utf8');
vi.mock('../../api',()=>({api:vi.fn()}));
vi.mock('../../notifications',()=>({confirmDanger:vi.fn(async()=>true)}));
afterEach(()=>{cleanup();vi.mocked(api).mockReset();});
it('saves applicant stages on the server before submitting their application',async()=>{
 vi.mocked(api).mockImplementation(async (path,method)=>{
  if(path==='students'&&method==='POST')return {id:12,full_name:'Sara Prueba'};
  if(path==='admissions'&&method==='POST')return {id:34,student_id:12,academic_year_id:5,grade_level:1,status:'draft',folio:null};
  if(path.startsWith('admission_document_requirements'))return [];
  if(path.endsWith('/readiness'))return {status:'draft',missing_for_submission:[],missing_for_formalization:[]};
  if(path.includes('/details/addresses'))return {id:1};
  if(path.includes('/details/phones'))return {id:2};
  if(path==='student_contacts')return {id:3};
  return {id:34,status:'submitted',folio:'ESC-TEST'};
 });
 const onClose=vi.fn(),onSaved=vi.fn(async()=>undefined);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={onClose} onSaved={onSaved}/>);
 await userEvent.type(screen.getByLabelText('Nombre(s) *'),'Sara');
 await userEvent.type(screen.getByLabelText('Primer apellido *'),'Prueba');
 await userEvent.type(screen.getByLabelText('CURP *'),'DEMO200101MDFRNN01');
 fireEvent.change(screen.getByLabelText('Fecha de nacimiento *'),{target:{value:'2020-01-01'}});
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Domicilio'})).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Calle y número exterior *'),'Calle Demo 12');
 await userEvent.type(screen.getByLabelText('Municipio o alcaldía *'),'Demo');
 await userEvent.type(screen.getByLabelText('Estado *'),'México');
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Teléfonos'})).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Teléfono de emergencia con código internacional *'),'+525555555555');
 await userEvent.click(screen.getByRole('combobox',{name:'País y prefijo'}));
 await userEvent.click(screen.getByRole('option',{name:/Estados Unidos/}));
 expect(screen.getByLabelText('Teléfono de emergencia con código internacional *')).toHaveProperty('value','+15555555555');
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(api).toHaveBeenCalledWith('students/12/details/phones','POST',expect.objectContaining({country_code:'US',number_e164:'+15555555555'}));
 expect(await screen.findByRole('heading',{name:'Familiares'})).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Nombre del familiar *'),'Tutor de prueba');
 await userEvent.click(screen.getByRole('combobox',{name:'Parentesco'}));
 await userEvent.click(screen.getByRole('option',{name:'Madre'}));
 await userEvent.type(screen.getByLabelText('Teléfono de contacto *'),'5512345678');
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Documentos'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Revisión y envío'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud'}));
 expect(api).toHaveBeenCalledWith('admissions/34/submit','POST');
 expect(onClose).toHaveBeenCalled();
});

it('fills birth date automatically from a complete valid CURP',async()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>undefined)}/>);
 await userEvent.type(screen.getByLabelText('CURP *'),'DEMO200101MDFRNN01');
 expect(screen.getByLabelText('Fecha de nacimiento *')).toHaveProperty('value','2020-01-01');
 const dateInput=screen.getByLabelText('Fecha de nacimiento *');
 const dateGroup=dateInput.closest('.sc-applicant-birthdate-group');
 const curpGroup=screen.getByLabelText('CURP *').closest('.sc-applicant-curp-group');
 const dateHint=screen.getByText(/Fecha sugerida por la CURP/);
 expect(dateGroup).not.toBeNull();
 expect(curpGroup).not.toBeNull();
 expect(dateGroup?.contains(dateHint)).toBe(true);
 expect(dateGroup?.parentElement).toBe(curpGroup?.parentElement);
 expect(dateInput.getAttribute('aria-describedby')).toContain('applicant-birthdate-feedback');
 expect(screen.getByLabelText('CURP *').getAttribute('aria-describedby')).toContain('applicant-curp-feedback');
 expect(dateGroup?.parentElement?.querySelector(':scope > .sc-applicant-curp-hint')).toBeNull();
});

it('shows Auli guidance and a progress indicator for the first step',()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>undefined)}/>);
 expect(screen.getByAltText('Auli, mascota de School Control')).toBeTruthy();
 expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
 expect(screen.getByText('Datos personales')).toBeTruthy();
 expect(screen.getByText('Auli recomienda')).toBeTruthy();
});
it('offers an international phone country dropdown and field-specific errors',async()=>{
 vi.mocked(api).mockImplementation(async (path,method)=>{
  if(path==='students'&&method==='POST')return {id:12,full_name:'Sara Prueba'};
  if(path==='admissions'&&method==='POST')return {id:34,student_id:12,academic_year_id:5,grade_level:1,status:'draft'};
  return [];
 });
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>undefined)}/>);
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByText('Nombre(s): Es obligatorio')).toBeTruthy();
 await userEvent.type(screen.getByLabelText(/Nombre\(s\) \*/),'Sara');
 await userEvent.type(screen.getByLabelText(/Primer apellido \*/),'Prueba');
 await userEvent.type(screen.getByLabelText(/CURP \*/),'DEMO200101MDFRNN01');
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Domicilio'})).toBeTruthy();
});

it('shows a private academic record, a six-stage stepper and an accessible draft state',()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>undefined)}/>);
 expect(screen.getByRole('heading',{name:'Registro de aspirante'})).toBeTruthy();
 expect(screen.getByText('Tu expediente')).toBeTruthy();
 expect(screen.getByText('Expediente privado')).toBeTruthy();
 expect(screen.getByRole('navigation',{name:'Etapas del registro'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Ir a Revisión y envío'})).toHaveProperty('disabled',true);
 expect(screen.getByRole('progressbar',{name:'Avance guardado del registro'}).getAttribute('aria-valuenow')).toBe('0');
});
it('validates fields by the active section, without mixing data from other steps',()=>{
 expect(applicantStepIssues(0,{first_name:'',last_name:'',curp:'',birth_date:'',academic_year_id:''},null)).toMatchObject({first_name:'Es obligatorio',last_name:'Es obligatorio',curp:'Es obligatorio'});
 expect(applicantStepIssues(1,{line1:'Calle 1',locality:'México',region:'México',postal_code:'12'},null)).toMatchObject({postal_code:'Introduce un código postal de 5 dígitos'});
 expect(applicantStepIssues(2,{number_e164:'5512345678'},null)).toMatchObject({number_e164:'Introduce un número internacional válido'});
 expect(applicantStepIssues(3,{contact_name:'Madre',relationship:'madre',contact_phone:'5551234567',contact_email:'wrong'},null)).toMatchObject({contact_email:'Introduce un correo válido'});
});

it('prevents a CURP and birth date mismatch before creating the record',()=>{
 expect(applicantStepIssues(0,{
  first_name:'Sara',last_name:'Prueba',curp:'DEMO200101MDFRNN01',
  birth_date:'2021-01-01',academic_year_id:'5'
 },'2020-01-01')).toMatchObject({birth_date:'La fecha no coincide con la CURP'});
});
it('chooses primary purpose records and preserves reviewed document statuses',()=>{
 const rows=[{id:1,purpose:'work',primary:false},{id:2,purpose:'home',primary:true}];
 expect(preferredApplicantRecord(rows,'home')?.id).toBe(2);
 expect(applicantDocumentState([
  {id:1,title:'Acta',status:'correction_requested'},
  {id:2,title:'Acta',status:'approved'}], 'Acta')?.status).toBe('approved');
});
it('saves a filled identity before exiting instead of silently losing changes',async()=>{
 vi.mocked(api).mockImplementation(async(path,method)=>{
  if(path==='students'&&method==='POST')return {id:12,full_name:'Sara Prueba'};
  if(path==='admissions'&&method==='POST')return {id:34,student_id:12,academic_year_id:5,grade_level:1,status:'draft'};
  return [];
 });
 const close=vi.fn();
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={close} onSaved={vi.fn(async()=>{})}/>);
 await userEvent.type(screen.getByLabelText('Nombre(s) *'),'Sara');
 await userEvent.type(screen.getByLabelText('Primer apellido *'),'Prueba');
 await userEvent.type(screen.getByLabelText('CURP *'),'DEMO200101MDFRNN01');
 await userEvent.click(screen.getByRole('button',{name:'Guardar borrador y salir'}));
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1));
 expect(api).toHaveBeenCalledWith('students','POST',expect.objectContaining({first_name:'Sara',birth_date:'2020-01-01'}));
 expect(api).toHaveBeenCalledWith('admissions','POST',expect.objectContaining({draft:true}));
});
it('deletes persisted secondary family contacts through the API',async()=>{
 vi.mocked(api).mockImplementation(async(path,method)=>{
  if(path.endsWith('/details/addresses'))return [{id:11,purpose:'home',primary:true,line1:'Calle 1'}];
  if(path.endsWith('/details/phones'))return [{id:12,purpose:'emergency',primary:true,country_code:'MX',number_e164:'+525512345678'}];
  if(path==='student_contacts'&&(!method||method==='GET'))return [
   {id:15,student_id:10,name:'Madre',relationship:'Madre',phone:'5512345678',emergency:true},
   {id:16,student_id:10,name:'Tía',relationship:'Tía',phone:'5512349999',emergency:false}];
  if(path==='student_documents')return [];
  if(path.startsWith('admission_document_requirements'))return [];
  return {};
 });
 render(<ApplicantRegistration existing={{id:10,first_name:'Sara',last_name:'Prueba',curp:'DEMO200101MDFRNN01',birth_date:'2020-01-01'}}
  admissions={[{id:25,student_id:10,academic_year_id:5,grade_level:1,status:'draft'}]}
  years={[{id:5,name:'2026-2027'}]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 await waitFor(()=>expect(screen.getByRole('button',{name:'Ir a Familiares'}).hasAttribute('disabled')).toBe(false));
 await userEvent.click(screen.getByRole('button',{name:'Ir a Familiares'}));
 expect(await screen.findByText('Familiar adicional 1')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Eliminar familiar adicional 1'}));
 await waitFor(()=>expect(api).toHaveBeenCalledWith('student_contacts/16','DELETE'));
 await waitFor(()=>expect(screen.queryByText('Familiar adicional 1')).toBeNull());
});

it('keeps the untouched CURP field clean, without a redundant empty status',()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 expect(screen.getByLabelText('CURP *')).toBeTruthy();
 expect(screen.queryByText(/CURP: Sin capturar/)).toBeNull();
 expect(screen.queryByText(/Sin capturar/)).toBeNull();
 expect(screen.queryByText(/Fecha identificada/)).toBeNull();
 expect(screen.getByLabelText('CURP *').getAttribute('aria-describedby')).toBeNull();
});
it('keeps CURP validation specific and only shows feedback after typing',async()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 const field=screen.getByLabelText('CURP *');
 await userEvent.type(field,'DEMO');
 expect(screen.getByText('Faltan 14 caracteres')).toBeTruthy();
 expect(screen.queryByText(/CURP: Faltan/)).toBeNull();
 expect(field.getAttribute('aria-describedby')).toContain('applicant-curp-feedback');
 await userEvent.type(field,'200101MDFRNN01');
 expect(screen.getByText('Fecha identificada')).toBeTruthy();
 const hint=screen.getByText(/Fecha sugerida por la CURP/);
 expect(hint.closest('.sc-applicant-birthdate-group')).not.toBeNull();
});
it('uses one complete six-stage navigation at all widths with descriptive states',()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 const navigation=screen.getByRole('navigation',{name:'Etapas del registro'});
 expect(navigation.querySelectorAll('ol > li')).toHaveLength(6);
 expect(navigation.querySelectorAll('ol > li.is-current')).toHaveLength(1);
 expect(navigation.querySelectorAll('ol > li.is-locked')).toHaveLength(5);
 expect(navigation.querySelectorAll('ol > li.is-done')).toHaveLength(0);
 expect(screen.getAllByRole('progressbar',{name:'Avance guardado del registro'})).toHaveLength(1);
 expect(screen.queryByRole('navigation',{name:'Navegar entre las etapas del registro'})).toBeNull();
 expect(screen.getByRole('button',{name:'Ir a Identidad'}).hasAttribute('disabled')).toBe(false);
 expect(screen.getByRole('button',{name:'Ir a Domicilio'}).hasAttribute('disabled')).toBe(true);
});
it('does not mark the document stage as saved before the user visits it',async()=>{
 vi.mocked(api).mockImplementation(async(path,method)=>{
  if(path==='students'&&method==='POST')return{id:12,full_name:'Sara Prueba'};
  if(path==='admissions'&&method==='POST')return{id:34,student_id:12,academic_year_id:5,grade_level:1,status:'draft'};
  if(path.startsWith('admission_document_requirements'))return[];
  return{id:30};
 });
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 await userEvent.type(screen.getByLabelText('Nombre(s) *'),'Sara');
 await userEvent.type(screen.getByLabelText('Primer apellido *'),'Prueba');
 await userEvent.type(screen.getByLabelText('CURP *'),'DEMO200101MDFRNN01');
 await userEvent.click(screen.getByRole('button',{name:'Guardar y continuar'}));
 expect(await screen.findByRole('heading',{name:'Domicilio'})).toBeTruthy();
 expect(screen.getByRole('progressbar',{name:'Avance guardado del registro'}).getAttribute('aria-valuenow')).toBe('17');
 const nav=screen.getByRole('navigation',{name:'Etapas del registro'});
 expect(nav.querySelectorAll('li.is-done')).toHaveLength(1);
 expect(screen.getByRole('button',{name:'Ir a Documentos'}).closest('li')?.className).toContain('is-locked');
});

it('uses clear step numbers and no circular progress symbols or decorative header dots',()=>{
 vi.mocked(api).mockResolvedValue([]);
 render(<ApplicantRegistration years={[{id:5,name:'2026-2027'}]} admissions={[]} onClose={vi.fn()} onSaved={vi.fn(async()=>{})}/>);
 const steps=screen.getByRole('navigation',{name:'Etapas del registro'});
 expect(steps.querySelectorAll('ol li')).toHaveLength(6);
 expect(steps.querySelectorAll('.sc-applicant-progress-index')).toHaveLength(0);
 expect(steps.querySelectorAll('.sc-applicant-progress-ordinal')).toHaveLength(6);
 expect([...steps.querySelectorAll('.sc-applicant-progress-ordinal')].map(element=>element.textContent))
  .toEqual(['01','02','03','04','05','06']);
 expect(steps.querySelectorAll('ol li button svg')).toHaveLength(0);
 expect(screen.getByRole('button',{name:'Ir a Identidad'}).textContent).toContain('En curso');
 expect(screen.getByRole('button',{name:'Ir a Domicilio'}).textContent).toContain('Pendiente');
 expect(document.querySelectorAll('.sc-applicant-eyebrow-dot')).toHaveLength(0);
 expect(document.querySelectorAll('.sc-applicant-hero-state > span')).toHaveLength(0);
});

it('does not style arbitrary step content as a circular progress marker',()=>{
 expect(applicantStyles).not.toMatch(/\.sc-applicant-progress\s+li\s*>\s*button\s*>\s*span\s*\{/);
 expect(applicantStyles).not.toMatch(/\.sc-applicant-progress\s+li\s*>\s*span\s*\{/);
 expect(applicantStyles).toContain('.sc-applicant-progress li>button>.sc-applicant-progress-text');
});
