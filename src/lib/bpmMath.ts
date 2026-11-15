export function msPerBeat(bpm: number): number {
  return 60000 / bpm;
}

export function msPerMeasure(bpm: number, beatsPerMeasure: number): number {
  return (60000 / bpm) * beatsPerMeasure;
}

export function beatsPerMeasure(timeSignature: string): number {
  const [beats] = timeSignature.split('/').map(Number);
  return beats;
}

export function subdivisionInterval(bpm: number, subdivision: number): number {
  return (60000 / bpm) / subdivision;
}

export function clampBpm(bpm: number): number {
  return Math.max(40, Math.min(240, Math.round(bpm)));
}

export function tapTempoToBpm(tapTimes: number[]): number | null {
  if (tapTimes.length < 2) return null;
  const intervals = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return clampBpm(60000 / avg);
}

export function getBeatAccent(beat: number, timeSignature: string): 'accent' | 'normal' {
  if (beat === 0) return 'accent';
  if (timeSignature === '6/8' && beat === 3) return 'accent';
  return 'normal';
}