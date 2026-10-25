import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';

const legacy=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const foundation=readFileSync(new URL('../styles/design-system.css',import.meta.url),'utf8');
const shell=readFileSync(new URL('../styles/portal-shell.css',import.meta.url),'utf8');

it('does not apply sidebar-sized links to breadcrumbs through global nav selectors',()=>{
 expect(legacy).toContain('.sidebar nav button{display:flex;width:100%');
 expect(legacy).not.toMatch(/(^|})nav button\{/);
 expect(legacy).toContain('.sidebar nav{overflow-y:auto;');
 expect(legacy).not.toContain('}nav{overflow-y:auto;');
 expect(foundation).not.toContain('.sc-crumbs{display:none}');
 expect(foundation).toContain('.sidebar nav button:hover:not(.selected)');
});
it('pins the breadcrumb home and ancestor buttons to natural widths at the left',()=>{
 expect(shell).toContain('justify-content:flex-start;');
 expect(shell).toMatch(/\.sc-crumbs\s*>\s*\.sc-crumb-home\s*\{[^}]*width:max-content/);
 expect(shell).toMatch(/\.sc-crumb-step\s*>\s*\.sc-crumb-link\s*\{[^}]*width:auto/);
 expect(shell).toContain('.sc-crumbs-condensed .sc-crumb-ancestor{display:none}');
 expect(shell).not.toContain('overflow-x:auto;overflow-y:hidden;white-space:nowrap;');
});
