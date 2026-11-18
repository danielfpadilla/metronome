import { useState } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useTracks } from '@/hooks/useTracks';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistEditor } from './PlaylistEditor';
import { useAuthContext } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';
import { useNavigate } from 'react-router-dom';

export function Playlists() {
  const { playlists, loading, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks } = usePlaylists();
  const { tracks } = useTracks();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  const selected = playlists.find((p) => p.id === selectedPlaylist);

  if (selected) {
    const firstTrack = selected.tracks?.[0];
    const firstBpm = firstTrack?.track?.bpm ?? 100;

    const handlePlay = () => {
      navigate(`/?bpm=${firstBpm}`);
    };

    return (
      <div>
        <button
          onClick={() => setSelectedPlaylist(null)}
          className="px-4 py-2 text-[#888] hover:text-white text-sm"
        >
          ← Back to Playlists
        </button>
        <PlaylistEditor
          playlist={selected}
          availableTracks={tracks}
          onAddTrack={(trackId) => addTrackToPlaylist(selected.id, trackId, (selected.tracks?.length ?? 0))}
          onRemoveTrack={(trackId) => removeTrackFromPlaylist(selected.id, trackId)}
          onReorder={(trackIds) => reorderTracks(selected.id, trackIds)}
          onPlay={handlePlay}
          firstTrackTitle={firstTrack?.track?.title}
          firstTrackBpm={firstBpm}
        />
      </div>
    );
  }

  return (
    <>
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Playlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm hover:shadow-[0_0_12px_rgba(0,224,198,0.3)] transition-shadow"
        >
          + New Playlist
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name"
            className="flex-1 px-3 py-2.5 bg-[#1a1a24] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#00e0c6]"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2.5 bg-[#00e0c6] text-[#0f0f14] font-semibold rounded-lg text-sm"
          >
            Create
          </button>
          <button
            onClick={() => setShowCreate(false)}
            className="px-4 py-2.5 bg-[#0f0f14] border border-[#333] text-[#888] rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-[#888] text-center py-8">Loading...</p>
      ) : playlists.length === 0 ? (
        <p className="text-[#888] text-center py-8">No playlists yet. Create one to get started.</p>
      ) : (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => setSelectedPlaylist(playlist.id)}
              onDelete={() => deletePlaylist(playlist.id)}
            />
          ))}
        </div>
      )}
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}