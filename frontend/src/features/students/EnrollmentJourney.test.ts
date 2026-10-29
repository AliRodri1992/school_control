import {expect,it} from 'vitest';
import {journeyStats} from './EnrollmentJourney';
it('separates active enrollment, completed years and promotions',()=>{
 expect(journeyStats([{status:'active'},{status:'completed',outcome:'promoted'}])).toEqual({total:2,active:1,completed:1,promoted:1});
});
