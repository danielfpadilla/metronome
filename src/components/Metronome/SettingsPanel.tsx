import { useState } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [countIn, setCountIn] = useState(false);
  const [pendulum, setPendulum] = useState(false);
  const [flashAccent, setFlashAccent] = useState(true);
  const [flashScreen, setFlashScreen] = useState(false);
  const [flashNumbers, setFlashNumbers] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accent1, setAccent1] = useState(50);
  const [accent2, setAccent2] = useState(50);
  const [accent3, setAccent3] = useState(50);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-[#888] hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          {/* Toggles */}
          {[
            { label: 'Start count-in', value: countIn, set: setCountIn },
            { label: 'Pendulum mode', value: pendulum, set: setPendulum },
            { label: 'Flash accent markers', value: flashAccent, set: setFlashAccent },
            { label: 'Flash screen', value: flashScreen, set: setFlashScreen },
            { label: 'Flash numbers', value: flashNumbers, set: setFlashNumbers },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-[#ccc]">{label}</span>
              <button
                onClick={() => set(!value)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  value ? 'bg-[#00e0c6]/30' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    value ? 'left-5 bg-[#00e0c6]' : 'left-0.5 bg-[#888]'
                  }`}
                />
              </button>
            </div>
          ))}

          {/* Theme */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ccc]">Theme</span>
            <div className="flex gap-1">
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-xs rounded ${theme === 'dark' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888]'}`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-xs rounded ${theme === 'light' ? 'bg-[#00e0c6] text-[#0f0f14]' : 'bg-[#0f0f14] text-[#888]'}`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Accent sounds */}
          <div className="pt-2 border-t border-[#333]">
            <h3 className="text-sm font-semibold text-white mb-3">Accent Sounds</h3>
            {[
              { label: 'Accent 1', value: accent1, set: setAccent1 },
              { label: 'Accent 2', value: accent2, set: setAccent2 },
              { label: 'Accent 3', value: accent3, set: setAccent3 },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#888] w-16">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => set(Number(e.target.value))}
                  className="flex-1 accent-[#00e0c6]"
                />
                <span className="text-xs text-[#888] w-8 text-right">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}