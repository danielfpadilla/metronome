interface BottomToolbarProps {
  timeDisplay: string;
  isPlaying: boolean;
  onToggle: () => void;
}

export function BottomToolbar({ timeDisplay, isPlaying, onToggle }: BottomToolbarProps) {
  const primaryClass = isPlaying
    ? "text-[#00e0c6] hover:text-white transition-colors p-1.5 rounded"
    : "text-[#555] hover:text-white transition-colors p-1.5 rounded";

  return (
    <div className="flex items-center justify-center gap-4 h-10">
      <button
        onClick={onToggle}
        className={primaryClass}
        aria-label={isPlaying ? "Stop" : "Play"}
      >
        {isPlaying ? "STOP" : "PLAY"}
      </button>
      <span className="font-mono text-xs text-[#555] min-w-[40px] text-center">{timeDisplay}</span>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Pencil">✎</button>
      <button className="text-[#555] hover:text-white transition-colors p-1.5 rounded" aria-label="Eraser">⌫</button>
    </div>
  );
}