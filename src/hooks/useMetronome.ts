import { useRef, useState, useCallback, useEffect } from 'react';
import { beatsPerMeasure, subdivisionInterval, getBeatAccent } from '@/lib/bpmMath';
import type { TimeSignature, Subdivision } from '@/types';

export interface MetronomeControls {
  bpm: number;
  setBpm: (bpm: number) => void;
  timeSignature: TimeSignature;
  setTimeSignature: (ts: TimeSignature) => void;
  subdivision: Subdivision;
  setSubdivision: (s: Subdivision) => void;
  isPlaying: boolean;
  currentBeat: number;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useMetronome(initialBpm = 100): MetronomeControls {
  const [bpm, setBpmState] = useState(initialBpm);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<Subdivision>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const tsRef = useRef(timeSignature);
  const subRef = useRef(subdivision);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { tsRef.current = timeSignature; }, [timeSignature]);
  useEffect(() => { subRef.current = subdivision; }, [subdivision]);

  const setBpm = useCallback((v: number) => {
    setBpmState(Math.max(40, Math.min(240, Math.round(v))));
  }, []);

  const playClick = useCallback((time: number, accent: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1000 : 800;
    gain.gain.setValueAtTime(accent ? 0.8 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bpmVal = bpmRef.current;
    const ts = tsRef.current;
    const sub = subRef.current;
    const beats = beatsPerMeasure(ts);
    const interval = subdivisionInterval(bpmVal, sub);
    const scheduleAhead = 0.1;

    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAhead) {
      const beatInMeasure = beatCountRef.current % (beats * sub);
      const isAccent = getBeatAccent(Math.floor(beatInMeasure / sub), ts) === 'accent' && beatInMeasure % sub === 0;
      playClick(nextBeatTimeRef.current, isAccent);
      setCurrentBeat(Math.floor(beatInMeasure / sub));
      nextBeatTimeRef.current += interval / 1000;
      beatCountRef.current++;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const start = useCallback(() => {
    if (isPlaying) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    beatCountRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    setIsPlaying(true);
    scheduler();
  }, [isPlaying, scheduler]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentBeat(0);
    beatCountRef.current = 0;
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
    isPlaying, currentBeat, start, stop, toggle,
  };
}