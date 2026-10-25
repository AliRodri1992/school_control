// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageMenu from './LanguageMenu';

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
 expect(Array.from(menu.children)).toEqual(buttons);
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

it('keeps hover and selected hit areas on the complete button, not just the text',async()=>{
 const onSelect=vi.fn();
 render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={onSelect}/>);
 const selected=screen.getByRole('button',{name:'Español · ES'});
 expect(selected.classList.contains('sc-language-option')).toBe(true);
 expect(selected.querySelector('.sc-language-option-label')).toBeTruthy();
 await userEvent.click(selected.querySelector('svg')!);
 expect(onSelect).toHaveBeenCalledWith('es');
});

it('allows arrow and Home/End keyboard navigation through the full-width rows',async()=>{
 const onSelect=vi.fn();
 render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={onSelect}/>);
 const spanish=screen.getByRole('button',{name:'Español · ES'});
 const english=screen.getByRole('button',{name:'English · EN'});
 const korean=screen.getByRole('button',{name:'한국어 · KO'});
 spanish.focus();
 await userEvent.keyboard('{ArrowDown}');
 expect(document.activeElement).toBe(english);
 await userEvent.keyboard('{End}');
 expect(document.activeElement).toBe(korean);
 await userEvent.keyboard('{ArrowDown}');
 expect(document.activeElement).toBe(spanish);
 await userEvent.keyboard('{ArrowUp}');
 expect(document.activeElement).toBe(korean);
 await userEvent.keyboard('{Home}');
 expect(document.activeElement).toBe(spanish);
 await userEvent.keyboard('{Enter}');
 expect(onSelect).toHaveBeenCalledWith('es');
});
