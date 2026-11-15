interface PlayBarProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function PlayBar({ isPlaying, onToggle }: PlayBarProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full h-10 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
        isPlaying
          ? 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888]'
          : 'bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#333] hover:border-[#555]'
      }`}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      <span className="text-sm">{isPlaying ? '❚❚' : '▶'}</span>
      <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
    </button>
  );
}