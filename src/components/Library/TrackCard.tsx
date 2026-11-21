import type { Track } from '@/types';
import { getThumbnailUrl, extractVideoId } from '@/utils/youtube';

interface TrackCardProps {
  track: Track;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onPlay?: () => void;
  onSelectTrack?: (bpm: number, timeSignature: string) => void;
}

const STATUS_META: Record<
  NonNullable<Track['status']>,
  { label: string; className: string }
> = {
  processing: { label: 'Analyzing…', className: 'bg-[var(--surface-2)] text-[#e0c66a] border-[var(--line-2)]' },
  ready: { label: 'Ready', className: 'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--line-2)]' },
  failed: { label: 'Failed', className: 'bg-[var(--surface-2)] text-[var(--danger)] border-[var(--line-2)]' },
  manual_bpm_pending: { label: 'BPM needed', className: 'bg-[var(--surface-2)] text-[var(--ink-3)] border-[var(--line-2)]' },
};

export function TrackCard({ track, onClick, onDelete, onEdit, onPlay, onSelectTrack }: TrackCardProps) {
  const videoId = track.youtube_url ? extractVideoId(track.youtube_url) : null;
  const coverUrl = videoId ? getThumbnailUrl(videoId) : track.cover_art_url;
  const status = track.status ? STATUS_META[track.status] : null;
  const hasBpm = typeof track.bpm === 'number' && track.bpm > 0;

  return (
    <div
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 cursor-pointer hover:border-[var(--accent)] hover:shadow-[0_0_12px_var(--accent-glow)] transition-all group"
    >
      <div className="relative w-full h-32 bg-[var(--base)] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[var(--ink-3)] text-sm">No cover</span>
        )}
        {status && (
          <span
            className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}
          >
            {status.label}
          </span>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--ink)] truncate">{track.title}</h3>
          <p className="text-xs text-[var(--ink-3)] mt-1">
            {track.source === 'youtube' ? 'YouTube' : 'Manual'} · {track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, '0')}` : '--:--'}
          </p>
        </div>
        <div className="text-[var(--accent)] font-bold text-lg ml-2">{hasBpm ? track.bpm : '—'} BPM</div>
      </div>
      <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--line)]">
        {track.source === 'youtube' && onPlay && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent)] font-medium transition-colors"
          >
            ▶ Play
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-xs text-[var(--ink-2)] hover:text-[var(--accent)] transition-colors"
          >
            Edit
          </button>
        )}
        {onSelectTrack && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectTrack(track.bpm ?? 100, '4/4'); }}
            disabled={!hasBpm}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent)] disabled:text-[var(--ink-3)] disabled:cursor-not-allowed transition-colors"
            title={hasBpm ? 'Set metronome tempo' : 'BPM not available yet'}
          >
            Set BPM
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-xs text-[var(--danger)] hover:text-red-300 transition-colors ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}