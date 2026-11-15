import { db } from './db';

export async function cacheTracks(tracks: any[]) {
  await db.tracks.bulkPut(tracks);
}

export async function getCachedTracks(): Promise<any[]> {
  return db.tracks.toArray();
}

export async function cachePlaylists(playlists: any[]) {
  await db.playlists.bulkPut(playlists);
}

export async function getCachedPlaylists(): Promise<any[]> {
  return db.playlists.toArray();
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectivityChange(callback: (online: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}