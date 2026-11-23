import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '@/hooks/useSettings';
import { appendTapHistory } from '@/lib/bpmMath';

describe('useSettings.updateSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts an object patch', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ theme: 'light' });
    });
    expect(result.current.settings.theme).toBe('light');
  });

  it('accepts an updater function and persists history', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings((prev) => ({
        tapHistory: appendTapHistory(prev.tapHistory, 128),
      }));
    });
    expect(result.current.settings.tapHistory).toEqual([128]);
    const saved = JSON.parse(localStorage.getItem('metronome-settings') ?? '{}');
    expect(saved.tapHistory).toEqual([128]);
  });
});
