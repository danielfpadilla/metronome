import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTracks } from '@/hooks/useTracks';

describe('useTracks.addManualTrack', () => {
  beforeEach(() => localStorage.clear());

  it('persists optional track settings', async () => {
    const { result } = renderHook(() => useTracks());
    const settings = { timeSignature: '3/4', subdivision: 3, accentPattern: [3, 2, 0] } as const;
    let saved: Awaited<ReturnType<typeof result.current.addManualTrack>> | undefined;
    await act(async () => {
      saved = await result.current.addManualTrack('My Track', 132, settings);
    });
    expect(saved).toMatchObject({
      title: 'My Track', bpm: 132, source: 'manual', status: 'ready', ...settings,
    });
    const stored = JSON.parse(localStorage.getItem('metronome-tracks') ?? '[]');
    expect(stored[0]).toMatchObject(settings);
  });
});
