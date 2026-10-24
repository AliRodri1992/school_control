import Combobox from './shared/components/Combobox';
import {useEffect, useState, type FormEvent} from 'react';
import {api} from './api';
import {notify} from './notifications';
import type {Row} from './modules';
export default function Messages({userId}:{userId:number}) {
 const [recipientId,setRecipientId]=useState('');
 const [messages,setMessages]=useState<Row[]>([]),[recipients,setRecipients]=useState<Row[]>([]);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[selected,setSelected]=useState<Row|null>(null);
 async function refresh(){const [items,people]=await Promise.all([api('messages'),api('messages/recipients')]);setMessages(items);setRecipients(people);}
 useEffect(()=>{void refresh().catch(e=>setError(e.message));},[]);
 async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();
 if(!recipientId){setError('Destinatario no puede estar vacío.');return;}
 const form=event.currentTarget;setBusy(true);setError('');try{await api('messages','POST',Object.fromEntries(new FormData(form)));form.reset();setRecipientId('');await refresh();void notify('Mensaje enviado correctamente.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function open(message:Row){setError('');try{const record=message.recipient_id===userId&&!message.read_at?await api(`messages/${message.id}/read`,'POST'):message;setSelected(record);await refresh();}catch(e){setError((e as Error).message);}}
 return <><div className="page-heading"><div><h1>Mensajería institucional</h1><p>Comunicación con tu comunidad y confirmación de lectura.</p></div></div>{error&&<p role="alert" className="error">{error}</p>}
 <section className="panel settings"><h2>Nuevo mensaje</h2><form onSubmit={send}><div className="form-grid"><div className="sc-form-dropdown"><label>Destinatario</label><Combobox label="Destinatario" value={recipientId}
 onChange={setRecipientId} placeholder="Seleccione una persona" options={recipients.map(person=>({value:String(person.id),label:person.name}))}/>
 <input type="hidden" name="recipient_id" value={recipientId}/></div><label>Asunto<input name="subject" required maxLength={200}/></label><label className="full">Mensaje<textarea name="body" required maxLength={10000}/></label></div><div className="form-actions"><button className="primary" disabled={busy||!recipients.length}>{busy?'Enviando…':'Enviar mensaje'}</button></div></form></section>
 <section className="panel table-panel"><div className="toolbar"><h2>Recibidos y enviados</h2><span>{messages.filter(x=>x.recipient_id===userId&&!x.read_at).length} sin leer</span></div><div className="table-scroll"><table><thead><tr><th>Asunto</th><th>De</th><th>Para</th><th>Lectura</th></tr></thead><tbody>{messages.map(message=><tr key={message.id}><td><button className="text-button" onClick={()=>void open(message)}>{message.subject}</button></td><td>{message.sender_name}</td><td>{message.recipient_name}</td><td>{message.read_at?new Date(message.read_at).toLocaleString('es-MX'):'Pendiente'}</td></tr>)}</tbody></table></div>{!messages.length&&<p className="empty">Todavía no tienes mensajes.</p>}<p className="footnote">Se muestran los últimos 200 mensajes.</p></section>
 {selected&&<div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="message-title"><header><h2 id="message-title">{selected.subject}</h2><button aria-label="Cerrar mensaje" onClick={()=>setSelected(null)}>Cerrar</button></header><p>De: {selected.sender_name} · Para: {selected.recipient_name}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{selected.body}</p></section></div>}</>;
}
