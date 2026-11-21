import { useEffect } from 'react';

export interface MetronomeSettings {
  countIn: boolean;
  pendulum: boolean;
  flashAccent: boolean;
  flashScreen: boolean;
  flashNumbers: boolean;
  theme: 'dark' | 'light';
  accentLow: number;
  accentMid: number;
  accentHigh: number;
  soundType: 'woodblock' | 'beep' | 'click';
  accentPattern: number[]; // 0=off, 1=low, 2=mid, 3=high per beat
  tapHistory: number[]; // recent tap-tempo BPM estimates, newest last
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MetronomeSettings;
  onChange: (patch: Partial<MetronomeSettings>) => void;
  previewSound: (level: number, volume: number) => void;
}

const TOGGLES: { key: keyof MetronomeSettings; label: string }[] = [
  { key: 'countIn', label: 'Start count-in' },
  { key: 'pendulum', label: 'Pendulum mode' },
  { key: 'flashAccent', label: 'Flash accent markers' },
  { key: 'flashScreen', label: 'Flash screen' },
  { key: 'flashNumbers', label: 'Flash numbers' },
];

const SOUND_TYPES = [
  { value: 'woodblock', label: 'Woodblock' },
  { value: 'beep', label: 'Beep' },
  { value: 'click', label: 'Click' },
] as const;

export function SettingsPanel({ isOpen, onClose, settings, onChange, previewSound }: SettingsPanelProps) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-[var(--line)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--ink)]">Settings</h2>
          <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4">
          {/* Toggles */}
          {TOGGLES.map(({ key, label }) => {
            const value = settings[key] as boolean;
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-[#ccc]">{label}</span>
                <button
                  onClick={() => onChange({ [key]: !value } as Partial<MetronomeSettings>)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    value ? 'bg-[#00e0c6]/30' : 'bg-[#333]'
                  }`}
                  role="switch"
                  aria-checked={value}
                  aria-label={label}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      value ? 'left-5 bg-[#00e0c6]' : 'left-0.5 bg-[#888]'
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {/* Theme */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ccc]">Theme</span>
            <div className="flex gap-1">
              <button
                onClick={() => onChange({ theme: 'dark' })}
                className={`px-3 py-1 text-xs rounded ${settings.theme === 'dark' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888]'}`}
              >
                Dark
              </button>
              <button
                onClick={() => onChange({ theme: 'light' })}
                className={`px-3 py-1 text-xs rounded ${settings.theme === 'light' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888]'}`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Sound type selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ccc]">Sound Type</span>
            <div className="flex gap-1">
              {SOUND_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onChange({ soundType: value })}
                  className={`px-3 py-1 text-xs rounded ${settings.soundType === value ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tap history */}
          <div className="pt-2 border-t border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Tap History</h3>
              <button
                onClick={() => onChange({ tapHistory: [] })}
                disabled={settings.tapHistory.length === 0}
                className="text-xs text-[var(--ink-3)] hover:text-[var(--danger)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[var(--ink-3)]"
              >
                Clear
              </button>
            </div>
            {settings.tapHistory.length === 0 ? (
              <p className="text-xs text-[var(--ink-3)]">No taps recorded</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {settings.tapHistory.map((bpm, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--ink-2)] font-mono">{bpm}</span>
                ))}
              </div>
            )}
          </div>

          {/* Accent volume levels */}
          <div className="pt-2 border-t border-[#333]">
            <h3 className="text-sm font-semibold text-white mb-3">Accent Volumes</h3>
            {(
              [
                { key: 'accentLow', label: 'Low' },
                { key: 'accentMid', label: 'Mid' },
                { key: 'accentHigh', label: 'High' },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#888] w-12">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings[key]}
                  onChange={(e) => onChange({ [key]: Number(e.target.value) } as Partial<MetronomeSettings>)}
                  className="flex-1 accent-[#00e0c6]"
                  aria-label={`${label} volume`}
                />
                <span className="text-xs text-[#888] w-8 text-right">{settings[key]}%</span>
                <button
                  onClick={() => {
                    const level = key === 'accentLow' ? 1 : key === 'accentMid' ? 2 : 3;
                    previewSound(level, settings[key] / 100);
                  }}
                  className="w-8 h-8 rounded-full bg-[#0f0f14] border border-[#333] text-[#888] hover:text-[#00e0c6] hover:border-[#00e0c6] transition-colors flex items-center justify-center text-sm"
                  aria-label={`Preview ${label}`}
                  title={`Preview ${label}`}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
