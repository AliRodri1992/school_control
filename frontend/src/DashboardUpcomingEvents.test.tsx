// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import DashboardUpcomingEvents from './DashboardUpcomingEvents';

it('renders a dated, ordered agenda with readable hours',()=>{
 const future=new Date(Date.now()+86400000*10);
 const later=new Date(future.getTime()+3600000);
 const {container}=render(<DashboardUpcomingEvents locale="es" empty={<div>Sin eventos</div>}
  events={[{id:1,title:'Reunión de bienvenida',starts_at:future.toISOString(),ends_at:later.toISOString()}]}/>);
 expect(screen.getByText('Reunión de bienvenida')).toBeTruthy();
 expect(screen.getByText('PRÓXIMO EVENTO')).toBeTruthy();
 expect(screen.getByText('1 evento')).toBeTruthy();
 expect(container.querySelector('.sc-event-date strong')?.textContent).toBeTruthy();
 expect(container.querySelector('.sc-event-time')?.textContent).toContain('–');
});
it('preserves the supplied empty state when there are no future events',()=>{
 render(<DashboardUpcomingEvents locale="es" empty={<div>Agenda vacía</div>} events={[]}/>);
 expect(screen.getByText('Agenda vacía')).toBeTruthy();
});
it('sorts future events chronologically and ignores expired events',()=>{
 const t=Date.now();
 const item=(id:number,day:number)=>({id,title:'Evento '+id,starts_at:new Date(t+day*86400000).toISOString(),
  ends_at:new Date(t+day*86400000+3600000).toISOString()});
 const {container}=render(<DashboardUpcomingEvents locale="es" empty={<div>Vacío</div>}
  events={[item(2,4),item(1,2),item(3,-3)]}/>);
 expect([...container.querySelectorAll('.sc-event-title')].map(n=>n.textContent)).toEqual(['Evento 1','Evento 2']);
});
