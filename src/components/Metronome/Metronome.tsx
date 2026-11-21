import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMetronome } from '@/hooks/useMetronome';
import { TapWheel } from './TapWheel';
import { BpmDisplay } from './BpmDisplay';
import { SubdivisionButtons } from './SubdivisionButtons';
import { PlayBar } from './PlayBar';
import { BeatAccentBar } from './BeatAccentBar';
import { SettingsPanel } from './SettingsPanel';
import { PlaylistPlayer } from './PlaylistPlayer';
import { useSettings } from '@/hooks/useSettings';
import { tapTempoToBpm, appendTapHistory } from '@/lib/bpmMath';
import type { TimeSignature, Subdivision, Track } from '@/types';

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];

export function Metronome() {
  const { settings, updateSettings } = useSettings();
  const tapTimesRef = useRef<number[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(() => new URLSearchParams(location.search).has('settings'));

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  const metro = useMetronome(100, {
    countIn: settings.countIn,
    accentVolumes: {
      low: settings.accentLow / 100,
      mid: settings.accentMid / 100,
      high: settings.accentHigh / 100,
    },
    soundType: settings.soundType,
    accentPattern: settings.accentPattern,
  });

  // Keep latest BPM in a ref for the tap wheel rotation handler
  const bpmRef = useRef(metro.bpm);
  useEffect(() => {
    bpmRef.current = metro.bpm;
  }, [metro.bpm]);

  // Responsive tap wheel size
  const [wheelSize, setWheelSize] = useState(280);
  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w < 480) setWheelSize(180);
      else if (w < 768) setWheelSize(240);
      else setWheelSize(280);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].slice(-6);
    const newBpm = tapTempoToBpm(tapTimesRef.current);
    if (newBpm !== null) {
      metro.setBpm(newBpm);
      updateSettings((prev) => ({ tapHistory: appendTapHistory(prev.tapHistory, newBpm) }));
    }
  }, [metro, updateSettings]);

  const { setTimeSignature, setSubdivision } = metro;
  const currentTs = metro.timeSignature;

  const applyTrackSettings = useCallback((track: Track) => {
    if (track.timeSignature && TIME_SIGNATURES.includes(track.timeSignature)) {
      setTimeSignature(track.timeSignature);
    }
    if (track.subdivision && [1, 2, 3, 4].includes(track.subdivision)) {
      setSubdivision(track.subdivision as Subdivision);
    }
    if (track.accentPattern?.length) {
      const beats = parseInt((track.timeSignature ?? currentTs).split('/')[0], 10);
      if (track.accentPattern.length === beats && track.accentPattern.every((v) => Number.isInteger(v) && v >= 0 && v <= 3)) {
        updateSettings({ accentPattern: [...track.accentPattern] });
      }
    }
  }, [setTimeSignature, setSubdivision, currentTs, updateSettings]);

  const [initialPlaylistId] = useState<string | null>(() => new URLSearchParams(location.search).get('playlist'));

  // Apply BPM, playlist and per-track settings from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bpmParam = params.get('bpm');
    const tsParam = params.get('ts');
    const subParam = params.get('sub');
    const accentsParam = params.get('accents');
    if (bpmParam) {
      const bpm = Number(bpmParam);
      if (!Number.isNaN(bpm)) metro.setBpm(bpm);
    }
    if (tsParam && TIME_SIGNATURES.includes(tsParam as TimeSignature)) {
      metro.setTimeSignature(tsParam as TimeSignature);
    }
    if (subParam && [1, 2, 3, 4].includes(Number(subParam))) {
      metro.setSubdivision(Number(subParam) as 1 | 2 | 3 | 4);
    }
    if (accentsParam) {
      const pattern = accentsParam.split(',').map(Number);
      const beats = tsParam && TIME_SIGNATURES.includes(tsParam as TimeSignature)
        ? parseInt(tsParam.split('/')[0], 10)
        : parseInt(metro.timeSignature.split('/')[0], 10);
      if (pattern.length === beats && pattern.every((v) => Number.isInteger(v) && v >= 0 && v <= 3)) {
        updateSettings({ accentPattern: pattern });
      }
    }
    const playlistParam = params.get('playlist');
    const settingsParam = params.get('settings');
    if (bpmParam || tsParam || subParam || accentsParam || playlistParam || settingsParam) {
      navigate(window.location.pathname, { replace: true });
    }
  }, [location.search, metro, updateSettings, navigate]);

  // Elapsed time display (kept for future use)

  const flashScreenActive = settings.flashScreen && metro.isPlaying && metro.currentBeat === 0;
  const flashNumbers = settings.flashNumbers && metro.isPlaying && metro.currentBeat === 0;

  return (
    <div className="relative flex flex-col h-full bg-[var(--base)]">
      {/* Fullscreen accent flash */}
      {flashScreenActive && <div key={metro.currentBeat} className="flash-overlay" />}

      {/* Top controls */}
      <div className="px-4 py-3 border-b border-[var(--line)]">
        <div className="flex flex-col items-center mb-3">
          <div className="h-9 flex items-center justify-center text-[var(--ink)] font-bold text-xs">Metronome</div>
          <BpmDisplay
            bpm={metro.bpm}
            flash={flashNumbers}
            lastTap={settings.tapHistory[settings.tapHistory.length - 1]}
            onIncrement={() => metro.setBpm(metro.bpm + 1)}
            onDecrement={() => metro.setBpm(metro.bpm - 1)}
          />
        </div>

        {/* Time signature selector */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs text-[var(--ink-3)]">Time Signature:</span>
          <select
            value={metro.timeSignature}
            onChange={(e) => metro.setTimeSignature(e.target.value as TimeSignature)}
            className="bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] text-xs rounded px-2 py-1 focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            {TIME_SIGNATURES.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center gap-2">
          <PlayBar isPlaying={metro.isPlaying} onToggle={metro.toggle} />
        </div>

        {/* Playlist selector - below play button */}
        <PlaylistPlayer
          initialPlaylistId={initialPlaylistId}
          onBpmChange={metro.setBpm}
          onSettingsChange={applyTrackSettings}
          isPlaying={metro.isPlaying}
          onTogglePlay={metro.toggle}
        />
      </div>

      {/* Tap wheel + visual beat indicator */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0 gap-2">
        {settings.pendulum ? (
          <div className="pendulum">
            <div
              className="pendulum-rod"
              style={{ animationDuration: `${2 * (60 / metro.bpm)}s` }}
            />
            <div className="pendulum-weight" />
          </div>
        ) : (
          <TapWheel onTap={handleTap} onRotate={(delta) => { const newBpm = Math.max(40, Math.min(240, bpmRef.current + delta)); bpmRef.current = newBpm; metro.setBpm(newBpm); }} size={wheelSize} />
        )}
        {/* Visual beat indicator */}
        <div className="flex gap-2">
          {Array.from({ length: parseInt(metro.timeSignature.split('/')[0]) }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-100 ${
                metro.currentBeat === i
                  ? i === 0
                    ? 'bg-[var(--accent)] scale-125 shadow-[0_0_8px_var(--accent-glow)]'
                    : 'bg-[var(--ink)] scale-110'
                  : 'bg-[var(--line-2)]'
              }`}
            />
          ))}
        </div>
        {/* Beat accents + Subdivision merged section */}
        <div className="w-full max-w-md mt-1 space-y-2">
          <div>
            <p className="text-[10px] text-[var(--ink-3)] mb-1 text-center">Beat Accents</p>
            <BeatAccentBar
              timeSignature={metro.timeSignature}
              accentPattern={settings.accentPattern}
              onChange={(pattern) => updateSettings({ accentPattern: pattern })}
              previewSound={metro.previewSound}
              volumes={{
                low: settings.accentLow / 100,
                mid: settings.accentMid / 100,
                high: settings.accentHigh / 100,
              }}
            />
          </div>
          <div>
            <p className="text-[10px] text-[var(--ink-3)] mb-1 text-center">Subdivision</p>
            <SubdivisionButtons value={metro.subdivision} onChange={metro.setSubdivision} />
          </div>
        </div>
      </div>

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={(patch) => updateSettings(patch)}
        previewSound={metro.previewSound}
      />
    </div>
  );
}
