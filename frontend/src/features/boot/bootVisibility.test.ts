import {afterEach,expect,it,vi} from 'vitest';
import {MINIMUM_BOOT_VISIBILITY_MS,waitForMinimumBootVisibility} from './bootVisibility';

afterEach(()=>{vi.useRealTimers();});

it('keeps the login-only Auli transition visible long enough to be seen',async()=>{
 vi.useFakeTimers();
 const completed=vi.fn();
 const started=performance.now();
 const loading=waitForMinimumBootVisibility(started).then(completed);
 await vi.advanceTimersByTimeAsync(MINIMUM_BOOT_VISIBILITY_MS-1);
 expect(completed).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(1);
 await loading;
 expect(completed).toHaveBeenCalledTimes(1);
});
it('does not hold up the dashboard when its preparation already took longer',async()=>{
 vi.useFakeTimers();
 const started=performance.now()-(MINIMUM_BOOT_VISIBILITY_MS+100);
 await waitForMinimumBootVisibility(started);
 expect(vi.getTimerCount()).toBe(0);
});
it('waits only for time remaining after real module loading',async()=>{
 vi.useFakeTimers();
 const started=performance.now();
 await vi.advanceTimersByTimeAsync(500);
 const completed=vi.fn();
 const loading=waitForMinimumBootVisibility(started).then(completed);
 await vi.advanceTimersByTimeAsync(MINIMUM_BOOT_VISIBILITY_MS-501);
 expect(completed).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(1);
 await loading;
 expect(completed).toHaveBeenCalledTimes(1);
});
