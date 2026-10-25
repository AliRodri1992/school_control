// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import TopbarClock from './TopbarClock';

afterEach(cleanup);
it('shows the school timezone and valid machine-readable time',()=>{
 render(<TopbarClock locale="es" timeZone="America/Mexico_City"/>);
 const stamp=screen.getByRole('time');
 expect(stamp.getAttribute('dateTime')).toBeTruthy();
 expect(screen.getByTitle('Zona horaria: America/Mexico_City')).toBeTruthy();
});
it('localizes the timezone description for English',()=>{
 render(<TopbarClock locale="en" timeZone="America/Mexico_City"/>);
 expect(screen.getByTitle('Time zone: America/Mexico_City')).toBeTruthy();
});

it('avoids repeatedly announcing clock changes to screen readers',()=>{
 const {container}=render(<TopbarClock locale="es" timeZone="America/Mexico_City"/>);
 expect(container.querySelector('time')?.getAttribute('aria-live')).toBe('off');
});
