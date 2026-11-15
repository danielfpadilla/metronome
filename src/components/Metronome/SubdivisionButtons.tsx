import type { Subdivision } from '@/types';

interface SubdivisionButtonsProps {
  value: Subdivision;
  onChange: (s: Subdivision) => void;
}

export function SubdivisionButtons({ value, onChange }: SubdivisionButtonsProps) {
  return (
    <div className="flex gap-2 justify-center">
      {([1, 2, 3, 4] as Subdivision[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`w-10 h-10 rounded-lg border transition-colors flex items-center justify-center overflow-hidden ${
            value === s
              ? 'bg-[#222] border-[#666]'
              : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#444]'
          }`}
          aria-label={`Subdivision ${s}`}
          aria-pressed={value === s}
        >
          <div className="w-6 h-6 bg-[#333] opacity-60 rounded-sm" />
        </button>
      ))}
    </div>
  );
}