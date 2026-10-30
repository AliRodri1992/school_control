import {useState} from 'react';
import {ChevronLeft,ChevronRight,Filter,RotateCcw,Search,SlidersHorizontal} from 'lucide-react';
import Combobox from '../../shared/components/Combobox';
import {useSchoolLocale} from '../../shared/i18n/LocaleContext';

export type DetailKind='addresses'|'phones'|'contacts'|'notes';
export type CollectionFilters={query:string;type:string;flag:string;sort:'newest'|'oldest';page:number;perPage:number};
export type CollectionMeta={total:number;page:number;per_page:number;total_pages:number};
export const initialCollectionFilters:CollectionFilters={query:'',type:'',flag:'',sort:'newest',page:1,perPage:8};

const typeChoices:Record<DetailKind,{value:string;label:string}[]>={
 addresses:[{value:'home',label:'Domicilio'},{value:'fiscal',label:'Fiscal'},{value:'other',label:'Otro'}],
 phones:[{value:'mobile',label:'Celular'},{value:'home',label:'Domicilio'},{value:'work',label:'Trabajo'},{value:'emergency',label:'Emergencia'}],
 contacts:[],
 notes:[{value:'internal',label:'Solo personal autorizado'},{value:'shared',label:'Compartida con la familia'}]
};
const flagChoices:Record<DetailKind,{value:string;label:string}[]>={
 addresses:[{value:'primary',label:'Solo direcciones principales'}],
 phones:[{value:'primary',label:'Solo teléfonos principales'}],
 contacts:[{value:'emergency',label:'Contactos de emergencia'},{value:'pickup_authorized',label:'Recogida autorizada'},{value:'primary',label:'Contacto principal'}],
 notes:[]
};
const searchLabels:Record<DetailKind,string>={
 addresses:'Buscar calle, colonia o ubicación…',
 phones:'Buscar número o prefijo telefónico…',
 contacts:'Buscar nombre, parentesco o correo…',
 notes:'Buscar en las notas y categorías…'
};

export function collectionParams(filters:CollectionFilters):string{
 const params=new URLSearchParams({page:String(filters.page),per_page:String(filters.perPage),sort:filters.sort});
 if(filters.query.trim())params.set('q',filters.query.trim());
 if(filters.type)params.set('type',filters.type);
 if(filters.flag)params.set('flag',filters.flag);
 return params.toString();
}

export default function DetailCollectionControls({kind,filters,meta,onChange}:{
 kind:DetailKind;filters:CollectionFilters;meta:CollectionMeta;onChange:(next:CollectionFilters)=>void;
}){
 const {ui}=useSchoolLocale();
 const [advanced,setAdvanced]=useState(false);
 const active=Number(Boolean(filters.type))+Number(Boolean(filters.flag));
 const hasFilters=Boolean(filters.query||filters.type||filters.flag);
 const change=(patch:Partial<CollectionFilters>)=>onChange({...filters,...patch,page:1});
 return <div className="sc-details-list-tools">
  <div className="sc-details-list-toolbar">
   <label className="sc-details-list-search"><Search size={17} aria-hidden="true"/>
    <input type="search" aria-label={ui('Buscar registros')} value={filters.query}
     placeholder={ui(searchLabels[kind])} onChange={event=>change({query:event.target.value})}/>
   </label>
   <div className="sc-details-list-controls">
    <div className="sc-details-sort"><SlidersHorizontal size={16} aria-hidden="true"/>
     <Combobox searchable={false} label={ui('Ordenar registros')} value={filters.sort}
      onChange={value=>change({sort:value as CollectionFilters['sort']})}
      options={[{value:'newest',label:ui('Más recientes')},{value:'oldest',label:ui('Más antiguos')}]}/>
    </div>
    <button type="button" className={'secondary sc-details-filter-button'+(active?' is-active':'')}
     aria-expanded={advanced} aria-controls="sc-student-advanced-filters"
     onClick={()=>setAdvanced(open=>!open)}><Filter size={16}/>{ui('Filtros')}{active>0&&<span>{active}</span>}</button>
   </div>
  </div>
  {advanced&&<div id="sc-student-advanced-filters" className="sc-details-advanced-filters">
   <div className="sc-details-advanced-heading"><strong>{ui('Filtros de la sección')}</strong>
    <small>{ui('Refina los registros del expediente sin modificar sus datos.')}</small></div>
   {typeChoices[kind].length>0&&<div className="sc-details-filter-field"><span>{ui(kind==='notes'?'Visibilidad':'Tipo de registro')}</span>
    <Combobox searchable={false} label={ui(kind==='notes'?'Filtrar por visibilidad':'Filtrar por tipo')} value={filters.type}
     onChange={value=>change({type:value})} placeholder={ui('Todos')}
     options={typeChoices[kind].map(option=>({...option,label:ui(option.label)}))}/></div>}
   {flagChoices[kind].length>0&&<div className="sc-details-filter-field"><span>{ui('Características')}</span>
    <Combobox searchable={false} label={ui('Filtrar por características')} value={filters.flag}
     onChange={value=>change({flag:value})} placeholder={ui('Todas')}
     options={flagChoices[kind].map(option=>({...option,label:ui(option.label)}))}/></div>}
   {hasFilters&&<button type="button" className="secondary sc-details-clear-filter" onClick={()=>change({query:'',type:'',flag:''})}>
    <RotateCcw size={15}/>{ui('Limpiar filtros')}</button>}
  </div>}
  {hasFilters&&<div className="sc-details-filter-summary">
   <span>{meta.total} {ui(meta.total===1?'resultado encontrado':'resultados encontrados')}</span>
   {!advanced&&<button type="button" onClick={()=>change({query:'',type:'',flag:''})}>{ui('Limpiar filtros')}</button>}
  </div>}

 </div>;
}

export function DetailCollectionPagination({filters,meta,onChange}:{filters:CollectionFilters;meta:CollectionMeta;onChange:(next:CollectionFilters)=>void}){
 const {ui}=useSchoolLocale();
 const change=(patch:Partial<CollectionFilters>)=>onChange({...filters,...patch,page:1});
 const from=meta.total?(meta.page-1)*meta.per_page+1:0;
 const to=Math.min(meta.page*meta.per_page,meta.total);
 return meta.total>filters.perPage?<nav className="sc-details-pagination" aria-label={ui('Paginación de registros')}>
   <div className="sc-details-page-size"><span>{ui('Por página')}</span>
    <Combobox searchable={false} label={ui('Registros por página')} value={String(filters.perPage)}
     onChange={value=>change({perPage:Number(value)})}
     options={[8,16,24].map(count=>({value:String(count),label:String(count)}))}/></div>
   <span className="sc-details-page-summary">{from}–{to} {ui('de')} {meta.total}</span>
   <div className="sc-details-page-actions">
    <button type="button" className="secondary" aria-label={ui('Página anterior')} disabled={meta.page<=1}
     onClick={()=>onChange({...filters,page:Math.max(1,meta.page-1)})}><ChevronLeft size={17}/></button>
    <span>{meta.page} / {meta.total_pages}</span>
    <button type="button" className="secondary" aria-label={ui('Página siguiente')} disabled={meta.page>=meta.total_pages}
     onClick={()=>onChange({...filters,page:Math.min(meta.total_pages,meta.page+1)})}><ChevronRight size={17}/></button>
   </div>
  </nav>:null;
}
