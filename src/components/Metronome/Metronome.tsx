import { useMetronome } from '@/hooks/useMetronome';
import { TapWheel } from './TapWheel';
import { SubdivisionButtons } from './SubdivisionButtons';
import { PlayBar } from './PlayBar';
import { BottomToolbar } from './BottomToolbar';
import { tapTempoToBpm } from '@/lib/bpmMath';
import { useState, useCallback } from 'react';

export function Metronome() {
  const metro = useMetronome(100);
  const [, setTapTimes] = useState<number[]>([]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTapTimes((prev) => {
      const next = [...prev, now].slice(-6);
      const newBpm = tapTempoToBpm(next);
      if (newBpm !== null) metro.setBpm(newBpm);
      return next;
    });
  }, [metro]);

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Top controls */}
      <div className="px-4 py-3 border-b border-[#222]">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 flex items-center justify-center text-[#888]">♪</div>
          <div className="text-center flex-1">
            <div className="text-4xl font-bold text-white tabular-nums">{metro.bpm}</div>
          </div>
          <div className="flex gap-1">
            <div className="w-9 h-9 flex items-center justify-center text-[#888]">♪</div>
            <div className="w-9 h-9 flex items-center justify-center text-[#888]">⚙</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => metro.setBpm(metro.bpm - 1)}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white flex items-center justify-center"
          >
            −
          </button>
          <PlayBar isPlaying={metro.isPlaying} onToggle={metro.toggle} />
          <button
            onClick={() => metro.setBpm(metro.bpm + 1)}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white flex items-center justify-center"
          >
            +
          </button>
          <button className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white flex items-center justify-center text-xs">
            {metro.timeSignature}
          </button>
        </div>
      </div>

      {/* Tap wheel */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <TapWheel onTap={handleTap} />
      </div>

      {/* Bottom section */}
      <div className="px-4 py-3 border-t border-[#222]">
        <div className="mb-3">
          <SubdivisionButtons value={metro.subdivision} onChange={metro.setSubdivision} />
        </div>
        <BottomToolbar timeDisplay="0:00" />
      </div>
    </div>
  );
}