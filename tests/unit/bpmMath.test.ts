import { describe, it, expect } from 'vitest';
import { msPerBeat, clampBpm, tapTempoToBpm, beatsPerMeasure, getBeatAccent } from '@/lib/bpmMath';

describe('bpmMath', () => {
  it('msPerBeat returns correct ms for 120 BPM', () => {
    expect(msPerBeat(120)).toBe(500);
  });
  it('clampBpm clamps to 40-240', () => {
    expect(clampBpm(30)).toBe(40);
    expect(clampBpm(250)).toBe(240);
    expect(clampBpm(120.7)).toBe(121);
  });
  it('tapTempoToBpm returns null for <2 taps', () => {
    expect(tapTempoToBpm([])).toBeNull();
    expect(tapTempoToBpm([1000])).toBeNull();
  });
  it('tapTempoToBpm calculates from intervals', () => {
    const taps = [0, 500, 1000, 1500];
    expect(tapTempoToBpm(taps)).toBe(120);
  });
  it('beatsPerMeasure parses time signature', () => {
    expect(beatsPerMeasure('4/4')).toBe(4);
    expect(beatsPerMeasure('3/4')).toBe(3);
    expect(beatsPerMeasure('6/8')).toBe(6);
  });
  it('getBeatAccent marks first beat as accent', () => {
    expect(getBeatAccent(0, '4/4')).toBe('accent');
    expect(getBeatAccent(1, '4/4')).toBe('normal');
  });
  it('getBeatAccent marks beat 3 in 6/8 as accent', () => {
    expect(getBeatAccent(3, '6/8')).toBe('accent');
  });
});