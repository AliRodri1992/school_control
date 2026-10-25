// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import AuliBuilderIllustration from './AuliBuilderIllustration';

afterEach(cleanup);
it('renders the complete constructor mascot inline with its hat, wrench and school plan',()=>{
 const {container}=render(<AuliBuilderIllustration locale="es"/>);
 const drawing=screen.getByRole('img',{name:/Auli, el loro.*casco de trabajador/});
 expect(drawing.tagName.toLowerCase()).toBe('svg');
 expect(container.querySelector('#builder-auli')).toBeTruthy();
 expect(drawing.querySelector('defs linearGradient#body')).toBeTruthy();
 expect(drawing.querySelectorAll('#builder-auli path').length).toBeGreaterThan(8);
 expect(container.querySelector('img')).toBeNull();
});
it('makes the same SVG accessible in English and avoids remote image loading',()=>{
 render(<AuliBuilderIllustration locale="en"/>);
 expect(screen.getByRole('img',{name:/Auli the school parrot wearing a construction helmet/})).toBeTruthy();
 expect(document.querySelector('img[src*="auli"]')).toBeNull();
});
