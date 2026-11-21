import { useState, useEffect } from 'react';
import type { Track } from '@/types';

interface EditTrackModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { title: string; bpm: number | null }) => void;
}

export function EditTrackModal({ track, isOpen, onClose, onSave }: EditTrackModalProps) {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState<string>('');

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setBpm(track.bpm ? String(track.bpm) : '');
    }
  }, [track]);

  if (!isOpen || !track) return null;

  const handleSave = () => {
    const bpmValue = bpm.trim() ? parseInt(bpm, 10) : null;
    onSave(track.id, { title: title.trim() || track.title, bpm: bpmValue && !isNaN(bpmValue) ? bpmValue : null });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md border border-[var(--line)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--accent)]">Edit Track</h2>
          <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--ink-2)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[var(--base)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--ink-2)] mb-1">BPM (optional)</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              min={40}
              max={240}
              placeholder="—"
              className="w-full px-3 py-2.5 bg-[var(--base)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <p className="text-xs text-[var(--ink-3)] mt-1">Leave empty to keep as "BPM needed"</p>
          </div>

          {track.youtube_url && (
            <div>
              <label className="block text-sm text-[var(--ink-2)] mb-1">YouTube URL</label>
              <p className="text-xs text-[var(--ink-3)] truncate">{track.youtube_url}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink-2)] rounded-lg hover:text-[var(--ink)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
