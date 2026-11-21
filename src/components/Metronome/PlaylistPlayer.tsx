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
    if (!initialPlaylistId) return;
    const playlist = playlists.find((p) => p.id === initialPlaylistId);
    if (!playlist) return;
    setSelectedPlaylistId(initialPlaylistId);
    setCurrentIndex(0);
  }, [initialPlaylistId, playlists]);
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

  const clearPlaylist = useCallback(() => {
    setSelectedPlaylistId(null);
    setCurrentIndex(0);
    setShowTrackList(false);
  }, []);

  if (!selectedPlaylist) {
    // Show selector when no playlist is loaded
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
      <div className="mt-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-[var(--ink-3)] text-xs">♫</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setSelectedPlaylistId(e.target.value);
                setCurrentIndex(0);
              }
            }}
            className="flex-1 min-w-0 px-2 py-1.5 bg-[var(--base)] border border-[var(--line)] rounded text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">Select a playlist...</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tracks?.length ?? 0} tracks)
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-2 bg-[var(--surface-2)] border border-[var(--line)] rounded-lg overflow-hidden">
      {/* Transport + current track */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={prevTrack}
          disabled={currentIndex === 0}
          className="w-8 h-8 flex items-center justify-center rounded text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
          aria-label="Previous track"
        >
          ◀
        </button>
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 flex items-center justify-center rounded bg-[var(--accent)] text-[var(--base)] font-bold text-xs hover:shadow-[0_0_8px_var(--accent-glow)] transition-shadow flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button
          onClick={nextTrack}
          disabled={currentIndex >= playlistTracks.length - 1}
          className="w-8 h-8 flex items-center justify-center rounded text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs flex-shrink-0"
          aria-label="Next track"
        >
          ▶▶
        </button>

        {currentTrack && (
          <div className="flex-1 min-w-0 flex items-center gap-2 ml-1">
            <span className="text-[10px] text-[var(--ink-3)] font-mono flex-shrink-0">
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

        <button
          onClick={() => setShowTrackList(!showTrackList)}
          className="px-2 h-8 flex items-center justify-center rounded text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors text-xs flex-shrink-0"
          aria-label={showTrackList ? 'Hide track list' : 'Show track list'}
          aria-expanded={showTrackList}
        >
          {showTrackList ? 'Hide' : 'Tracks'}
        </button>
        <button
          onClick={clearPlaylist}
          className="px-2 h-8 flex items-center justify-center rounded text-[var(--ink-3)] hover:text-[var(--danger)] transition-colors text-xs flex-shrink-0"
          aria-label="Close playlist"
        >
          ✕
        </button>
      </div>

      {/* Track list (collapsible, overlay) */}
      {showTrackList && (
        <div className="absolute left-0 right-0 mt-1 mx-4 max-h-40 overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-lg z-10">
          <div className="space-y-0.5 p-2">
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
