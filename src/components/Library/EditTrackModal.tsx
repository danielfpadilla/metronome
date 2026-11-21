import { useState, useEffect } from 'react';
import type { Track, TimeSignature, Subdivision } from '@/types';
import { beatsPerMeasure } from '@/lib/bpmMath';

interface EditTrackModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Track>) => void;
}

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];
const SUBDIVISIONS: Subdivision[] = [1, 2, 3, 4];
const ACCENT_LABELS = ['Off', 'Low', 'Mid', 'High'];

function defaultPattern(ts: TimeSignature): number[] {
  const beats = beatsPerMeasure(ts);
  return Array.from({ length: beats }, (_, i) => (i % 3 === 0 ? 3 : 2));
}

export function EditTrackModal({ track, isOpen, onClose, onSave }: EditTrackModalProps) {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState<string>('');
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivision] = useState<Subdivision>(1);
  const [accentPattern, setAccentPattern] = useState<number[]>(defaultPattern('4/4'));

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setBpm(track.bpm ? String(track.bpm) : '');
      setTimeSignature(track.timeSignature ?? '4/4');
      setSubdivision(track.subdivision ?? 1);
      setAccentPattern(
        track.accentPattern && track.accentPattern.length === beatsPerMeasure(track.timeSignature ?? '4/4')
          ? [...track.accentPattern]
          : defaultPattern(track.timeSignature ?? '4/4')
      );
    }
  }, [track]);

  if (!isOpen || !track) return null;

  const handleTimeSignature = (ts: TimeSignature) => {
    setTimeSignature(ts);
    setAccentPattern((prev) => {
      const beats = beatsPerMeasure(ts);
      return Array.from({ length: beats }, (_, i) => prev[i] ?? defaultPattern(ts)[i]);
    });
  };

  const handleSave = () => {
    const bpmValue = bpm.trim() ? parseInt(bpm, 10) : null;
    onSave(track.id, {
      title: title.trim() || track.title,
      bpm: bpmValue && !isNaN(bpmValue) ? bpmValue : null,
      timeSignature,
      subdivision,
      accentPattern,
    });
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

          <div>
            <label className="block text-sm text-[var(--ink-2)] mb-1">Time Signature</label>
            <select
              value={timeSignature}
              onChange={(e) => handleTimeSignature(e.target.value as TimeSignature)}
              className="w-full px-3 py-2.5 bg-[var(--base)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              {TIME_SIGNATURES.map((ts) => <option key={ts} value={ts}>{ts}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--ink-2)] mb-1">Subdivision</label>
            <select
              value={subdivision}
              onChange={(e) => setSubdivision(Number(e.target.value) as Subdivision)}
              className="w-full px-3 py-2.5 bg-[var(--base)] border border-[var(--line)] rounded-lg text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              {SUBDIVISIONS.map((s) => <option key={s} value={s}>{s === 1 ? 'Quarter' : s === 2 ? 'Eighth' : s === 3 ? 'Triplet' : 'Sixteenth'}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--ink-2)] mb-2">Beat Accents</label>
            <div className="space-y-1.5">
              {accentPattern.map((level, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--ink-3)] w-8">Beat {i + 1}</span>
                  <div className="flex flex-1 gap-1">
                    {ACCENT_LABELS.map((label, value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAccentPattern((prev) => prev.map((v, idx) => idx === i ? value : v))}
                        className={`flex-1 py-1 text-xs rounded transition-colors ${
                          level === value ? 'bg-[var(--accent)] text-[var(--base)] font-semibold' : 'bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
