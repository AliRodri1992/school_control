/** A brief, perceivable minimum lets Auli's intended login transition actually appear.
 * Slow requests are never delayed beyond their real completion time. */
export const MINIMUM_BOOT_VISIBILITY_MS=850;

export async function waitForMinimumBootVisibility(
 startedAt:number,
 minimumMs=MINIMUM_BOOT_VISIBILITY_MS
):Promise<void>{
 const remaining=Math.max(0,minimumMs-(performance.now()-startedAt));
 if(remaining>0)await new Promise<void>(resolve=>setTimeout(resolve,remaining));
}
