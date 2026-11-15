import { useState } from 'react';
import { useTracks } from '@/hooks/useTracks';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { TrackCard } from './TrackCard';
import { AddTrackModal } from './AddTrackModal';

export function Library() {
  const { tracks, loading, addYouTubeTrack, addManualTrack, deleteTrack } = useTracks();
  const { user } = useAuthContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = tracks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

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