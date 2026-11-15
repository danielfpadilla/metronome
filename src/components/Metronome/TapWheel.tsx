import { useRef, useCallback } from 'react';

interface TapWheelProps {
  onTap: () => void;
  size?: number;
}

export function TapWheel({ onTap, size = 280 }: TapWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    onTap();
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        if (wheelRef.current) wheelRef.current.style.transform = '';
      }, 150);
    }
  }, [onTap]);

  return (
    <div
      ref={wheelRef}
      data-testid="tap-wheel"
      onClick={handleClick}
      className="relative rounded-full bg-[#1a1a1a] border border-[#2a2a2a] cursor-pointer select-none transition-transform"
      style={{ width: size, height: size }}
      role="button"
      aria-label="Tap to set tempo"
      tabIndex={0}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-3 bg-[#333] left-1/2 top-1/2"
          style={{
            marginLeft: -1,
            marginTop: -130,
            transform: `rotate(${i * 30}deg)`,
            transformOrigin: 'center 130px',
          }}
        />
      ))}
      <div className="w-[60%] h-[60%] rounded-full bg-[#151515] border border-[#252525] flex items-center justify-center">
        <span className="text-[#444] text-sm tracking-widest uppercase">Tap</span>
      </div>
    </div>
  );
}