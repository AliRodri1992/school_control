// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import SessionRestoreScreen from './SessionRestoreScreen';

afterEach(cleanup);
it('restores a session without showing the school construction scene or app chrome',()=>{
 const {container}=render(<SessionRestoreScreen locale="es"/>);
 expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
 expect(screen.getByText('Restaurando tu sesión…')).toBeTruthy();
 expect(screen.queryByText(/Preparando tu escuela/)).toBeNull();
 expect(container.querySelector('[data-boot-screen],#builder-auli,.sc-sidebar,.sc-topbar,aside,nav')).toBeNull();
});
it('offers the same unobtrusive loading state in English',()=>{
 render(<SessionRestoreScreen locale="en"/>);
 expect(screen.getByText('Restoring your session…')).toBeTruthy();
});
