interface BeatAccentBarProps {
  timeSignature: string;
  accentPattern: number[];
  onChange: (pattern: number[]) => void;
  previewSound: (level: number, volume: number) => void;
  volumes: { low: number; mid: number; high: number };
}

const LEVEL_LABELS = ['', 'Low', 'Mid', 'High'];

export function BeatAccentBar({ timeSignature, accentPattern, onChange, previewSound, volumes }: BeatAccentBarProps) {
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);

  const pattern = accentPattern.length >= beatsPerMeasure
    ? accentPattern.slice(0, beatsPerMeasure)
    : [...accentPattern, ...Array(beatsPerMeasure - accentPattern.length).fill(1)];

  const cycleLevel = (beatIndex: number) => {
    const newPattern = [...pattern];
    newPattern[beatIndex] = (newPattern[beatIndex] + 1) % 4;
    const fullPattern = [...newPattern];
    while (fullPattern.length < (accentPattern.length || beatsPerMeasure)) {
      fullPattern.push(accentPattern[fullPattern.length] ?? 1);
    }
    onChange(fullPattern);
    const level = newPattern[beatIndex];
    if (level > 0) {
      const volume = level === 1 ? volumes.low : level === 2 ? volumes.mid : volumes.high;
      previewSound(level, volume);
    }
  };

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: beatsPerMeasure }).map((_, i) => {
        const level = pattern[i] ?? 1;
        return (
          <button
            key={i}
            onClick={() => cycleLevel(i)}
            className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              level === 0
                ? 'border-[#333] bg-[#0f0f14] text-[#555]'
                : level === 1
                ? 'border-[#555] bg-[#1a1a24] text-[#888]'
                : level === 2
                ? 'border-[#888] bg-[#222] text-white'
                : 'border-[#00e0c6] bg-[#00e0c6]/20 text-[#00e0c6]'
            }`}
            aria-label={`Beat ${i + 1}: ${LEVEL_LABELS[level] || 'Off'}`}
          >
            <span className="text-xs font-bold">{i + 1}</span>
            <span className="text-[9px]">{LEVEL_LABELS[level] || 'Off'}</span>
          </button>
        );
      })}
    </div>
  );
}
