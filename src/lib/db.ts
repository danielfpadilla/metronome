import Dexie, { type Table } from 'dexie';
import type { Track, Playlist } from '@/types';

class MetronomeDB extends Dexie {
  tracks!: Table<Track>;
  playlists!: Table<Playlist>;

  constructor() {
    super('metronome');
    this.version(1).stores({
      tracks: 'id, user_id, title, bpm, source, created_at',
      playlists: 'id, user_id, name, created_at',
    });
  }
}

export const db = new MetronomeDB();