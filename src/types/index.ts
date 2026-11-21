export interface Track {
  id: string;
  user_id: string;
  title: string;
  youtube_url: string | null;
  bpm: number | null;
  duration_seconds: number | null;
  storage_path: string | null;
  cover_art_url: string | null;
  source: 'youtube' | 'manual';
  created_at: string;
  status?: 'processing' | 'ready' | 'failed' | 'manual_bpm_pending';
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export type TimeSignature = '2/4' | '3/4' | '4/4' | '6/8';

export type Subdivision = 1 | 2 | 3 | 4;

export interface MetronomeState {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  isPlaying: boolean;
  currentBeat: number;
  accentPattern: number[];
}