import { getMusicalTerm } from '@/lib/musicalTerms';

interface BpmDisplayProps {
  bpm: number;
  onIncrement: () => void;
  onDecrement: () => void;
  flash?: boolean;
}

export function BpmDisplay({ bpm, onIncrement, onDecrement, flash }: BpmDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onDecrement}
        className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors flex items-center justify-center text-xl"
        aria-label="Decrease BPM"
      >
        −
      </button>
      <div className="text-center">
        <div key={flash ? bpm : undefined} className={`text-4xl font-bold text-[var(--ink)] tabular-nums leading-none ${flash ? 'beat-flash-numbers' : ''}`}>{bpm}</div>
        <div className="text-xs text-[var(--ink-3)] uppercase tracking-wider mt-1">{getMusicalTerm(bpm)}</div>
      </div>
      <button
        onClick={onIncrement}
        className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-2)] transition-colors flex items-center justify-center text-xl"
        aria-label="Increase BPM"
      >
        +
      </button>
    </div>
  );
}