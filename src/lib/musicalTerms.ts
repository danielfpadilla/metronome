const MUSICAL_TERMS: [number, number, string][] = [
  [40, 60, 'Largo'],
  [61, 66, 'Larghetto'],
  [67, 76, 'Adagio'],
  [77, 108, 'Andante moderato'],
  [109, 120, 'Moderato'],
  [121, 168, 'Allegro'],
  [169, 200, 'Vivace'],
  [201, 240, 'Presto'],
];

export function getMusicalTerm(bpm: number): string {
  for (const [min, max, term] of MUSICAL_TERMS) {
    if (bpm >= min && bpm <= max) return term;
  }
  if (bpm < 40) return 'Largo';
  return 'Presto';
}