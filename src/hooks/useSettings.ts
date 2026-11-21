import { useState, useEffect, useCallback } from 'react';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
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

function loadLocalSettings(): MetronomeSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MetronomeSettings>(loadLocalSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from Firestore when authenticated
  useEffect(() => {
    if (!user) {
      // Use local settings
      setSettings(loadLocalSettings());
      setLoading(false);
      return;
    }

    const settingsRef = doc(firestoreDb, 'users', user.id, 'settings', 'metronome');

    // Real-time listener
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MetronomeSettings;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } else {
        // No cloud settings yet, push local settings to cloud
        const local = loadLocalSettings();
        setDoc(settingsRef, local).catch(() => {});
        setSettings(local);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Settings listener error:', err);
      setSettings(loadLocalSettings());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Save settings to Firestore when changed (if authenticated)
  const updateSettings = useCallback((patch: Partial<MetronomeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      // Save to localStorage always
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }

      // Save to Firestore if authenticated
      if (user) {
        const settingsRef = doc(firestoreDb, 'users', user.id, 'settings', 'metronome');
        setDoc(settingsRef, next).catch((err) => {
          console.warn('Failed to save settings to Firestore:', err);
        });
      }

      return next;
    });
  }, [user]);

  return { settings, loading, updateSettings };
}
