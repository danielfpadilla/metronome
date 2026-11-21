import { useState, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onBpmDetected?: (bpm: number) => void;
}

export function YouTubePlayer({ videoId, onBpmDetected }: YouTubePlayerProps) {
  // BPM tap detection
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const updated = [...prev, now].slice(-8);
      if (updated.length >= 2) {
        const intervals = [];
        for (let i = 1; i < updated.length; i++) {
          intervals.push(updated[i] - updated[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(60000 / avgInterval);
        if (bpm >= 40 && bpm <= 240) {
          setDetectedBpm(bpm);
        }
      }
      return updated;
    });
  }, []);

  const resetTaps = useCallback(() => {
    setTapTimes([]);
    setDetectedBpm(null);
  }, []);

  const applyBpm = useCallback(() => {
    if (detectedBpm && onBpmDetected) {
      onBpmDetected(detectedBpm);
    }
  }, [detectedBpm, onBpmDetected]);

  return (
    <div className="flex flex-col gap-4">
      {/* YouTube embed */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="YouTube video player"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* BPM Tap Detection */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Detect BPM</h3>
          <button
            onClick={resetTaps}
            className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
          >
            Reset
          </button>
        </div>

        <p className="text-xs text-[var(--ink-3)] mb-3">
          Play the video and tap along to the beat to detect the BPM
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleTap}
            className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--line)] text-[var(--ink)] font-semibold rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Tap
          </button>

          <div className="flex-1">
            {detectedBpm ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[var(--accent)] tabular-nums">{detectedBpm}</span>
                <span className="text-xs text-[var(--ink-3)]">BPM detected ({tapTimes.length} taps)</span>
                {onBpmDetected && (
                  <button
                    onClick={applyBpm}
                    className="px-3 py-1.5 bg-[var(--accent)] text-[var(--base)] text-xs font-semibold rounded-lg hover:shadow-[0_0_12px_var(--accent-glow)] transition-shadow"
                  >
                    Apply
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--ink-3)]">
                {tapTimes.length > 0
                  ? `Tapping... (${tapTimes.length} taps)`
                  : 'No taps yet'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
