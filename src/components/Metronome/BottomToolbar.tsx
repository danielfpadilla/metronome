interface BottomToolbarProps {
  timeDisplay: string;
  isPlaying: boolean;
  onToggle: () => void;
}

export function BottomToolbar({ timeDisplay, isPlaying, onToggle }: BottomToolbarProps) {
  const primaryClass = isPlaying
    ? "text-[var(--accent)] hover:text-[var(--ink)] transition-colors p-1.5 rounded font-semibold"
    : "text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-1.5 rounded font-semibold";

  return (
    <div className="flex items-center justify-center gap-4 h-10">
      <button
        onClick={onToggle}
        className={primaryClass}
        aria-label={isPlaying ? "Stop" : "Play"}
      >
        {isPlaying ? "STOP" : "PLAY"}
      </button>
      <span className="font-mono text-xs text-[var(--ink-3)] min-w-[40px] text-center">{timeDisplay}</span>
    </div>
  );
}