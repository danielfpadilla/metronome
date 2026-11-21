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
    <div className="flex gap-2 justify-center">
      {([1, 2, 3, 4] as Subdivision[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          title={titles[s]}
          className={`w-10 h-10 rounded-lg border transition-colors flex items-center justify-center text-sm font-medium ${
            value === s
              ? 'bg-[#222] border-[#00e0c6] text-[#00e0c6]'
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-white'
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