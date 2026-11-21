import { useState, useEffect, useCallback } from 'react';
import type { MetronomeSettings } from '@/components/Metronome/SettingsPanel';

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
  accentPattern: [3, 2, 2, 2],
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

export function useSettings() {
  const [settings, setSettings] = useState<MetronomeSettings>(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota errors */
    }
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<MetronomeSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, loading: false, updateSettings };
}
