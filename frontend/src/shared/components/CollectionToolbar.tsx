import Combobox from './Combobox';
export default function CollectionToolbar({title,query,onQuery,filter,onFilter,options,total}:{title:string;query:string;onQuery:(text:string)=>void;filter:string;onFilter:(value:string)=>void;options:{value:string;label:string}[];total:number}){
 return <div className="sc-collection-tools" role="search" aria-label={title}>
 <div className="sc-collection-tools-search"><label htmlFor={'search-'+title}>{'Buscar en '+title}</label><input id={'search-'+title} type="search" value={query} placeholder="Buscar por nombre, título o descripción…" onChange={e=>onQuery(e.target.value)}/></div>
 <div className="sc-collection-tools-filter"><label>{'Filtrar '+title}</label><Combobox label={'Filtrar '+title} value={filter} placeholder="Todos" searchable={options.length>7} onChange={onFilter} options={options}/></div>
 <span className="sc-collection-tools-count">{total} resultados</span>
 {(query||filter)&&<button type="button" className="secondary" onClick={()=>{onQuery('');onFilter('');}}>Limpiar filtros</button>}
 </div>;
}
