import { useState, useEffect, useCallback } from 'react';
import type { Track } from '@/types';

const STORAGE_KEY = 'metronome-tracks';

function loadTracks(): Track[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveTracks(tracks: Track[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
  } catch {
    /* ignore quota errors */
  }
}

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>(loadTracks);
  const [loading] = useState(false);

  // Persist to localStorage on change
  useEffect(() => {
    saveTracks(tracks);
  }, [tracks]);

  const addYouTubeTrack = useCallback(async (url: string, title: string) => {
    const track: Track = {
      id: crypto.randomUUID(),
      user_id: 'local',
      title: title || 'Untitled Track',
      youtube_url: url,
      bpm: null,
      duration_seconds: null,
      storage_path: null,
      cover_art_url: null,
      source: 'youtube',
      created_at: new Date().toISOString(),
      status: 'manual_bpm_pending',
    };
    setTracks((prev) => [track, ...prev]);
    return track;
  }, []);

  const addManualTrack = useCallback(async (title: string, bpm: number) => {
    const track: Track = {
      id: crypto.randomUUID(),
      user_id: 'local',
      title: title || 'Untitled Track',
      youtube_url: null,
      bpm,
      duration_seconds: null,
      storage_path: null,
      cover_art_url: null,
      source: 'manual',
      created_at: new Date().toISOString(),
      status: 'ready',
    };
    setTracks((prev) => [track, ...prev]);
    return track;
  }, []);

  const deleteTrack = useCallback(async (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tracks, loading, addYouTubeTrack, addManualTrack, deleteTrack };
}
