import { useState, useEffect, useCallback } from 'react';
import { db as firestoreDb } from '@/lib/firebase';
import { db as localDb } from '@/lib/db';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Playlist, PlaylistTrack, Track } from '@/types';

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      try {
        const cached = await localDb.playlists.toArray();
        setPlaylists(cached as Playlist[]);
      } catch {
        setPlaylists([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const playlistsRef = collection(firestoreDb, 'users', user.id, 'playlists');
      const q = query(playlistsRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist));
      setPlaylists(data);
      await localDb.playlists.clear();
      await localDb.playlists.bulkPut(data);
    } catch (err) {
      console.warn('Firestore fetch failed, using local cache:', err);
      const cached = await localDb.playlists.toArray();
      setPlaylists(cached as Playlist[]);
    }
    setLoading(false);
  }, [user]);

  // Real-time listener
  useEffect(() => {
    if (!user) return;

    const playlistsRef = collection(firestoreDb, 'users', user.id, 'playlists');
    const q = query(playlistsRef, orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist));
      setPlaylists(data);
      localDb.playlists.clear().then(() => localDb.playlists.bulkPut(data)).catch(() => {});
    }, (err) => {
      console.warn('Firestore listener error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!user) throw new Error('Not authenticated');

    const playlist: Playlist = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      description: description || null,
      created_at: new Date().toISOString(),
      tracks: [],
    };

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlist.id), playlist);
    } catch {
      await localDb.playlists.add(playlist);
    }
    await fetchPlaylists();
    return playlist;
  }, [user, fetchPlaylists]);

  const deletePlaylist = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestoreDb, 'users', user.id, 'playlists', id));
    } catch {
      await localDb.playlists.delete(id);
    }
    await fetchPlaylists();
  }, [user, fetchPlaylists]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string, position: number) => {
    if (!user) return;
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const track = await localDb.tracks.get(trackId);
    const pt: PlaylistTrack = {
      playlist_id: playlistId,
      track_id: trackId,
      position,
      track: track as Track,
    };

    const updatedPlaylist = {
      ...playlist,
      tracks: [...(playlist.tracks || []), pt],
    };

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
    } catch {
      await localDb.playlists.put(updatedPlaylist);
    }
    await fetchPlaylists();
  }, [user, playlists, fetchPlaylists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!user) return;
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updatedPlaylist = {
      ...playlist,
      tracks: (playlist.tracks || []).filter((pt) => pt.track_id !== trackId),
    };

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
    } catch {
      await localDb.playlists.put(updatedPlaylist);
    }
    await fetchPlaylists();
  }, [user, playlists, fetchPlaylists]);

  const reorderTracks = useCallback(async (playlistId: string, trackIds: string[]) => {
    if (!user) return;
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const trackMap = new Map((playlist.tracks || []).map((pt) => [pt.track_id, pt]));
    const updatedPlaylist = {
      ...playlist,
      tracks: trackIds.map((id, i) => {
        const pt = trackMap.get(id)!;
        return { ...pt, position: i };
      }),
    };

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
    } catch {
      await localDb.playlists.put(updatedPlaylist);
    }
    await fetchPlaylists();
  }, [user, playlists, fetchPlaylists]);

  return {
    playlists, loading, fetchPlaylists, createPlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks,
  };
}
