import { useRef, useState, useCallback, useEffect } from 'react';
import { beatsPerMeasure, subdivisionInterval, getBeatAccent } from '@/lib/bpmMath';
import type { TimeSignature, Subdivision } from '@/types';

export interface MetronomeControls {
  bpm: number;
  setBpm: (v: number) => void;
  timeSignature: TimeSignature;
  setTimeSignature: (ts: TimeSignature) => void;
  subdivision: Subdivision;
  setSubdivision: (s: Subdivision) => void;
  isPlaying: boolean;
  currentBeat: number;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  countInBeat: number | null;
}

export interface UseMetronomeOptions {
  countIn?: boolean;
  accentVolume?: number; // downbeat click gain (0..1)
  beatVolume?: number;   // normal beat click gain (0..1)
  subdivisionVolume?: number; // subdivision click gain (0..1)
}

export function useMetronome(initialBpm = 100, options?: UseMetronomeOptions): MetronomeControls {
  const [bpm, setBpmState] = useState(initialBpm);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<Subdivision>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [countInBeat, setCountInBeat] = useState<number | null>(null);

  // Keep latest options in a ref for the scheduler
  const optionsRef = useRef<UseMetronomeOptions>({});
  useEffect(() => {
    optionsRef.current = options ?? {};
  }, [options]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const tsRef = useRef(timeSignature);
  const subRef = useRef(subdivision);
  const isPlayingRef = useRef(false);
  const countInRef = useRef(0);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { tsRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { subRef.current = subdivision; }, [subdivision]);

  const setBpm = useCallback((v: number) => {
    setBpmState(Math.max(40, Math.min(240, Math.round(v))));
  }, []);

  const playClick = useCallback((time: number, accent: boolean, volume: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1000 : 800;
    gain.gain.setValueAtTime(accent ? Math.max(0.001, volume) : Math.max(0.001, volume * 0.6), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    if (!isPlayingRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bpmVal = bpmRef.current;
    const ts = tsRef.current;
    const sub = subRef.current;
    const opts = optionsRef.current;
    const beats = beatsPerMeasure(ts);
    const interval = subdivisionInterval(bpmVal, sub);
    const scheduleAhead = 0.1;
    const accentVolume = opts.accentVolume ?? 0.8;
    const beatVolume = opts.beatVolume ?? 0.5;

    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAhead) {
      if (countInRef.current > 0) {
        const isDownbeat = countInRef.current === beats;
        playClick(nextBeatTimeRef.current, isDownbeat, 0.5);
        setCountInBeat(beats - countInRef.current + 1);
        countInRef.current -= 1;
        // Count-in ticks are on beats, not subdivisions
        nextBeatTimeRef.current += (60 / bpmVal);
        continue;
      }
      const beatInMeasure = beatCountRef.current % (beats * sub);
      const isMainBeat = beatInMeasure % sub === 0;
      const isAccent = getBeatAccent(Math.floor(beatInMeasure / sub), ts) === 'accent' && isMainBeat;
      playClick(
        nextBeatTimeRef.current,
        isAccent,
        isAccent ? accentVolume : (isMainBeat ? beatVolume : (opts.subdivisionVolume ?? 0.25)),
      );
      setCurrentBeat(Math.floor(beatInMeasure / sub));
      nextBeatTimeRef.current += interval / 1000;
      beatCountRef.current += 1;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  }, [playClick, subdivisionInterval]);

  const start = useCallback(() => {
    if (isPlaying) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    beatCountRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    isPlayingRef.current = true;
    setIsPlaying(true);
    countInRef.current = optionsRef.current.countIn ? beatsPerMeasure(tsRef.current) : 0;
    setCountInBeat(countInRef.current > 0 ? 1 : null);
    scheduler();
  }, [isPlaying, scheduler]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentBeat(0);
    beatCountRef.current = 0;
    countInRef.current = 0;
    setCountInBeat(null);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) stop(); else start();
  }, [isPlaying, start, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    bpm, setBpm, timeSignature, setTimeSignature, subdivision, setSubdivision,
    isPlaying, currentBeat, start, stop, toggle, countInBeat,
  };
}
