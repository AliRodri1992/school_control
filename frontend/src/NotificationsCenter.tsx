import TableEmptyState from './shared/components/TableEmptyState';
import {useSchoolLocale} from './shared/i18n/LocaleContext';
import {useEffect,useState} from 'react';
import {api} from './api';
import type {Row} from './modules';
export default function Notifications({navigate}:{navigate:(page:string)=>void}) {
 const {ui,locale}=useSchoolLocale();
 const [loaded,setLoaded]=useState(false);
 const [fetchFailed,setFetchFailed]=useState(false);
 const [items,setItems]=useState<Row[]>([]),[unread,setUnread]=useState(0),[error,setError]=useState('');
 async function refresh(){try{const result=await api('notifications');setItems(result.items);setUnread(result.unread_count);setFetchFailed(false);}catch(cause){setFetchFailed(true);throw cause;}finally{setLoaded(true);}}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[]);
 async function open(item:Row){try{await api(`notifications/${item.id}/read`,'POST');await refresh();navigate(item.page);}catch(e){setError((e as Error).message);}}
 return <><div className="page-heading"><div><h1>{ui("Centro de notificaciones")}</h1><p>{unread} {locale==='en'?'unread':'sin leer'}</p></div></div>{error&&<p role="alert" className="error">{error}</p>}<section className="panel settings">{items.map(item=><article key={item.id}><button className="text-button" onClick={()=>void open(item)}>{!item.read_at?'● ':''}{item.title}</button><p>{new Date(item.created_at).toLocaleString(locale==='en'?'en-US':'es-MX')}</p></article>)}{!items.length&&<TableEmptyState mode={fetchFailed?'error':loaded?'empty':'loading'} canCreate={false}/>}</section></>;
}
