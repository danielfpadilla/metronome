import { useState, useEffect, useCallback } from 'react';
import { db as firestoreDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
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
      setPlaylists([]);
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
    } catch (err) {
      console.warn('Firestore fetch failed:', err);
      setPlaylists([]);
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

    await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlist.id), playlist);
    return playlist;
  }, [user]);

  const deletePlaylist = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(firestoreDb, 'users', user.id, 'playlists', id));
  }, [user]);

  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string, position: number) => {
    if (!user) return;
    // Need to fetch the track from Firestore
    // For now, just update the playlist
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    // Fetch track from Firestore
    let track: Track | null = null;
    try {
      const trackDoc = await getDoc(doc(firestoreDb, 'users', user.id, 'tracks', trackId));
      if (trackDoc.exists()) {
        track = { id: trackDoc.id, ...trackDoc.data() } as Track;
      }
    } catch (err) {
      console.warn('Failed to fetch track:', err);
    }

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

    await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
  }, [user, playlists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!user) return;
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updatedPlaylist = {
      ...playlist,
      tracks: (playlist.tracks || []).filter((pt) => pt.track_id !== trackId),
    };

    await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
  }, [user, playlists]);

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

    await setDoc(doc(firestoreDb, 'users', user.id, 'playlists', playlistId), updatedPlaylist);
  }, [user, playlists]);

  return {
    playlists, loading, fetchPlaylists, createPlaylist, deletePlaylist,
    addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks,
  };
}
