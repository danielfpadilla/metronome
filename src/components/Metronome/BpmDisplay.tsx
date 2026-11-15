import { getMusicalTerm } from '@/lib/musicalTerms';

interface BpmDisplayProps {
  bpm: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function BpmDisplay({ bpm, onIncrement, onDecrement }: BpmDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onDecrement}
        className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] transition-colors flex items-center justify-center text-xl"
        aria-label="Decrease BPM"
      >
        −
      </button>
      <div className="text-center">
        <div className="text-4xl font-bold text-white tabular-nums leading-none">{bpm}</div>
        <div className="text-xs text-[#666] uppercase tracking-wider mt-1">{getMusicalTerm(bpm)}</div>
      </div>
      <button
        onClick={onIncrement}
        className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] transition-colors flex items-center justify-center text-xl"
        aria-label="Increase BPM"
      >
        +
      </button>
    </div>
  );
}