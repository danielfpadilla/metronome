import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Playlist } from '@/types';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_tracks(*, tracks(*))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = (data as any[]).map((p) => ({
        ...p,
        tracks: (p.playlist_tracks || [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((pt: any) => ({ ...pt, track: pt.tracks })),
      }));
      setPlaylists(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name, description })
      .select()
      .single();
    if (error) throw error;
    await fetchPlaylists();
    return data as Playlist;
  }, [fetchPlaylists]);

  const deletePlaylist = useCallback(async (id: string) => {
    await supabase.from('playlists').delete().eq('id', id);
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string, position: number) => {
    await supabase.from('playlist_tracks').insert({ playlist_id: playlistId, track_id: trackId, position });
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    await supabase.from('playlist_tracks').delete().match({ playlist_id: playlistId, track_id: trackId });
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const reorderTracks = useCallback(async (playlistId: string, trackIds: string[]) => {
    for (let i = 0; i < trackIds.length; i++) {
      await supabase
        .from('playlist_tracks')
        .update({ position: i })
        .match({ playlist_id: playlistId, track_id: trackIds[i] });
    }
    await fetchPlaylists();
  }, [fetchPlaylists]);

  return {
    playlists, loading, fetchPlaylists, createPlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks,
  };
}