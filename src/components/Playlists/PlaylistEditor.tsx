import { useState } from 'react';
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
  const [selectedTrack, setSelectedTrack] = useState('');

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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{playlist.name}</h2>
        <button
          onClick={onPlay}
          className="px-4 py-2 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm"
        >
          ▶ Play Playlist
        </button>
      </div>

      {firstTrackTitle && (
        <div className="mb-4 p-3 bg-[#1a1a24] border border-[#333] rounded-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-[#888]">First track to play</p>
            <p className="text-white text-sm truncate">{firstTrackTitle}</p>
          </div>
          <div className="text-right">
            <span className="text-[#00e0c6] font-bold">{firstTrackBpm} BPM</span>
            <span className="text-[#888] text-xs ml-2">4/4</span>
          </div>
        </div>
      )}

      {/* Add track */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
        >
          <option value="">Select a track to add...</option>
          {availableTracks
            .filter((t) => !trackIds.includes(t.id))
            .map((t) => (
              <option key={t.id} value={t.id}>{t.title} ({t.bpm} BPM)</option>
            ))}
        </select>
        <button
          onClick={() => { if (selectedTrack) { onAddTrack(selectedTrack); setSelectedTrack(''); } }}
          disabled={!selectedTrack}
          className="px-4 py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Track list with reorder */}
      {tracks.length === 0 ? (
        <p className="text-[#888] text-center py-8">No tracks in this playlist yet.</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((pt, index) => (
            <div
              key={pt.track_id}
              className="flex items-center gap-3 bg-[#1a1a24] border border-[#333] rounded-lg p-3"
            >
              <span className="text-[#555] text-xs w-6">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{pt.track?.title ?? 'Unknown'}</p>
                <p className="text-xs text-[#888]">{pt.track?.bpm ?? '—'} BPM</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-[#888] hover:text-white disabled:opacity-30 px-1"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === tracks.length - 1}
                  className="text-[#888] hover:text-white disabled:opacity-30 px-1"
                >
                  ▼
                </button>
                <button
                  onClick={() => onRemoveTrack(pt.track_id)}
                  className="text-red-400 hover:text-red-300 px-1"
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