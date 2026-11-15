import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cacheTracks, getCachedTracks, isOnline } from '@/lib/sync';
import type { Track } from '@/types';

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    if (isOnline()) {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setTracks(data as Track[]);
        await cacheTracks(data as Track[]);
      }
    } else {
      const cached = await getCachedTracks();
      setTracks(cached as Track[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const addYouTubeTrack = useCallback(async (url: string, title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: track, error } = await supabase
      .from('tracks')
      .insert({ user_id: user.id, title, youtube_url: url, source: 'youtube', status: 'processing' })
      .select()
      .single();

    if (error) throw error;

    const { error: fnError } = await supabase.functions.invoke('extract-bpm', {
      body: { youtube_url: url, track_id: track.id },
    });

    if (fnError) {
      await supabase.from('tracks').update({ status: 'failed' }).eq('id', track.id);
      throw new Error(fnError.message || 'BPM extraction failed');
    }

    await fetchTracks();
    return track as Track;
  }, [fetchTracks]);

  const addManualTrack = useCallback(async (title: string, bpm: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: track, error } = await supabase
      .from('tracks')
      .insert({ user_id: user.id, title, bpm, source: 'manual', status: 'ready' })
      .select()
      .single();

    if (error) throw error;
    await fetchTracks();
    return track as Track;
  }, [fetchTracks]);

  const deleteTrack = useCallback(async (id: string) => {
    await supabase.from('tracks').delete().eq('id', id);
    await fetchTracks();
  }, [fetchTracks]);

  return { tracks, loading, fetchTracks, addYouTubeTrack, addManualTrack, deleteTrack };
}