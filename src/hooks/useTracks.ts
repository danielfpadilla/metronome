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
import type { Track } from '@/types';

export function useTracks() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = useCallback(async () => {
    if (!user) {
      // Offline fallback: read from IndexedDB
      try {
        const cached = await localDb.tracks.toArray();
        setTracks(cached as Track[]);
      } catch {
        setTracks([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const tracksRef = collection(firestoreDb, 'users', user.id, 'tracks');
      const q = query(tracksRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
      setTracks(data);
      // Cache locally for offline
      await localDb.tracks.clear();
      await localDb.tracks.bulkPut(data);
    } catch (err) {
      // Offline fallback
      console.warn('Firestore fetch failed, using local cache:', err);
      const cached = await localDb.tracks.toArray();
      setTracks(cached as Track[]);
    }
    setLoading(false);
  }, [user]);

  // Real-time listener
  useEffect(() => {
    if (!user) return;

    const tracksRef = collection(firestoreDb, 'users', user.id, 'tracks');
    const q = query(tracksRef, orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
      setTracks(data);
      // Update local cache
      localDb.tracks.clear().then(() => localDb.tracks.bulkPut(data)).catch(() => {});
    }, (err) => {
      console.warn('Firestore listener error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const addYouTubeTrack = useCallback(async (url: string, title: string) => {
    if (!user) throw new Error('Not authenticated');

    const track: Track = {
      id: crypto.randomUUID(),
      user_id: user.id,
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

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'tracks', track.id), track);
    } catch {
      // Offline: save locally
      await localDb.tracks.add(track);
    }
    await fetchTracks();
    return track;
  }, [user, fetchTracks]);

  const addManualTrack = useCallback(async (title: string, bpm: number) => {
    if (!user) throw new Error('Not authenticated');

    const track: Track = {
      id: crypto.randomUUID(),
      user_id: user.id,
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

    try {
      await setDoc(doc(firestoreDb, 'users', user.id, 'tracks', track.id), track);
    } catch {
      await localDb.tracks.add(track);
    }
    await fetchTracks();
    return track;
  }, [user, fetchTracks]);

  const deleteTrack = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestoreDb, 'users', user.id, 'tracks', id));
    } catch {
      await localDb.tracks.delete(id);
    }
    await fetchTracks();
  }, [user, fetchTracks]);

  return { tracks, loading, fetchTracks, addYouTubeTrack, addManualTrack, deleteTrack };
}
