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
  previewSound: (accent: boolean, volume: number) => void;
}

export interface UseMetronomeOptions {
  countIn?: boolean;
  accentVolume?: number;
  beatVolume?: number;
  subdivisionVolume?: number;
  soundType?: 'woodblock' | 'beep' | 'click';
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

  // Synthesize a woodblock-like click sound
  const playWoodblock = useCallback((ctx: AudioContext, time: number, accent: boolean, volume: number) => {
    const freq = accent ? 1200 : 800;
    const gainVal = accent ? Math.max(0.001, volume) : Math.max(0.001, volume * 0.6);

    // Main tone (triangle wave for woody quality)
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

    // Noise burst for attack texture
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

  // Synthesize a simple beep sound
  const playBeep = useCallback((ctx: AudioContext, time: number, accent: boolean, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = accent ? 1000 : 800;
    gain.gain.setValueAtTime(accent ? Math.max(0.001, volume) : Math.max(0.001, volume * 0.6), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  // Synthesize a click sound
  const playClickSound = useCallback((ctx: AudioContext, time: number, accent: boolean, volume: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(accent ? Math.max(0.001, volume) : Math.max(0.001, volume * 0.5), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  }, []);

  const playSound = useCallback((ctx: AudioContext, time: number, accent: boolean, volume: number, soundType: string) => {
    switch (soundType) {
      case 'woodblock':
        playWoodblock(ctx, time, accent, volume);
        break;
      case 'beep':
        playBeep(ctx, time, accent, volume);
        break;
      case 'click':
        playClickSound(ctx, time, accent, volume);
        break;
      default:
        playWoodblock(ctx, time, accent, volume);
    }
  }, [playWoodblock, playBeep, playClickSound]);

  const previewSound = useCallback((accent: boolean, volume: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const soundType = optionsRef.current.soundType || 'woodblock';
    playSound(ctx, ctx.currentTime, accent, volume, soundType);
  }, [playSound]);

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
    const soundType = opts.soundType || 'woodblock';

    while (nextBeatTimeRef.current < ctx.currentTime + scheduleAhead) {
      if (countInRef.current > 0) {
        const isDownbeat = countInRef.current === beats;
        playSound(ctx, nextBeatTimeRef.current, isDownbeat, 0.5, soundType);
        setCountInBeat(beats - countInRef.current + 1);
        countInRef.current -= 1;
        nextBeatTimeRef.current += (60 / bpmVal);
        continue;
      }
      const beatInMeasure = beatCountRef.current % (beats * sub);
      const isMainBeat = beatInMeasure % sub === 0;
      const isAccent = getBeatAccent(Math.floor(beatInMeasure / sub), ts) === 'accent' && isMainBeat;
      playSound(
        ctx,
        nextBeatTimeRef.current,
        isAccent,
        isAccent ? accentVolume : (isMainBeat ? beatVolume : (opts.subdivisionVolume ?? 0.25)),
        soundType,
      );
      setCurrentBeat(Math.floor(beatInMeasure / sub));
      nextBeatTimeRef.current += interval / 1000;
      beatCountRef.current += 1;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  }, [playSound, subdivisionInterval]);

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
