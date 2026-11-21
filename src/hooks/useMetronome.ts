import { useRef, useState, useCallback, useEffect } from 'react';
import { beatsPerMeasure, subdivisionInterval } from '@/lib/bpmMath';
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
  previewSound: (level: number, volume: number) => void;
}

export interface UseMetronomeOptions {
  countIn?: boolean;
  accentVolumes?: { low: number; mid: number; high: number };
  soundType?: 'woodblock' | 'beep' | 'click';
  accentPattern?: number[]; // 0=off, 1=low, 2=mid, 3=high per beat
}

export function useMetronome(initialBpm = 100, options?: UseMetronomeOptions): MetronomeControls {
  const [bpm, setBpmState] = useState(initialBpm);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<Subdivision>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [countInBeat, setCountInBeat] = useState<number | null>(null);

  const optionsRef = useRef<UseMetronomeOptions>({});
  useEffect(() => {
    optionsRef.current = options ?? {};
  }, [options]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const schedulerRef = useRef<() => void>(() => {});
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

  const playWoodblock = useCallback((ctx: AudioContext, time: number, volume: number, freqMultiplier: number = 1) => {
    const gainVal = Math.max(0.001, volume);
    const freq = 1000 * freqMultiplier;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);

    const bufferSize = Math.floor(ctx.sampleRate * 0.02);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq * 1.5;
    noiseFilter.Q.value = 2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(gainVal * 0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.02);
  }, []);

  const playBeep = useCallback((ctx: AudioContext, time: number, volume: number, freqMultiplier: number = 1) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 900 * freqMultiplier;
    gain.gain.setValueAtTime(Math.max(0.001, volume), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const playClickSound = useCallback((ctx: AudioContext, time: number, volume: number, freqMultiplier: number = 1) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200 * freqMultiplier;
    gain.gain.setValueAtTime(Math.max(0.001, volume), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  }, []);

  const playLevel = useCallback((ctx: AudioContext, time: number, level: number, volumes: { low: number; mid: number; high: number }, soundType: string) => {
    if (level === 0) return; // silent

    let volume: number;
    let freqMultiplier: number;
    switch (level) {
      case 1: // low - low pitch
        volume = volumes.low;
        freqMultiplier = 0.7;
        break;
      case 2: // mid - normal pitch
        volume = volumes.mid;
        freqMultiplier = 1.0;
        break;
      case 3: // high - higher pitch
        volume = volumes.high;
        freqMultiplier = 1.4;
        break;
      default:
        return;
    }

    switch (soundType) {
      case 'woodblock':
        playWoodblock(ctx, time, volume, freqMultiplier);
        break;
      case 'beep':
        playBeep(ctx, time, volume, freqMultiplier);
        break;
      case 'click':
        playClickSound(ctx, time, volume, freqMultiplier);
        break;
      default:
        playWoodblock(ctx, time, volume, freqMultiplier);
    }
  }, [playWoodblock, playBeep, playClickSound]);

  const previewSound = useCallback((level: number, volume: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const soundType = optionsRef.current.soundType || 'woodblock';
    const volumes = optionsRef.current.accentVolumes || { low: 0.3, mid: 0.6, high: 1.0 };
    // Use the provided volume or the level's default
    const actualVolume = volume > 0 ? volume : (level === 1 ? volumes.low : level === 2 ? volumes.mid : volumes.high);
    playLevel(ctx, ctx.currentTime, level, { low: actualVolume, mid: actualVolume, high: actualVolume }, soundType);
  }, [playLevel]);

  const scheduler = useCallback(function schedule() {
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
    const volumes = opts.accentVolumes || { low: 0.3, mid: 0.6, high: 1.0 };
    const soundType = opts.soundType || 'woodblock';
    const pattern = opts.accentPattern || [3, 2, 2, 2];

    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAhead) {
      if (countInRef.current > 0) {
        const isDownbeat = countInRef.current === beats;
        playLevel(ctx, nextBeatTimeRef.current, isDownbeat ? 3 : 1, volumes, soundType);
        setCountInBeat(beats - countInRef.current + 1);
        countInRef.current -= 1;
        nextBeatTimeRef.current += (60 / bpmVal);
        continue;
      }
      const beatInMeasure = beatCountRef.current % (beats * sub);
      const isMainBeat = beatInMeasure % sub === 0;
      const beatIndex = Math.floor(beatInMeasure / sub);
      const level = isMainBeat ? (pattern[beatIndex] ?? 2) : 1;

      if (level > 0) {
        playLevel(ctx, nextBeatTimeRef.current, level, volumes, soundType);
      }
      setCurrentBeat(beatIndex);
      nextBeatTimeRef.current += interval / 1000;
      beatCountRef.current += 1;
    }
    timerRef.current = window.setTimeout(() => schedulerRef.current(), 25);
  }, [playLevel]);

  useEffect(() => { schedulerRef.current = scheduler; }, [scheduler]);

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
    isPlaying, currentBeat, start, stop, toggle, countInBeat, previewSound,
  };
}
