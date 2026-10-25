// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LegalInformation from './LegalInformation';

afterEach(()=>{cleanup();localStorage.removeItem('school-locale');});
it('shows an explicit not-published notice instead of invented privacy terms',async()=>{
 const help=vi.fn();
 render(<LegalInformation kind="privacy" onHelp={help}/>);
 expect(screen.getByRole('heading',{name:'Aviso de privacidad'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Documento aún no publicado'})).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Ir al centro de ayuda'}));
 expect(help).toHaveBeenCalledOnce();
});
it('shows the terms page independently and translates to English',()=>{
 localStorage.setItem('school-locale','en');
 render(<LegalInformation kind="terms" onHelp={vi.fn()}/>);
 expect(screen.getByRole('heading',{name:'Terms of use'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Document not yet published'})).toBeTruthy();
});
