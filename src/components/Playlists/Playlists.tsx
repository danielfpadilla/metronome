import { useState } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useTracks } from '@/hooks/useTracks';
import { PlaylistCard } from './PlaylistCard';
import { PlaylistEditor } from './PlaylistEditor';
import { useNavigate } from 'react-router-dom';

export function Playlists() {
  const { playlists, loading, createPlaylist, deletePlaylist, renamePlaylist, addTrackToPlaylist, removeTrackFromPlaylist, reorderTracks } = usePlaylists();
  const { tracks } = useTracks();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  const selected = playlists.find((p) => p.id === selectedPlaylist);

  if (selected) {
    const firstTrack = selected.tracks?.[0];
    const firstTrackData = firstTrack ? tracks.find((t) => t.id === firstTrack.track_id) : undefined;
    const firstBpm = firstTrackData?.bpm ?? 100;

    const handlePlay = () => {
      navigate(`/?bpm=${firstBpm}&playlist=${selected.id}`);
    };

    return (
      <div>
        <button
          onClick={() => setSelectedPlaylist(null)}
          className="px-4 py-2 text-[var(--ink-2)] hover:text-[var(--ink)] text-sm transition-colors"
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
          firstTrackTitle={firstTrackData?.title}
          firstTrackBpm={firstBpm}
        />
      </div>
    );
  }

  return (
    <>
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Playlists</h1>
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
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--ink-3)] text-sm">Loading playlists...</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="text-5xl text-[var(--ink-3)]">♫</div>
          <div>
            <p className="text-[var(--ink)] font-medium mb-1">No playlists yet</p>
            <p className="text-[var(--ink-3)] text-sm">Create your first playlist to organize tracks</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg text-sm hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow"
          >
            + New Playlist
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => setSelectedPlaylist(playlist.id)}
              onDelete={() => deletePlaylist(playlist.id)}
              onRename={(name) => renamePlaylist(playlist.id, name)}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}