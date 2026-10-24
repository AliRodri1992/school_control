import {useEffect,useState} from 'react';
import {api} from './api';
import type {Row} from './modules';
export default function Notifications({navigate}:{navigate:(page:string)=>void}) {
 const [items,setItems]=useState<Row[]>([]),[unread,setUnread]=useState(0),[error,setError]=useState('');
 async function refresh(){const result=await api('notifications');setItems(result.items);setUnread(result.unread_count);}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[]);
 async function open(item:Row){try{await api(`notifications/${item.id}/read`,'POST');await refresh();navigate(item.page);}catch(e){setError((e as Error).message);}}
 return <><div className="page-heading"><div><h1>Centro de notificaciones</h1><p>{unread} sin leer</p></div></div>{error&&<p role="alert" className="error">{error}</p>}<section className="panel settings">{items.map(item=><article key={item.id}><button className="text-button" onClick={()=>void open(item)}>{!item.read_at?'● ':''}{item.title}</button><p>{new Date(item.created_at).toLocaleString('es-MX')}</p></article>)}{!items.length&&<p>No tienes notificaciones.</p>}</section></>;
}
