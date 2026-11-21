import { useState, useEffect, useCallback } from 'react';
import type { Playlist, PlaylistTrack, Track } from '@/types';

const STORAGE_KEY = 'metronome-playlists';

function loadPlaylists(): Playlist[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function savePlaylists(playlists: Playlist[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  } catch {
    /* ignore quota errors */
  }
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists);
  const [loading] = useState(false);

  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      user_id: 'local',
      name,
      description: description || null,
      created_at: new Date().toISOString(),
      tracks: [],
    };
    setPlaylists((prev) => [playlist, ...prev]);
    return playlist;
  }, []);

  const deletePlaylist = useCallback(async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string, position: number) => {
    // Find the track from all tracks in localStorage
    let track: Track | undefined;
    try {
      const tracksSaved = localStorage.getItem('metronome-tracks');
      const tracks: Track[] = tracksSaved ? JSON.parse(tracksSaved) : [];
      track = tracks.find((t) => t.id === trackId);
    } catch {
      /* ignore */
    }

    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const pt: PlaylistTrack = {
          playlist_id: playlistId,
          track_id: trackId,
          position,
          track: track,
        };
        return { ...p, tracks: [...(p.tracks || []), pt] };
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        return { ...p, tracks: (p.tracks || []).filter((pt) => pt.track_id !== trackId) };
      })
    );
  }, []);

  const reorderTracks = useCallback(async (playlistId: string, trackIds: string[]) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const trackMap = new Map((p.tracks || []).map((pt) => [pt.track_id, pt]));
        return {
          ...p,
          tracks: trackIds.map((id, i) => {
            const pt = trackMap.get(id)!;
            return { ...pt, position: i };
          }),
        };
      })
    );
  }, []);

  return {
    playlists, loading, createPlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks,
  };
}
