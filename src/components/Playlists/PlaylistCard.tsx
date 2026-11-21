import { useState } from 'react';
import type { Playlist } from '@/types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onDelete: () => void;
  onRename?: (name: string) => void;
}

export function PlaylistCard({ playlist, onClick, onDelete, onRename }: PlaylistCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const trackCount = playlist.tracks?.length ?? 0;

  const handleRename = () => {
    if (name.trim() && name.trim() !== playlist.name) {
      onRename?.(name.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 cursor-pointer hover:border-[var(--accent)] transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="w-full px-2 py-1 bg-[var(--base)] border border-[var(--accent)] rounded text-[var(--ink)] text-sm font-semibold focus:outline-none"
            />
          ) : (
            <h3
              className="font-semibold text-[var(--ink)] truncate"
              onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            >
              {playlist.name}
            </h3>
          )}
          {playlist.description && !isEditing && (
            <p className="text-xs text-[var(--ink-3)] mt-1">{playlist.description}</p>
          )}
        </div>
        <span className="text-[var(--accent)] text-sm font-medium ml-2">{trackCount} tracks</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="text-xs text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors"
        >
          Rename
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs text-[var(--danger)] hover:text-red-300 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
