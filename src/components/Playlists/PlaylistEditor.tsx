import { useState } from 'react';
import { useTracks } from '@/hooks/useTracks';
import type { Playlist, Track } from '@/types';

interface PlaylistEditorProps {
  playlist: Playlist;
  availableTracks: Track[];
  onAddTrack: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onReorder: (trackIds: string[]) => void;
  onPlay: () => void;
  firstTrackTitle?: string;
  firstTrackBpm?: number;
}

export function PlaylistEditor({ playlist, availableTracks, onAddTrack, onRemoveTrack, onReorder, onPlay, firstTrackTitle, firstTrackBpm }: PlaylistEditorProps) {
  const { tracks: allTracks } = useTracks();
  const [selectedTrack, setSelectedTrack] = useState('');
  const getTrack = (trackId: string) => allTracks.find((t) => t.id === trackId);

  const tracks = playlist.tracks || [];
  const trackIds = tracks.map((pt) => pt.track_id);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...trackIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    onReorder(newIds);
  };

  const moveDown = (index: number) => {
    if (index === tracks.length - 1) return;
    const newIds = [...trackIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    onReorder(newIds);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--ink)]">{playlist.name}</h2>
        <button
          onClick={onPlay}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg text-sm hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow"
        >
          ▶ Play Playlist
        </button>
      </div>

      {firstTrackTitle && (
        <div className="mb-4 p-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--ink-3)]">First track to play</p>
            <p className="text-[var(--ink)] text-sm truncate">{firstTrackTitle}</p>
          </div>
          <div className="text-right">
            <span className="text-[var(--accent)] font-bold">{firstTrackBpm} BPM</span>
            <span className="text-[var(--ink-3)] text-xs ml-2">4/4</span>
          </div>
        </div>
      )}

      {/* Add track */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="">Select a track to add...</option>
          {availableTracks
            .filter((t) => !trackIds.includes(t.id))
            .map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.bpm ?? '—'} BPM)</option>
            ))}
        </select>
        <button
          onClick={() => { if (selectedTrack) { onAddTrack(selectedTrack); setSelectedTrack(''); } }}
          disabled={!selectedTrack}
          className="px-4 py-2.5 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg text-sm disabled:opacity-50 transition-shadow"
        >
          Add
        </button>
      </div>

      {/* Track list with reorder */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <p className="text-[var(--ink-2)]">No tracks in this playlist yet</p>
          <p className="text-[var(--ink-3)] text-sm">Select a track above to add it</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((pt, index) => (
            <div
              key={pt.track_id}
              className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg p-3"
            >
              <span className="text-[var(--ink-3)] text-xs w-6">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--ink)] text-sm truncate">{getTrack(pt.track_id)?.title ?? 'Unknown'}</p>
                <p className="text-xs text-[var(--ink-3)]">{getTrack(pt.track_id)?.bpm ?? '—'} BPM</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-30 px-2 py-1 rounded transition-colors"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === tracks.length - 1}
                  className="text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-30 px-2 py-1 rounded transition-colors"
                  aria-label="Move down"
                >
                  ▼
                </button>
                <button
                  onClick={() => onRemoveTrack(pt.track_id)}
                  className="text-[var(--danger)] hover:text-red-300 px-2 py-1 rounded transition-colors"
                  aria-label="Remove track"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}