import type { Playlist } from '@/types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onDelete: () => void;
}

export function PlaylistCard({ playlist, onClick, onDelete }: PlaylistCardProps) {
  const trackCount = playlist.tracks?.length ?? 0;
  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a24] border border-[#333] rounded-xl p-4 cursor-pointer hover:border-[#00e0c6] transition-all"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-white">{playlist.name}</h3>
          {playlist.description && (
            <p className="text-xs text-[#888] mt-1">{playlist.description}</p>
          )}
        </div>
        <span className="text-[#00e0c6] text-sm font-medium">{trackCount} tracks</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}