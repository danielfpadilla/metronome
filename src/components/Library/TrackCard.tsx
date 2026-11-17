import type { Track } from '@/types';
import { getThumbnailUrl, extractVideoId } from '@/utils/youtube';

interface TrackCardProps {
  track: Track;
  onClick?: () => void;
  onDelete?: () => void;
  onSelectTrack?: (bpm: number, timeSignature: string) => void;
}

const STATUS_META: Record<
  NonNullable<Track['status']>,
  { label: string; className: string }
> = {
  processing: { label: 'Analyzing…', className: 'bg-[#2a2a1a] text-[#e0c66a] border-[#4a4a2a]' },
  ready: { label: 'Ready', className: 'bg-[#122a24] text-[#00e0c6] border-[#1d4a3f]' },
  failed: { label: 'Failed', className: 'bg-[#2a1414] text-[#f87171] border-[#4a2020]' },
  manual_bpm_pending: { label: 'BPM needed', className: 'bg-[#22222a] text-[#aaa] border-[#3a3a44]' },
};

export function TrackCard({ track, onClick, onDelete, onSelectTrack }: TrackCardProps) {
  const videoId = track.youtube_url ? extractVideoId(track.youtube_url) : null;
  const coverUrl = videoId ? getThumbnailUrl(videoId) : track.cover_art_url;
  const status = track.status ? STATUS_META[track.status] : null;
  const hasBpm = typeof track.bpm === 'number' && track.bpm > 0;

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a24] border border-[#333] rounded-xl p-4 cursor-pointer hover:border-[#00e0c6] hover:shadow-[0_0_12px_rgba(0,224,198,0.15)] transition-all"
    >
      <div className="relative w-full h-32 bg-[#0f0f14] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#555] text-sm">No cover</span>
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
          <h3 className="font-semibold text-white truncate">{track.title}</h3>
          <p className="text-xs text-[#888] mt-1">
            {track.source === 'youtube' ? 'YouTube' : 'Manual'} · {track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, '0')}` : '--:--'}
          </p>
        </div>
        <div className="text-[#00e0c6] font-bold text-lg ml-2">{hasBpm ? track.bpm : '—'} BPM</div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="mt-2 text-xs text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      )}
      {onSelectTrack && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectTrack(track.bpm ?? 100, '4/4'); }}
          disabled={!hasBpm}
          className="mt-2 text-xs text-[#00e0c6] hover:text-[#00b8a3] disabled:text-[#555] disabled:cursor-not-allowed"
          title={hasBpm ? 'Set metronome tempo' : 'BPM not available yet'}
        >
          Set BPM
        </button>
      )}
    </div>
  );
}