// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import SchoolBootScreen from './SchoolBootScreen';

afterEach(cleanup);
it('renders original Auli as a builder with hard hat, plans and tools',()=>{
 const {container}=render(<SchoolBootScreen locale="es" stage="connecting"/>);
 expect(screen.getByRole('heading',{name:'Preparando tu escuela…'})).toBeTruthy();
 const mascot=screen.getByRole('img',{name:/Auli, el loro.*casco de trabajador/});
 expect(mascot.tagName.toLowerCase()).toBe('svg');
 expect(container.querySelector('#builder-auli')).toBeTruthy();
 expect(container.querySelector('.sc-school-boot-rail')).toBeNull();
 expect(container.querySelector('.sc-school-boot-topbar')).toBeNull();
 expect(container.querySelector('aside,header,nav')).toBeNull();
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

it('has only the centered preparation card without a sidebar or navbar on either loading stage',()=>{
 const {container,rerender}=render(<SchoolBootScreen locale="es" stage="connecting"/>);
 for(const stage of ['connecting','modules'] as const){
  rerender(<SchoolBootScreen locale="es" stage={stage}/>);
  const wrapper=container.querySelector('.sc-school-boot')!;
  expect(wrapper.tagName.toLowerCase()).toBe('main');
  expect(wrapper.querySelectorAll('.sc-school-boot-card')).toHaveLength(1);
  expect(wrapper.querySelector('aside,header,nav,.topbar,.sc-sidebar,.sc-topbar')).toBeNull();
  expect(wrapper.querySelectorAll('svg[role="img"]')).toHaveLength(1);
 }
});
it('keeps Auli visible in the DOM without requesting an external illustration',()=>{
 const {container}=render(<SchoolBootScreen locale="en" stage="connecting"/>);
 const svg=screen.getByRole('img',{name:/Auli the school parrot wearing a construction helmet/});
 expect(svg.querySelector('#builder-auli')).toBeTruthy();
 expect(container.querySelector('img')).toBeNull();
 expect(container.querySelector('.sc-school-boot-auli')).toContainElement(svg);
});
