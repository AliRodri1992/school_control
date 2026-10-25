import AuliGuide from './AuliGuide';
import {useSchoolLocale} from '../i18n/LocaleContext';

export type TableEmptyMode='empty'|'filtered'|'forbidden'|'error'|'loading';

type Props={
 mode?:TableEmptyMode;
 canCreate?:boolean;
 title?:string;
 description?:string;
 className?:string;
};

/**
 * Consistent mascot-led empty states for all school lists.
 * A successful empty result is different from a denied or failed request.
 */
export default function TableEmptyState({mode='empty',canCreate=true,title,description,className=''}:Props){
 const {locale,t}=useSchoolLocale();
 const english=locale.toLowerCase().startsWith('en');
 const fallback={
  empty:{
   title:english?'No records in this section yet.':'Todavía no hay registros en esta sección.',
   description:canCreate
    ?english?'You can add authorized information.':'Puedes agregar información autorizada.'
    :english?'Records will appear here when available.':'Los registros aparecerán aquí cuando estén disponibles.',
   mood:'thinking' as const
  },
  filtered:{
   title:english?'No matching records.':'No encontramos coincidencias.',
   description:english?'Try another search or clear your filters.':'Prueba con otra búsqueda o limpia los filtros.',
   mood:'thinking' as const
  },
  forbidden:{
   title:english?'Access restricted.':'Acceso restringido.',
   description:english?'Your role does not have permission to view these records.':'Tu rol no tiene permisos para consultar estos registros.',
   mood:'warning' as const
  },
  error:{
   title:english?'Unable to load records.':'No fue posible cargar los registros.',
   description:english?'Please try again.':'Intenta nuevamente.',
   mood:'error' as const
  },
  loading:{
   title:english?'Loading records…':'Cargando registros…',
   description:english?'Retrieving the information for this section.':'Consultando la información de esta sección.',
   mood:'thinking' as const
  }
 }[mode];
 return <div className={'empty sc-auli-empty sc-table-empty-state '+className}
   role={mode==='error'?'alert':'status'} data-empty-state={mode}>
  <AuliGuide compact mood={fallback.mood}
    title={title??t('table.'+mode+'.title',fallback.title)}
    text={description??t('table.'+mode+(mode==='empty'&&!canCreate?'.readonly':'')+'.description',fallback.description)}/>
 </div>;
}
