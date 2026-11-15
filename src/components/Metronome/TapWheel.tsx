import { useRef, useCallback } from 'react';

interface TapWheelProps {
  onTap: () => void;
  onRotate?: (delta: number) => void;
  size?: number;
}

export function TapWheel({ onTap, onRotate, size = 280 }: TapWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastAngleRef = useRef<number | null>(null);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    lastAngleRef.current = getAngle(e.clientX, e.clientY);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || lastAngleRef.current === null) return;
      const angle = getAngle(ev.clientX, ev.clientY);
      const delta = angle - lastAngleRef.current;
      let normalizedDelta = delta;
      if (normalizedDelta > 180) normalizedDelta -= 360;
      if (normalizedDelta < -180) normalizedDelta += 360;
      if (Math.abs(normalizedDelta) > 2) {
        hasMovedRef.current = true;
        if (onRotate) {
          onRotate(normalizedDelta > 0 ? 1 : -1);
        }
        lastAngleRef.current = angle;
      }
    };

    const handleMouseUp = () => {
      if (!hasMovedRef.current) {
        onTap();
        if (wheelRef.current) {
          wheelRef.current.style.transform = 'scale(0.98)';
          setTimeout(() => {
            if (wheelRef.current) wheelRef.current.style.transform = '';
          }, 150);
        }
      }
      isDraggingRef.current = false;
      hasMovedRef.current = false;
      lastAngleRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getAngle, onTap, onRotate]);

  return (
    <div
      ref={wheelRef}
      data-testid="tap-wheel"
      onMouseDown={handleMouseDown}
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