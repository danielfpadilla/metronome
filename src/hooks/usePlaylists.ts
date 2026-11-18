import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import type { Playlist, PlaylistTrack, Track } from '@/types';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await db.playlists.toArray();
      setPlaylists(cached as Playlist[]);
    } catch {
      setPlaylists([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      user_id: 'local',
      name,
      description: description || null,
      created_at: new Date().toISOString(),
      tracks: [],
    };
    await db.playlists.add(playlist);
    await fetchPlaylists();
    return playlist;
  }, [fetchPlaylists]);

  const deletePlaylist = useCallback(async (id: string) => {
    await db.playlists.delete(id);
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string, position: number) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;
    const track = await db.tracks.get(trackId);
    const pt: PlaylistTrack = {
      playlist_id: playlistId,
      track_id: trackId,
      position,
      track: track as Track,
    };
    playlist.tracks = [...(playlist.tracks || []), pt];
    await db.playlists.put(playlist);
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;
    playlist.tracks = (playlist.tracks || []).filter((pt) => pt.track_id !== trackId);
    await db.playlists.put(playlist);
    await fetchPlaylists();
  }, [fetchPlaylists]);

  const reorderTracks = useCallback(async (playlistId: string, trackIds: string[]) => {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;
    const trackMap = new Map((playlist.tracks || []).map((pt) => [pt.track_id, pt]));
    playlist.tracks = trackIds.map((id, i) => {
      const pt = trackMap.get(id)!;
      pt.position = i;
      return pt;
    });
    await db.playlists.put(playlist);
    await fetchPlaylists();
  }, [fetchPlaylists]);

  return {
    playlists, loading, fetchPlaylists, createPlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks,
  };
}
