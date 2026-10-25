// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import SchoolBootScreen from './SchoolBootScreen';

afterEach(cleanup);
it('renders original Auli as a builder with hard hat, plans and tools',()=>{
 const {container}=render(<SchoolBootScreen locale="es" stage="connecting"/>);
 expect(screen.getByRole('heading',{name:'Preparando tu escuela…'})).toBeTruthy();
 const mascot=screen.getByRole('img',{name:/Auli, el loro.*casco de obrero/});
 expect(mascot.getAttribute('src')).toBe('/illustrations/auli-building.svg');
 expect(container.querySelector('.sc-school-boot-rail')).toBeTruthy();
 expect(screen.getByRole('progressbar',{name:'Conectando con tu escuela'}).hasAttribute('aria-valuenow')).toBe(false);
});
it('updates the actual loading phase without misleading progress percentages',()=>{
 const {rerender}=render(<SchoolBootScreen locale="es" stage="connecting"/>);
 expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('Conectando con tu escuela');
 rerender(<SchoolBootScreen locale="es" stage="modules"/>);
 expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('Verificando accesos y cargando módulos');
 expect(screen.getByText('Verificando accesos y cargando módulos')).toBeTruthy();
 expect(screen.queryByText(/65%|100%/)).toBeNull();
});
it('supports English and does not offer navigation before login',()=>{
 render(<SchoolBootScreen locale="en" stage="modules"/>);
 expect(screen.getByRole('heading',{name:'Getting your school ready…'})).toBeTruthy();
 expect(screen.getByRole('progressbar',{name:'Checking access and loading modules'})).toBeTruthy();
 expect(screen.queryAllByRole('button')).toHaveLength(0);
 expect(screen.queryAllByRole('link')).toHaveLength(0);
});
