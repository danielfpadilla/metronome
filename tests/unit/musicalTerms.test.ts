import { describe, it, expect } from 'vitest';
import { getMusicalTerm } from '@/lib/musicalTerms';

describe('getMusicalTerm', () => {
  it('returns Largo for 40-60', () => {
    expect(getMusicalTerm(40)).toBe('Largo');
    expect(getMusicalTerm(60)).toBe('Largo');
  });
  it('returns Presto for 201-240', () => {
    expect(getMusicalTerm(201)).toBe('Presto');
    expect(getMusicalTerm(240)).toBe('Presto');
  });
  it('returns Andante moderato for 77-108', () => {
    expect(getMusicalTerm(100)).toBe('Andante moderato');
  });
  it('clamps below 40 to Largo', () => {
    expect(getMusicalTerm(30)).toBe('Largo');
  });
  it('clamps above 240 to Presto', () => {
    expect(getMusicalTerm(250)).toBe('Presto');
  });
});