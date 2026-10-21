import {describe,it,expect} from 'vitest';
import {timeLabel,mean} from './api';
describe('academic display',()=>{
 it('renders school periods without losing zero minutes',()=>{expect(timeLabel(480)).toBe('08:00');expect(timeLabel(530)).toBe('08:50');});
 it('does not invent a grade when there are no marks',()=>{expect(mean([])).toBe('—');});
 it('calculates the displayed average',()=>{expect(mean([8,9,10])).toBe('9.0');});
});
