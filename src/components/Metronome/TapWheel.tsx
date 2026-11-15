import { useRef, useCallback, useState } from 'react';

interface TapWheelProps {
  onTap: () => void;
  onRotate?: (delta: number) => void;
  size?: number;
}

export function TapWheel({ onTap, onRotate, size = 280 }: TapWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngleRef = useRef<number | null>(null);

  const getAngle = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastAngleRef.current = getAngle(e);
  }, [getAngle]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || lastAngleRef.current === null) return;
    const angle = getAngle(e);
    const delta = angle - lastAngleRef.current;
    // Normalize delta to handle wrap-around
    let normalizedDelta = delta;
    if (normalizedDelta > 180) normalizedDelta -= 360;
    if (normalizedDelta < -180) normalizedDelta += 360;
    if (Math.abs(normalizedDelta) > 2 && onRotate) {
      onRotate(normalizedDelta > 0 ? 1 : -1);
      lastAngleRef.current = angle;
    }
  }, [isDragging, getAngle, onRotate]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) {
      onTap();
    }
    setIsDragging(false);
    lastAngleRef.current = null;
  }, [isDragging, onTap]);

  const handleClick = useCallback(() => {
    if (!isDragging) {
      onTap();
      if (wheelRef.current) {
        wheelRef.current.style.transform = 'scale(0.98)';
        setTimeout(() => {
          if (wheelRef.current) wheelRef.current.style.transform = '';
        }, 150);
      }
    }
  }, [isDragging, onTap]);

  // Attach global mouse listeners
  const handleMouseDownWrapped = useCallback((e: React.MouseEvent) => {
    handleMouseDown(e);
    const moveHandler = (ev: MouseEvent) => handleMouseMove(ev);
    const upHandler = () => {
      handleMouseUp();
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={wheelRef}
      data-testid="tap-wheel"
      onMouseDown={handleMouseDownWrapped}
      onClick={handleClick}
      className="relative rounded-full bg-[#1a1a1a] border border-[#2a2a2a] cursor-pointer select-none transition-transform"
      style={{ width: size, height: size }}
      role="button"
      aria-label="Tap or drag to set tempo"
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