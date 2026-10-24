import {useEffect,useState} from 'react';
import {BookOpen,FileText,MapPin,Phone,Plus,Users,X} from 'lucide-react';
import {api} from '../../api';
import RecordForm from '../../shared/components/RecordForm';
import type {Field,Row} from '../../modules';
import {confirmDanger} from '../../notifications';

type Kind='addresses'|'phones'|'contacts'|'notes';
const category:{kind:Kind;title:string;description:string}[]=[
 {kind:'addresses',title:'Direcciones',description:'Domicilios vinculados al expediente'},
 {kind:'phones',title:'Teléfonos',description:'Medios de contacto internacionales'},
 {kind:'contacts',title:'Contactos',description:'Personas autorizadas y de emergencia'},
 {kind:'notes',title:'Notas',description:'Seguimiento institucional autorizado'}
];
const fields:Record<Kind,Field[]>={
 addresses:[
  {key:'country_code',label:'País ISO',type:'text'},
  {key:'purpose',label:'Propósito',options:[['home','Domicilio'],['fiscal','Fiscal'],['other','Otro']]},
  {key:'line1',label:'Calle y número'},{key:'line2',label:'Complemento',optional:true},
  {key:'neighborhood',label:'Colonia',optional:true},{key:'locality',label:'Localidad o municipio',optional:true},
  {key:'region',label:'Estado o región',optional:true},{key:'postal_code',label:'Código postal',optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 phones:[
  {key:'number_e164',label:'Teléfono internacional',type:'tel'},
  {key:'country_code',label:'País ISO',optional:true},
  {key:'purpose',label:'Tipo',options:[['mobile','Celular'],['home','Domicilio'],['work','Trabajo'],['emergency','Emergencia']]},
  {key:'extension',label:'Extensión',optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 contacts:[
  {key:'name',label:'Nombre de contacto'}, {key:'relationship',label:'Parentesco',optional:true},
  {key:'email',label:'Correo electrónico',type:'email',optional:true},
  {key:'emergency',label:'Contacto de emergencia',options:[['true','Sí'],['false','No']],optional:true},
  {key:'pickup_authorized',label:'Autorización de recogida',options:[['true','Sí'],['false','No']],optional:true},
  {key:'primary',label:'Principal',options:[['true','Sí'],['false','No']],optional:true}
 ],
 notes:[{key:'body',label:'Contenido de la nota',type:'textarea'}, {key:'category',label:'Categoría',optional:true}]
};
const icon:Record<Kind,typeof MapPin>={addresses:MapPin,phones:Phone,contacts:Users,notes:FileText};
function title(row:Row,kind:Kind):string{
 if(kind==='addresses')return row.line1||'Dirección';
 if(kind==='phones')return row.number_e164||'Teléfono';
 if(kind==='contacts')return row.name||'Contacto';
 return row.body?.slice(0,65)||'Nota';
}
export default function StudentDetails({student,onClose,canEdit,canWriteNotes}:{
 student:Row;onClose:()=>void;canEdit:boolean;canWriteNotes:boolean;
}){
 const [kind,setKind]=useState<Kind>('addresses'),[items,setItems]=useState<Row[]>([]);
 const [editing,setEditing]=useState<Row|null>(null),[creating,setCreating]=useState(false);
 const [error,setError]=useState(''),[fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
 const root='students/'+student.id+'/details/';
 async function fetchItems(selected:Kind){setLoading(true);
  try{setItems(await api(root+selected));setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}
 }
 useEffect(()=>{void fetchItems(kind);},[student.id,kind]);
 async function save(attrs:Row){setBusy(true);setError('');setFieldErrors({});
  try{
   await api(root+kind+(editing?'/'+editing.id:''),editing?'PATCH':'POST',attrs);
   setCreating(false);setEditing(null);await fetchItems(kind);
  }catch(e){const cause=e as Error & {fieldErrors?:Record<string,string[]>};setError(cause.message);setFieldErrors(cause.fieldErrors||{});}
  finally{setBusy(false);}
 }
 async function remove(row:Row){
  if(!await confirmDanger('Eliminar '+category.find(x=>x.kind===kind)?.title,'Esta información dejará de aparecer en el expediente.'))return;
  setBusy(true);setError('');
  try{await api(root+kind+'/'+row.id,'DELETE');await fetchItems(kind);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 const writable=canEdit&&(kind!=='notes'||canWriteNotes);
 return <div className="overlay sc-details-overlay"><section className="dialog sc-student-details" role="dialog" aria-modal="true" aria-label={'Expediente de '+student.full_name}>
  <header><div><span className="eyebrow">EXPEDIENTE / INFORMACIÓN RELACIONADA</span><h2>{student.full_name}</h2>
   <p>Direcciones, teléfonos, personas de contacto y notas del expediente.</p></div>
   <button type="button" aria-label="Cerrar expediente" onClick={onClose}><X size={20}/></button>
  </header>
  <div className="sc-details-tabs" role="tablist" aria-label="Secciones de expediente">
   {category.map(section=>{const Icon=icon[section.kind];return <button key={section.kind} role="tab" aria-selected={kind===section.kind} type="button"
     onClick={()=>{setKind(section.kind);setEditing(null);setCreating(false);}}><Icon size={17}/>{section.title}</button>;})}
  </div>
  <div className="sc-details-heading"><div><h3>{category.find(x=>x.kind===kind)?.title}</h3><p>{category.find(x=>x.kind===kind)?.description}</p></div>
    {writable&&!creating&&!editing&&<button className="primary" type="button" onClick={()=>{setCreating(true);setEditing(null);}}><Plus size={17}/>Agregar</button>}
  </div>
  {error&&<div className="error" role="alert">{error}</div>}
  {(creating||editing)&&<div className="sc-details-form"><RecordForm key={kind+'-'+(editing?.id||'new')} fields={fields[kind]} initial={editing||{}}
    onSubmit={values=>void save(values)} onCancel={()=>{setEditing(null);setCreating(false);setError('');}} busy={busy}
    options={()=>[]} optionName={x=>String(x.name||x.id)} error={error} fieldErrors={fieldErrors}/></div>}
  {!creating&&!editing&&<div className="sc-details-list" role="tabpanel">
   {loading?<p>Cargando información…</p>:items.length?items.map(row=><article className="sc-details-card" key={row.id}>
      <BookOpen size={20} color="#405cf5"/><div><strong>{title(row,kind)}</strong>
       <p>{kind==='addresses'?[row.locality,row.region,row.postal_code].filter(Boolean).join(' · '):kind==='phones'?row.purpose:kind==='contacts'?[row.relationship,row.email].filter(Boolean).join(' · '):row.category}</p>
      </div>
      {writable&&<div className="actions"><button className="text-button" onClick={()=>{setEditing(row);setFieldErrors({});}}>Editar</button>
       <button className="text-button danger" disabled={busy} onClick={()=>void remove(row)}>Eliminar</button></div>}
     </article>):<p className="sc-details-blank">No existen registros en esta sección. Puedes agregar información autorizada.</p>}
  </div>}
 </section></div>;
}
