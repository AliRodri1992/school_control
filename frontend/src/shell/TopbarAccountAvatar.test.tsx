// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {TopbarAccountAvatar} from './TopbarAccountAvatar';

afterEach(cleanup);

it('shows the same first and last significant initials as the sidebar',()=>{
 const {container,rerender}=render(<TopbarAccountAvatar name="María González"/>);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('MG');
 rerender(<TopbarAccountAvatar name="Ana María López"/>);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('AL');
 rerender(<TopbarAccountAvatar name="José de la Cruz"/>);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('JC');
});

it('renders no image and keeps initials decorative because the parent button identifies the user',()=>{
 const {container}=render(<TopbarAccountAvatar name="María González"/>);
 const initials=container.querySelector('.sc-topbar-avatar-initials');
 expect(initials?.getAttribute('aria-hidden')).toBe('true');
 expect(container.querySelector('img')).toBeNull();
});

it('handles a single name or missing name consistently with the sidebar',()=>{
 const {container,rerender}=render(<TopbarAccountAvatar name="Élodie"/>);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('ÉL');
 rerender(<TopbarAccountAvatar name=""/>);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('US');
});

it('shows an uploaded account photo when supplied by the authenticated session',()=>{
 const {container}=render(<TopbarAccountAvatar name="María González" avatarUrl="/api/profile/avatar"/>);
 const photo=container.querySelector('img');
 expect(photo?.getAttribute('src')).toBe('/api/profile/avatar');
 expect(photo?.getAttribute('alt')).toBe('');
});

it('falls back to initials when a saved account photo cannot load',()=>{
 const {container}=render(<TopbarAccountAvatar name="María González" avatarUrl="/api/profile/avatar"/>);
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('img')).toBeNull();
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('MG');
});

it('recovers when a replacement profile image is uploaded after the previous one failed',()=>{
 const {container,rerender}=render(<TopbarAccountAvatar name="María González" avatarUrl="/first.png"/>);
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('.sc-topbar-avatar-initials')?.textContent).toBe('MG');
 rerender(<TopbarAccountAvatar name="María González" avatarUrl="/second.png"/>);
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/second.png');
});
