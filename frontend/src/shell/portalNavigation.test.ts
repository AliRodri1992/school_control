import {expect,it} from 'vitest';
import {currentPortal,findNavPath,visibleGroups,portalGroups} from './portalNavigation';

it('provides distinct navigation group structures for each school portal',()=>{
 const portals=['admin','teachers','students','tutors'] as const;
 for(const portal of portals){
   expect(portalGroups[portal].length).toBeGreaterThan(0);
   expect(portalGroups[portal].every(group=>group.items.length>0)).toBe(true);
 }
 expect(currentPortal('teacher')).toBe('teachers');
 expect(currentPortal('guardian')).toBe('tutors');
});

it('finds the entire group path for a nested school module',()=>{
 const admin=visibleGroups('admin',()=>true);
 expect(findNavPath(admin,'courses').map(item=>item.key)).toEqual(['academic_years','groups','courses']);
 expect(admin.find(group=>group.title==='Gestión académica')).toBeTruthy();
});

it('hides inaccessible modules rather than rendering disabled navigation entries',()=>{
 const groups=visibleGroups('admin',key=>key==='students.index');
 expect(findNavPath(groups,'students')).toHaveLength(1);
 expect(findNavPath(groups,'reports')).toHaveLength(0);
});
