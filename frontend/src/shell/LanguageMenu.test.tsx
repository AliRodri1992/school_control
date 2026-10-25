// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageMenu from './LanguageMenu';
import shellCss from '../styles/portal-shell.css?raw';

afterEach(cleanup);

const languages=[
 {code:'es',native_name:'Español'},
 {code:'en',native_name:'English'},
 {code:'ko',native_name:'한국어'}
];

it('makes each complete language row a clickable, accessible button',async()=>{
 const onSelect=vi.fn();
 const {container}=render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={onSelect}/>);
 const menu=screen.getByRole('group',{name:'Idiomas disponibles'});
 const buttons=Array.from(menu.querySelectorAll('button'));
 expect(buttons).toHaveLength(3);
 expect(buttons.every(button=>button.classList.contains('sc-language-option'))).toBe(true);
 expect(buttons.every(button=>button.classList.contains('sc-flyout-link'))).toBe(true);
 expect(container.querySelectorAll('.sc-language-option-label')).toHaveLength(3);
 await userEvent.click(screen.getByRole('button',{name:'한국어 · KO'}));
 expect(onSelect).toHaveBeenCalledTimes(1);
 expect(onSelect).toHaveBeenCalledWith('ko');
});

it('highlights the current locale and places its check mark inside the same clickable row',()=>{
 const {rerender}=render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={vi.fn()}/>);
 const spanish=screen.getByRole('button',{name:'Español · ES'});
 const english=screen.getByRole('button',{name:'English · EN'});
 expect(spanish.getAttribute('aria-pressed')).toBe('true');
 expect(spanish.querySelector('svg')).toBeTruthy();
 expect(english.getAttribute('aria-pressed')).toBe('false');
 expect(english.querySelector('svg')).toBeNull();

 rerender(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="en" onSelect={vi.fn()}/>);
 expect(spanish.getAttribute('aria-pressed')).toBe('false');
 expect(english.getAttribute('aria-pressed')).toBe('true');
 expect(english.querySelector('svg')).toBeTruthy();
});

it('styles hover, selection and focus over the whole dropdown width without inset padding',()=>{
 expect(shellCss).toMatch(/\.sc-shell \.sc-topbar \.sc-language-menu\s*\{\s*padding:0;/);
 const row=shellCss.match(/\.sc-shell \.sc-topbar \.sc-language-menu>\.sc-language-option\s*\{([^}]+)\}/)?.[1];
 expect(row).toBeDefined();
 expect(row).toContain('width:100%');
 expect(row).toContain('margin:0');
 expect(row).toContain('border-radius:0');
 expect(shellCss).toContain('.sc-language-option:hover{');
 expect(shellCss).toContain('.sc-language-option[aria-pressed=true]{');
 expect(shellCss).toContain('.sc-language-option:focus-visible{');
});
