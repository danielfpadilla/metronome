import { describe, it, expect } from 'vitest';
import { appendTapHistory } from '@/lib/bpmMath';

describe('appendTapHistory', () => {
  it('appends newest BPM last', () => {
    expect(appendTapHistory([100, 110], 120)).toEqual([100, 110, 120]);
  });

  it('caps history at 20 entries', () => {
    const input = Array.from({ length: 25 }, (_, i) => 100 + i);
    const result = appendTapHistory(input, 200);
    expect(result).toHaveLength(20);
    expect(result[0]).toBe(106);
    expect(result[19]).toBe(200);
  });
});
