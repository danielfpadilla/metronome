import { useState, useEffect, useCallback } from 'react';
import { db as firestoreDb } from '@/lib/firebase';
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
      setTracks([]);
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
    } catch (err) {
      console.warn('Firestore fetch failed:', err);
      setTracks([]);
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

    await setDoc(doc(firestoreDb, 'users', user.id, 'tracks', track.id), track);
    // Refresh tracks list
    const tracksRef = collection(firestoreDb, 'users', user.id, 'tracks');
    const q = query(tracksRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
    setTracks(data);
    return track;
  }, [user]);

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

    await setDoc(doc(firestoreDb, 'users', user.id, 'tracks', track.id), track);
    // Refresh tracks list
    const tracksRef = collection(firestoreDb, 'users', user.id, 'tracks');
    const q = query(tracksRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
    setTracks(data);
    return track;
  }, [user]);

  const deleteTrack = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(firestoreDb, 'users', user.id, 'tracks', id));
    // Refresh tracks list
    const tracksRef = collection(firestoreDb, 'users', user.id, 'tracks');
    const q = query(tracksRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Track));
    setTracks(data);
  }, [user]);

  return { tracks, loading, fetchTracks, addYouTubeTrack, addManualTrack, deleteTrack };
}
