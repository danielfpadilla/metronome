import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracks } from '@/hooks/useTracks';
import { TrackCard } from './TrackCard';
import { AddTrackModal } from './AddTrackModal';

export function Library() {
  const { tracks, loading, addYouTubeTrack, addManualTrack, deleteTrack } = useTracks();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'youtube' | 'manual'>('all');
  const [bpmRange, setBpmRange] = useState<[number, number]>([0, 240]);
  const navigate = useNavigate();

  const filtered = tracks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || t.source === sourceFilter;
    const matchesBpm = (t.bpm ?? 0) >= bpmRange[0] && (t.bpm ?? 0) <= bpmRange[1];
    return matchesSearch && matchesSource && matchesBpm;
  });

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Library</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg text-sm hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow"
        >
          + Add Track
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tracks..."
        className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm mb-4 focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--ink-3)]"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="px-3 py-2 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
        >
          <option value="all">All Sources</option>
          <option value="youtube">YouTube</option>
          <option value="manual">Manual</option>
        </select>
        <input
          type="number"
          placeholder="Min BPM"
          value={bpmRange[0] || ''}
          onChange={(e) => setBpmRange([Number(e.target.value) || 0, bpmRange[1]])}
          className="w-20 px-2 py-2 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
        />
        <input
          type="number"
          placeholder="Max BPM"
          value={bpmRange[1] === 240 ? '' : bpmRange[1]}
          onChange={(e) => setBpmRange([bpmRange[0], Number(e.target.value) || 240])}
          className="w-20 px-2 py-2 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--ink-3)] text-sm">Loading tracks...</p>
        </div>
      ) : filtered.length === 0 && tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="text-5xl text-[var(--ink-3)]">♪</div>
          <div>
            <p className="text-[var(--ink)] font-medium mb-1">No tracks yet</p>
            <p className="text-[var(--ink-3)] text-sm">Add your first track to get started</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg text-sm hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow"
          >
            + Add Track
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-[var(--ink-2)]">No tracks match your filters</p>
          <button
            onClick={() => { setSearch(''); setSourceFilter('all'); setBpmRange([0, 240]); }}
            className="text-[var(--accent)] text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onDelete={() => deleteTrack(track.id)}
              onSelectTrack={(bpm) => navigate(`/?bpm=${bpm}`)}
            />
          ))}
        </div>
      )}

      <AddTrackModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddYouTube={addYouTubeTrack}
        onAddManual={addManualTrack}
      />
    </div>
  );
}