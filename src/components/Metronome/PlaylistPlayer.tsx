import { useState, useCallback, useEffect } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useTracks } from '@/hooks/useTracks';
import type { Track } from '@/types';

interface PlaylistPlayerProps {
  initialPlaylistId?: string | null;
  onBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function PlaylistPlayer({ initialPlaylistId, onBpmChange, isPlaying, onTogglePlay }: PlaylistPlayerProps) {
  const { playlists } = usePlaylists();
  const { tracks } = useTracks();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(initialPlaylistId || null);

  // Sync with initialPlaylistId prop
  useEffect(() => {
    if (initialPlaylistId) {
      setSelectedPlaylistId(initialPlaylistId);
      setCurrentIndex(0);
    }
  }, [initialPlaylistId]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrackList, setShowTrackList] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;
  const playlistTracks = selectedPlaylist?.tracks || [];

  const getTrack = useCallback((trackId: string): Track | undefined => {
    return tracks.find((t) => t.id === trackId);
  }, [tracks]);

  const currentTrack = getTrack(playlistTracks[currentIndex]?.track_id ?? '');

  // Sync BPM when track changes
  useEffect(() => {
    if (currentTrack?.bpm) {
      onBpmChange(currentTrack.bpm);
    }
  }, [currentIndex, currentTrack, onBpmChange]);

  const goToTrack = useCallback((index: number) => {
    if (index < 0 || index >= playlistTracks.length) return;
    setCurrentIndex(index);
  }, [playlistTracks.length]);

  const nextTrack = useCallback(() => {
    if (currentIndex < playlistTracks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, playlistTracks.length]);

  const prevTrack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handlePlaylistChange = useCallback((playlistId: string) => {
    if (playlistId === '') {
      setSelectedPlaylistId(null);
      return;
    }
    setSelectedPlaylistId(playlistId);
    setCurrentIndex(0);
  }, []);

  if (playlists.length === 0) {
    return (
      <div className="px-3 py-2 border-t border-[var(--line)] text-center">
        <p className="text-xs text-[var(--ink-3)]">
          No playlists yet. Create one in the{' '}
          <a href="/playlists" className="text-[var(--accent)] hover:underline">Playlists</a> page.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface)]">
      {/* Playlist selector + transport - compact row */}
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <select
          value={selectedPlaylistId || ''}
          onChange={(e) => handlePlaylistChange(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1.5 bg-[var(--base)] border border-[var(--line)] rounded text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)] transition-colors truncate"
          style={{ maxWidth: '40%' }}
        >
          <option value="">Playlist...</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.tracks?.length ?? 0})
            </option>
          ))}
        </select>

        {selectedPlaylist && (
          <>
            <button
              onClick={prevTrack}
              disabled={currentIndex === 0}
              className="w-9 h-9 flex items-center justify-center rounded text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
              aria-label="Previous track"
            >
              ◀
            </button>
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 flex items-center justify-center rounded bg-[var(--accent)] text-[var(--base)] font-bold text-xs hover:shadow-[0_0_8px_var(--accent-glow)] transition-shadow flex-shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              onClick={nextTrack}
              disabled={currentIndex >= playlistTracks.length - 1}
              className="w-9 h-9 flex items-center justify-center rounded text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
              aria-label="Next track"
            >
              ▶▶
            </button>
            <button
              onClick={() => setShowTrackList(!showTrackList)}
              className="w-9 h-9 flex items-center justify-center rounded text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors text-xs flex-shrink-0"
              aria-label={showTrackList ? 'Hide track list' : 'Show track list'}
              aria-expanded={showTrackList}
            >
              {showTrackList ? '▲' : '▼'}
            </button>
          </>
        )}
      </div>

      {/* Current track info - compact single line */}
      {selectedPlaylist && currentTrack && (
        <div className="px-3 pb-1.5 flex items-center gap-2">
          <span className="text-[10px] text-[var(--ink-3)] font-mono">
            {currentIndex + 1}/{playlistTracks.length}
          </span>
          <span className="text-xs text-[var(--ink)] truncate flex-1">
            {currentTrack.title}
          </span>
          <span className="text-xs text-[var(--accent)] font-mono flex-shrink-0">
            {currentTrack.bpm ?? '—'}
          </span>
        </div>
      )}

      {/* Track list (collapsible, scrollable, max height) */}
      {selectedPlaylist && showTrackList && (
        <div className="px-3 pb-2 max-h-32 overflow-y-auto">
          <div className="space-y-0.5">
            {playlistTracks.map((pt, index) => {
              const track = getTrack(pt.track_id);
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={pt.track_id}
                  onClick={() => goToTrack(index)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
                    isCurrent
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="w-4 text-center text-[10px]">{isCurrent ? '▶' : index + 1}</span>
                  <span className="flex-1 truncate">{track?.title ?? 'Unknown'}</span>
                  <span className="text-[var(--ink-3)] font-mono text-[10px]">{track?.bpm ?? '—'}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
