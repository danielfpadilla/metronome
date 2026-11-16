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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow"
        >
          + Add Track
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tracks..."
        className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm mb-4 focus:outline-none focus:border-[#00e0c6]"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="px-3 py-2 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
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
        <p className="text-[#888] text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-[#888] text-center py-8">No tracks yet. Add one to get started.</p>
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