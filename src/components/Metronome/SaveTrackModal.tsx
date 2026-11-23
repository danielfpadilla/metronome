import { useState } from 'react';
import type { Track, TimeSignature, Subdivision } from '@/types';

export type TrackSettings = Pick<Track, 'timeSignature' | 'subdivision' | 'accentPattern'>;

interface SaveTrackModalProps {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  accentPattern: number[];
  onClose: () => void;
  onSave: (title: string, settings: TrackSettings) => Promise<void>;
}

const ACCENT_LABELS = ['Off', 'Low', 'Mid', 'High'];

function subdivisionLabel(subdivision: Subdivision): string {
  return subdivision === 1 ? 'Quarter' : subdivision === 2 ? 'Eighth' : subdivision === 3 ? 'Triplet' : 'Sixteenth';
}

export function SaveTrackModal({
  bpm, timeSignature, subdivision, accentPattern, onClose, onSave,
}: SaveTrackModalProps) {
  const [title, setTitle] = useState(`Manual Track ${bpm} BPM`);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Enter a track title');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(trimmed, {
        timeSignature,
        subdivision,
        accentPattern: [...accentPattern],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save track');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-md border border-[var(--line)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--accent)]">Save Track</h2>
          <button onClick={onClose} className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="save-track-title" className="block text-sm text-[var(--ink-2)] mb-1">Title</label>
            <input
              id="save-track-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full px-3 py-2.5 bg-[var(--base)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
            <p className="text-xs text-[var(--ink-3)] uppercase tracking-wider">Current settings</p>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ink-2)]">BPM</span>
              <span className="text-[var(--ink)] font-mono">{bpm}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ink-2)]">Time signature</span>
              <span className="text-[var(--ink)] font-mono">{timeSignature}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ink-2)]">Subdivision</span>
              <span className="text-[var(--ink)]">{subdivisionLabel(subdivision)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ink-2)]">Beat accents</span>
              <span className="text-[var(--ink)] font-mono">{accentPattern.map((v) => ACCENT_LABELS[v] ?? 'Off').join(' · ')}</span>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--base)] font-semibold rounded-lg hover:shadow-[0_0_16px_var(--accent-glow)] transition-shadow disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
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
