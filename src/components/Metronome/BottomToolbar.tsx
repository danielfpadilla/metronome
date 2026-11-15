interface BottomToolbarProps {
  timeDisplay: string;
}

export function BottomToolbar({ timeDisplay }: BottomToolbarProps) {
  return (
    <div className="flex items-center justify-center gap-4 h-10">
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Play">▶</button>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Stop">■</button>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Metronome">♪</button>
      <span className="font-mono text-xs text-[#555] min-w-[40px] text-center">{timeDisplay}</span>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Pencil">✎</button>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Eraser">⌫</button>
    </div>
  );
}