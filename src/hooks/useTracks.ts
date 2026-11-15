import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Track } from '@/types';

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setTracks(data as Track[]);
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

    await supabase.functions.invoke('extract-bpm', {
      body: { youtube_url: url, track_id: track.id },
    });

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