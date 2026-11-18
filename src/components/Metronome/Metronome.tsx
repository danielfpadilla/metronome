import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMetronome } from '@/hooks/useMetronome';
import { TapWheel } from './TapWheel';
import { BpmDisplay } from './BpmDisplay';
import { SubdivisionButtons } from './SubdivisionButtons';
import { PlayBar } from './PlayBar';
import { BottomToolbar } from './BottomToolbar';
import { SettingsPanel, type MetronomeSettings } from './SettingsPanel';
import { tapTempoToBpm } from '@/lib/bpmMath';
import type { TimeSignature } from '@/types';

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];

const DEFAULT_SETTINGS: MetronomeSettings = {
  countIn: false,
  pendulum: false,
  flashAccent: true,
  flashScreen: false,
  flashNumbers: false,
  theme: 'dark',
  accentLow: 30,
  accentMid: 60,
  accentHigh: 100,
  soundType: 'woodblock',
};

const STORAGE_KEY = 'metronome-settings';

function loadSettings(): MetronomeSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function Metronome() {
  const [settings, setSettings] = useState<MetronomeSettings>(loadSettings);
  const tapTimesRef = useRef<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();

  const metro = useMetronome(100, {
    countIn: settings.countIn,
    accentVolume: settings.accentHigh / 100,
    beatVolume: settings.accentMid / 100,
    subdivisionVolume: settings.accentLow / 100,
    soundType: settings.soundType,
  });

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }
  }, [settings]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].slice(-6);
    const newBpm = tapTempoToBpm(tapTimesRef.current);
    if (newBpm !== null) metro.setBpm(newBpm);
  }, [metro]);

  // Apply BPM from ?bpm= URL param (e.g., when a track card sets the tempo)
  useEffect(() => {
    const bpmParam = new URLSearchParams(location.search).get('bpm');
    if (!bpmParam) return;
    const bpm = Number(bpmParam);
    if (!Number.isNaN(bpm)) {
      metro.setBpm(bpm);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, metro]);

  // Elapsed time display
  const elapsedSeconds = metro.currentBeat * (60 / metro.bpm);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60);
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const countInActive = metro.countInBeat !== null;
  const displayTime = countInActive ? `Count-in ${metro.countInBeat}` : timeDisplay;

  const flashScreenActive = settings.flashScreen && metro.isPlaying && metro.currentBeat === 0;
  const flashNumbers = settings.flashNumbers && metro.isPlaying && metro.currentBeat === 0;

  return (
    <div className="relative flex flex-col h-full bg-[#111]">
      {/* Fullscreen accent flash */}
      {flashScreenActive && <div key={metro.currentBeat} className="flash-overlay" />}

      {/* Top controls */}
      <div className="px-4 py-3 border-b border-[#222]">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 flex items-center justify-center text-[#888]">♪</div>
          <BpmDisplay
            bpm={metro.bpm}
            flash={flashNumbers}
            onIncrement={() => metro.setBpm(metro.bpm + 1)}
            onDecrement={() => metro.setBpm(metro.bpm - 1)}
          />
          <div className="flex gap-1">
            <div className="w-9 h-9 flex items-center justify-center text-[#888]">♪</div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 flex items-center justify-center text-[#888] hover:text-white"
              aria-label="Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Time signature selector */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs text-[#888]">Time Signature:</span>
          <select
            value={metro.timeSignature}
            onChange={(e) => metro.setTimeSignature(e.target.value as TimeSignature)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#00e0c6]"
          >
            {TIME_SIGNATURES.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center gap-2">
          <PlayBar isPlaying={metro.isPlaying} onToggle={metro.toggle} />
        </div>
      </div>

      {/* Tap wheel + visual beat indicator */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 gap-4">
        {settings.pendulum ? (
          <div className="pendulum">
            <div
              className="pendulum-rod"
              style={{ animationDuration: `${2 * (60 / metro.bpm)}s` }}
            />
            <div className="pendulum-weight" />
          </div>
        ) : (
          <TapWheel onTap={handleTap} onRotate={(delta) => metro.setBpm(metro.bpm + delta)} />
        )}
        {/* Visual beat indicator */}
        <div className="flex gap-2">
          {Array.from({ length: parseInt(metro.timeSignature.split('/')[0]) }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-100 ${
                metro.currentBeat === i
                  ? i === 0
                    ? 'bg-[#00e0c6] scale-125 shadow-[0_0_8px_rgba(0,224,198,0.5)]'
                    : 'bg-white scale-110'
                  : 'bg-[#333]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-4 py-3 border-t border-[#222]">
        <div className="mb-3">
          <SubdivisionButtons value={metro.subdivision} onChange={metro.setSubdivision} />
        </div>
        <BottomToolbar timeDisplay={displayTime} isPlaying={metro.isPlaying} onToggle={metro.toggle} />
      </div>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
        previewSound={metro.previewSound}
      />
    </div>
  );
}
