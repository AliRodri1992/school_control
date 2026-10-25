// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render} from '@testing-library/react';
import {TopbarAccountAvatar} from './TopbarAccountAvatar';

afterEach(cleanup);
it('uses the default school avatar without a custom photo',()=>{
 const {container}=render(<TopbarAccountAvatar name="María González"/>);
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/images/default-account-avatar.svg');
});
it('shows the account photo as a decorative avatar',()=>{
 const {container}=render(<TopbarAccountAvatar name="María González" avatarUrl="/photo.png"/>);
 const photo=container.querySelector('img')!;
 expect(photo.getAttribute('src')).toBe('/photo.png');
 expect(photo.alt).toBe('');
});
it('recovers from broken portraits and responds to an updated photo',()=>{
 const {container,rerender}=render(<TopbarAccountAvatar name="José de la Cruz" avatarUrl="/missing.png"/>);
 fireEvent.error(container.querySelector('img')!);
 expect(container.querySelector('.sc-topbar-avatar-fallback')?.textContent).toBe('JC');
 rerender(<TopbarAccountAvatar name="Ana María López" avatarUrl="/available.jpg"/>);
 expect(container.querySelector('img')?.getAttribute('src')).toBe('/available.jpg');
});
