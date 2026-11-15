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
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
}