// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Messages from './Messages';
import {api} from './api';
vi.mock('./api',()=>({api:vi.fn()}));
vi.mock('./notifications',()=>({notify:vi.fn()}));
const request=vi.mocked(api);
const message={id:1,recipient_id:4,sender_id:2,sender_name:'Docente',recipient_name:'Familia',subject:'Reunión',body:'Nos vemos el lunes',read_at:null};
beforeEach(()=>{request.mockReset();request.mockImplementation(async(path)=>path==='messages/recipients'?[{id:2,name:'Docente'}]:path.endsWith('/read')?{...message,read_at:'2026-10-21T12:00:00Z'}:[message]);});
afterEach(cleanup);
describe('Institutional messages',()=>{
 it('marks a received message as read only when opened',async()=>{render(<Messages userId={4}/>);expect(await screen.findByText('Reunión')).toBeTruthy();expect(request).not.toHaveBeenCalledWith('messages/1/read','POST');await userEvent.click(screen.getByRole('button',{name:'Leer mensaje: Reunión'}));expect(await screen.findByText('Nos vemos el lunes')).toBeTruthy();expect(request).toHaveBeenCalledWith('messages/1/read','POST');});
 it('does not mark the sender’s message as read',async()=>{render(<Messages userId={2}/>);await screen.findByText('Reunión');await userEvent.click(screen.getByRole('button',{name:'Leer mensaje: Reunión'}));expect(await screen.findByText('Nos vemos el lunes')).toBeTruthy();expect(request).not.toHaveBeenCalledWith('messages/1/read','POST');});
 it('sends selected recipient and entered message',async()=>{render(<Messages userId={4}/>);await screen.findByText('Reunión');await userEvent.click(screen.getByRole('combobox',{name:'Destinatario'}));await userEvent.click(screen.getByRole('option',{name:'Docente'}));await userEvent.type(screen.getByLabelText('Asunto'),'Pregunta');await userEvent.type(screen.getByLabelText('Mensaje'),'¿A qué hora?');await userEvent.click(screen.getByRole('button',{name:'Enviar mensaje'}));await waitFor(()=>expect(request).toHaveBeenCalledWith('messages','POST',{recipient_id:'2',subject:'Pregunta',body:'¿A qué hora?'}));});
 it('shows API failures instead of a false success',async()=>{request.mockRejectedValue(new Error('No autorizado'));render(<Messages userId={4}/>);expect(await screen.findByRole('alert')).toHaveProperty('textContent','No autorizado');});
});
