import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Track } from '@/types';

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await db.tracks.toArray();
      setTracks(cached as Track[]);
    } catch {
      setTracks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

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
    await db.tracks.add(track);
    await fetchTracks();
    return track;
  }, [fetchTracks]);

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
    await db.tracks.add(track);
    await fetchTracks();
    return track;
  }, [fetchTracks]);

  const deleteTrack = useCallback(async (id: string) => {
    await db.tracks.delete(id);
    await fetchTracks();
  }, [fetchTracks]);

  return { tracks, loading, fetchTracks, addYouTubeTrack, addManualTrack, deleteTrack };
}
