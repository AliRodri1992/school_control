// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {LocaleProvider} from '../i18n/LocaleContext';
import TableEmptyState from './TableEmptyState';

afterEach(cleanup);
const show=(mode:'empty'|'filtered'|'forbidden'|'error'|'loading'='empty',locale='es',canCreate=true)=>
 render(<LocaleProvider locale={locale} translations={{}}><TableEmptyState mode={mode} canCreate={canCreate}/></LocaleProvider>);

it('shows Auli with the requested English empty state instead of a plain paragraph',()=>{
 show('empty','en');
 expect(screen.getByText('No records in this section yet.')).toBeTruthy();
 expect(screen.getByText('You can add authorized information.')).toBeTruthy();
 expect(screen.getByRole('img',{name:/Auli.*thinking/})).toHaveProperty('tagName','IMG');
 expect(screen.getByRole('status').getAttribute('data-empty-state')).toBe('empty');
});

it('uses Mexican Spanish as the default empty message',()=>{
 show();
 expect(screen.getByText('Todavía no hay registros en esta sección.')).toBeTruthy();
 expect(screen.getByText('Puedes agregar información autorizada.')).toBeTruthy();
});

it('does not invite users to add items without create permission',()=>{
 show('empty','en',false);
 expect(screen.getByText('Records will appear here when available.')).toBeTruthy();
 expect(screen.queryByText('You can add authorized information.')).toBeNull();
});

it('distinguishes filtered results from permission failures',()=>{
 const first=show('filtered','en');
 expect(screen.getByText('No matching records.')).toBeTruthy();
 first.unmount();
 show('forbidden','en');
 expect(screen.getByText('Access restricted.')).toBeTruthy();
 expect(screen.getByRole('img',{name:/Auli.*warning/})).toBeTruthy();
});

it('renders a failure alert instead of a misleading empty message',()=>{
 show('error','es');
 expect(screen.getByRole('alert')).toBeTruthy();
 expect(screen.getByText('No fue posible cargar los registros.')).toBeTruthy();
});
