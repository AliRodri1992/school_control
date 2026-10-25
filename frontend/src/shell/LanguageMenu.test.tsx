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
 expect(menu.classList.contains('sc-borderless-flyout')).toBe(true);
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
 expect(spanish.classList.contains('is-selected')).toBe(true);
 expect(spanish.getAttribute('data-state')).toBe('selected');
 expect(spanish.querySelector('svg.sc-language-option-check')).toBeTruthy();
 expect(spanish.querySelector('svg.sc-language-option-check')?.parentElement).toBe(spanish);
 expect(spanish.querySelector('.sc-language-option-check circle')).toBeNull();
 expect(spanish.querySelector('.sc-language-option-check rect')).toBeNull();
 expect(english.getAttribute('aria-pressed')).toBe('false');
 expect(english.classList.contains('is-selected')).toBe(false);
 expect(english.getAttribute('data-state')).toBe('available');
 expect(english.querySelector('.sc-language-option-check')).toBeNull();

 rerender(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="en" onSelect={vi.fn()}/>);
 expect(spanish.getAttribute('aria-pressed')).toBe('false');
 expect(spanish.classList.contains('is-selected')).toBe(false);
 expect(spanish.getAttribute('data-state')).toBe('available');
 expect(spanish.querySelector('.sc-language-option-check')).toBeNull();
 expect(english.getAttribute('aria-pressed')).toBe('true');
 expect(english.classList.contains('is-selected')).toBe(true);
 expect(english.getAttribute('data-state')).toBe('selected');
 expect(english.querySelector('svg.sc-language-option-check')).toBeTruthy();
 expect(english.querySelector('svg.sc-language-option-check')?.parentElement).toBe(english);
});

it('keeps hover and selected hit areas on the complete button, not just the text',async()=>{
 const onSelect=vi.fn();
 render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={onSelect}/>);
 const selected=screen.getByRole('button',{name:'Español · ES'});
 expect(selected.classList.contains('sc-language-option')).toBe(true);
 expect(selected.querySelector('.sc-language-option-label')).toBeTruthy();
 expect(selected.querySelector('.sc-language-option-check')).toBeTruthy();
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

it('never adds a decorative badge to the selected-language check',()=>{
 const {container}=render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="ko" onSelect={vi.fn()}/>);
 const chosen=screen.getByRole('button',{name:'한국어 · KO'});
 const icon=chosen.querySelector('svg.sc-language-option-check');
 expect(icon).toBeTruthy();
 expect(icon?.parentElement).toBe(chosen);
 expect(chosen.querySelector('span.sc-language-option-check')).toBeNull();
 expect(chosen.classList.contains('is-selected')).toBe(true);
 expect(container.querySelectorAll('svg.sc-language-option-check')).toHaveLength(1);
});

it('preserves an independent hoverable state on all non-selected language rows',async()=>{
 const onSelect=vi.fn();
 render(<LanguageMenu label="Idiomas disponibles" languages={languages}
  currentLocale="es" onSelect={onSelect}/>);
 const spanish=screen.getByRole('button',{name:'Español · ES'});
 const english=screen.getByRole('button',{name:'English · EN'});
 const korean=screen.getByRole('button',{name:'한국어 · KO'});
 expect(spanish.dataset.state).toBe('selected');
 expect(english.dataset.state).toBe('available');
 expect(korean.dataset.state).toBe('available');
 await userEvent.hover(english);
 expect(english.dataset.state).toBe('available');
 expect(spanish.dataset.state).toBe('selected');
 await userEvent.click(english);
 expect(onSelect).toHaveBeenCalledWith('en');
});
