import type { Track } from '@/types';
import { getThumbnailUrl, extractVideoId } from '@/utils/youtube';

interface TrackCardProps {
  track: Track;
  onClick?: () => void;
  onDelete?: () => void;
  onSelectTrack?: (bpm: number, timeSignature: string) => void;
}

export function TrackCard({ track, onClick, onDelete, onSelectTrack }: TrackCardProps) {
  const videoId = track.youtube_url ? extractVideoId(track.youtube_url) : null;
  const coverUrl = videoId ? getThumbnailUrl(videoId) : track.cover_art_url;

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1a24] border border-[#333] rounded-xl p-4 cursor-pointer hover:border-[#00e0c6] hover:shadow-[0_0_12px_rgba(0,224,198,0.15)] transition-all"
    >
      <div className="w-full h-32 bg-[#0f0f14] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#555] text-sm">No cover</span>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{track.title}</h3>
          <p className="text-xs text-[#888] mt-1">
            {track.source === 'youtube' ? 'YouTube' : 'Manual'} · {track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, '0')}` : '--:--'}
          </p>
        </div>
        <div className="text-[#00e0c6] font-bold text-lg ml-2">{track.bpm ?? '—'} BPM</div>
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
          className="mt-2 text-xs text-[#00e0c6] hover:text-[#00b8a3]"
        >
          Set BPM
        </button>
      )}
    </div>
  );
}