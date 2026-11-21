import type { Subdivision } from '@/types';

interface SubdivisionButtonsProps {
  value: Subdivision;
  onChange: (s: Subdivision) => void;
}

export function SubdivisionButtons({ value, onChange }: SubdivisionButtonsProps) {
  const labels: Record<Subdivision, string> = {
    1: '1',
    2: '½',
    3: '⅓',
    4: '¼',
  };
  const titles: Record<Subdivision, string> = {
    1: 'Quarter notes (1 per beat)',
    2: 'Eighth notes (2 per beat)',
    3: 'Triplets (3 per beat)',
    4: 'Sixteenth notes (4 per beat)',
  };

  return (
    <div className="flex gap-1.5 justify-center">
      {([1, 2, 3, 4] as Subdivision[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          title={titles[s]}
          className={`w-9 h-9 rounded-lg border transition-colors flex items-center justify-center text-sm font-medium ${
            value === s
              ? 'bg-[var(--surface-2)] border-[var(--accent)] text-[var(--accent)]'
              : 'bg-[var(--base)] border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]'
          }`}
          aria-label={titles[s]}
          aria-pressed={value === s}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}