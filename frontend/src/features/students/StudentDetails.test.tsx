// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
vi.mock('../../api',()=>({api:vi.fn(async()=>[])}));
vi.mock('../../notifications',()=>({notify:vi.fn(),confirmDanger:vi.fn(async()=>true)}));
import StudentDetails from './StudentDetails';
afterEach(cleanup);
it('renders a complete student record page instead of a dialog',async()=>{
 const close=vi.fn();
 render(<StudentDetails student={{id:42,full_name:'Ana Pérez',first_name:'Ana',curp:'PERA200101MDFRNN01',birth_date:'2020-01-01'}}
   onClose={close} canEdit={false} canWriteNotes={false}/>);
 expect(screen.getByRole('heading',{name:'Ana Pérez'})).toBeTruthy();
 expect(screen.queryByRole('dialog')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Contactos'}));
 expect(screen.getByRole('heading',{name:'Contactos'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Volver al directorio'}));
 expect(close).toHaveBeenCalledOnce();
});

it('shows an actionable empty state and meaningful contact cards',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockImplementation(async path=>path.endsWith('/contacts')?[]:[]);
 render(<StudentDetails student={{id:44,full_name:'Luis García'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Direcciones'}));
 expect(await screen.findByRole('heading',{name:'Aún no hay direcciones registradas'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Agregar dirección'}));
 expect(screen.getByText('Calle y número')).toBeTruthy();
});

it('offers a dedicated new-note form and hides searching on small option lists',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockResolvedValue([]);
 render(<StudentDetails student={{id:55,full_name:'Ana Pérez'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Notas'}));
 await userEvent.click(await screen.findByRole('button',{name:'Agregar nota'}));
 expect(screen.getByRole('heading',{name:'Agregar nota'})).toBeTruthy();
 await userEvent.click(screen.getByRole('combobox',{name:'Visibilidad'}));
 expect(screen.queryByRole('searchbox',{name:'Buscar en Visibilidad'})).toBeNull();
});

it('separates the section heading from the creation form for notes',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockResolvedValue([]);
 const {container}=render(<StudentDetails student={{id:58,full_name:'Sofía Ramos'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Notas'}));
 await userEvent.click(await screen.findByRole('button',{name:'Agregar nota'}));
 const section=container.querySelector('.sc-record-content-form-active');
 expect(section).toBeTruthy();
 expect(section?.querySelector(':scope > .sc-details-section-heading h2')?.textContent).toBe('Notas');
 expect(section?.querySelector(':scope > .sc-dossier-form-shell .sc-dossier-form-hero h3')?.textContent).toBe('Agregar nota');
});

it('renders operation heading as a connected panel above the form',async()=>{
 const {api}=await import('../../api');vi.mocked(api).mockResolvedValue([]);
 const {container}=render(<StudentDetails student={{id:105,full_name:'Elena Morales'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Teléfonos'}));
 await userEvent.click(await screen.findByRole('button',{name:'Agregar teléfono'}));
 const shell=container.querySelector('.sc-dossier-composed');
 expect(shell?.children[0]?.classList.contains('sc-dossier-form-hero')).toBe(true);
 expect(shell?.children[1]?.classList.contains('sc-dossier-form-body')).toBe(true);
});

it('shows Auli guidance when academic history does not yet exist',()=>{
 render(<StudentDetails student={{id:99,full_name:'Alumno de prueba',enrollment_stage:'applicant'}} onClose={vi.fn()} canEdit={false} canWriteNotes={false}/>);
 expect(screen.getByText('Trayectoria pendiente de inscripción')).toBeTruthy();
});

it('offers contextual list search and filters when student records exist',async()=>{
 const {api}=await import('../../api');
 vi.mocked(api).mockImplementation(async path=>{
  if(path.includes('/details/addresses?'))return {items:[{id:1,line1:'Calle Roble',country_code:'MX',purpose:'home',primary:true}],total:1,page:1,per_page:8,total_pages:1};
  return [];
 });
 render(<StudentDetails student={{id:205,full_name:'Pedro Flores'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Direcciones'}));
 expect(await screen.findByText('Calle Roble')).toBeTruthy();
 expect(screen.getByRole('searchbox',{name:'Buscar registros'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Filtros'}));
 expect(screen.getByRole('combobox',{name:'Filtrar por tipo'})).toBeTruthy();
 expect(screen.getByRole('combobox',{name:'Filtrar por características'})).toBeTruthy();
});


it('loads fresh persisted contact identity before editing instead of reusing stale card data',async()=>{
 const {api}=await import('../../api');
 const cached={id:12,name:'Nombre desactualizado',first_name:'Viejo',paternal_surname:'Nombre',
  curp:'',relationship:'Madre',legacy_phone:'5512345678',emergency:true,pickup_authorized:false,primary:false};
 const fresh={...cached,name:'María Elena Hernández López',first_name:'María',middle_name:'Elena',
  paternal_surname:'Hernández',maternal_surname:'López',curp:'SALS850720MDFLLF03'};
 vi.mocked(api).mockImplementation(async path=>{
  if(path.includes('/details/contacts?'))return {items:[cached],total:1,page:1,per_page:8,total_pages:1};
  if(path==='students/450/details/contacts/12')return fresh;
  return [];
 });
 render(<StudentDetails student={{id:450,full_name:'Andrea Hernández'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Contactos'}));
 expect(await screen.findByRole('heading',{name:'Viejo Nombre'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Editar'}));
 expect((await screen.findByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('María');
 expect((screen.getByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('Elena');
 expect((screen.getByLabelText(/Apellido paterno/) as HTMLInputElement).value).toBe('Hernández');
 expect((screen.getByLabelText(/Apellido materno/) as HTMLInputElement).value).toBe('López');
 expect(screen.getAllByText('María Elena Hernández López').length).toBeGreaterThan(0);
 expect(api).toHaveBeenCalledWith('students/450/details/contacts/12');
});


it('saves a student dossier contact and reopens persisted names including empty optional fields',async()=>{
 const {api}=await import('../../api');
 const chars='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
 const part='SALS850720MDFLLF0';
 const total=[...part].reduce((sum,char,index)=>sum+chars.indexOf(char)*(18-index),0);
 const curp=part+((10-total%10)%10);
 let persisted={
  id:41,name:'María Elena Salinas Lara',first_name:'María',middle_name:'Elena',
  paternal_surname:'Salinas',maternal_surname:'Lara',curp,
  legacy_phone:'5512345678',relationship:'Madre',email:'maria@example.test',
  emergency:true,pickup_authorized:false,primary:false
 };
 const detail='students/451/details/contacts/41';
 vi.mocked(api).mockImplementation(async(path,method='GET',payload)=>{
  if(path.includes('/details/contacts?')){
   return {items:[{...persisted}],total:1,page:1,per_page:8,total_pages:1};
  }
  if(path===detail&&method==='PATCH'){
   const values=payload as typeof persisted;
   persisted={...persisted,...values,name:[values.first_name,values.middle_name,
    values.paternal_surname,values.maternal_surname].filter(Boolean).join(' ')};
   return {...persisted};
  }
  if(path===detail&&method==='GET')return {...persisted};
  return [];
 });
 render(<StudentDetails student={{id:451,full_name:'Andrea Salinas'}} onClose={vi.fn()} canEdit canWriteNotes/>);
 await userEvent.click(screen.getByRole('button',{name:'Contactos'}));
 expect(await screen.findByRole('heading',{name:'María Elena Salinas Lara'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Editar'}));
 expect((await screen.findByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('Elena');
 await userEvent.clear(screen.getByLabelText(/Segundo nombre/));
 await userEvent.clear(screen.getByLabelText(/Apellido materno/));
 expect(screen.getAllByText('María Salinas').length).toBeGreaterThan(0);
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(await screen.findByRole('heading',{name:'María Salinas'},{timeout:5000})).toBeTruthy();
 expect(vi.mocked(api).mock.calls.some(([path,method])=>path===detail&&method==='PATCH')).toBe(true);
 expect(vi.mocked(api).mock.calls.filter(([path,method])=>path===detail&&method==='GET').length).toBeGreaterThanOrEqual(2);
 await userEvent.click(screen.getByRole('button',{name:'Editar'}));
 expect((await screen.findByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('María');
 expect((screen.getByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('');
 expect((screen.getByLabelText(/Apellido paterno/) as HTMLInputElement).value).toBe('Salinas');
 expect((screen.getByLabelText(/Apellido materno/) as HTMLInputElement).value).toBe('');
 expect((screen.getByLabelText(/CURP/) as HTMLInputElement).value).toBe(curp);
});


it('edits a mirrored family contact through the family API and reloads the dossier without losing identity',async()=>{
 const {api}=await import('../../api');
 const chars='0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ',part='SALS850720MDFLLF0';
 const sum=[...part].reduce((value,char,index)=>value+chars.indexOf(char)*(18-index),0);
 const curp=part+((10-sum%10)%10);
 let family={id:12,student_id:452,name:'Sofía Elena Salinas Lara',first_name:'Sofía',
  middle_name:'Elena',paternal_surname:'Salinas',maternal_surname:'Lara',curp,
  phone:'5512345678',relationship:'Abuela',email:'',emergency:true,pickup_authorized:true};
 const mirror=()=>({...family,id:77,legacy_student_contact_id:12,legacy_phone:family.phone,
  primary:false});
 vi.mocked(api).mockImplementation(async(path,method='GET',payload)=>{
  if(path.includes('students/452/details/contacts?')){
   return {items:[mirror()],total:1,page:1,per_page:8,total_pages:1};
  }
  if(path==='student_contacts/12'&&method==='PATCH'){
   family={...family,...(payload as typeof family),
    name:[(payload as typeof family).first_name,(payload as typeof family).middle_name,
     (payload as typeof family).paternal_surname,(payload as typeof family).maternal_surname
    ].filter(Boolean).join(' ')};
   return {...family};
  }
  if(path==='student_contacts/12'&&method==='GET')return {...family};
  return [];
 });
 render(<StudentDetails student={{id:452,full_name:'Andrea Salinas'}} onClose={vi.fn()}
  canEdit canWriteNotes canManageFamilyContacts/>);
 await userEvent.click(screen.getByRole('button',{name:'Contactos'}));
 expect(await screen.findByRole('heading',{name:'Sofía Elena Salinas Lara'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Editar'}));
 expect((await screen.findByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('Sofía');
 await userEvent.clear(screen.getByLabelText(/Segundo nombre/));
 await userEvent.clear(screen.getByLabelText(/Apellido materno/));
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(await screen.findByRole('heading',{name:'Sofía Salinas'},{timeout:5000})).toBeTruthy();
 expect(vi.mocked(api).mock.calls.some(([path,method])=>path==='student_contacts/12'&&method==='PATCH')).toBe(true);
 await userEvent.click(screen.getByRole('button',{name:'Editar'}));
 expect((await screen.findByLabelText(/Primer nombre/) as HTMLInputElement).value).toBe('Sofía');
 expect((screen.getByLabelText(/Segundo nombre/) as HTMLInputElement).value).toBe('');
 expect((screen.getByLabelText(/Apellido paterno/) as HTMLInputElement).value).toBe('Salinas');
 expect((screen.getByLabelText(/Apellido materno/) as HTMLInputElement).value).toBe('');
});
