import { useRef, useCallback, useState } from 'react';

interface TapWheelProps {
  onTap: () => void;
  onRotate?: (delta: number) => void;
  size?: number;
}

const TICK_COUNT = 60;

export function TapWheel({ onTap, onRotate, size = 300 }: TapWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const lastAngle = useRef<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [pressed, setPressed] = useState(false);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const beginDrag = useCallback((clientX: number, clientY: number) => {
    isDragging.current = true;
    hasMoved.current = false;
    lastAngle.current = getAngle(clientX, clientY);
    setPressed(true);
  }, [getAngle]);

  const updateDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || lastAngle.current === null) return;
    const angle = getAngle(clientX, clientY);
    const rawDelta = angle - lastAngle.current;
    const delta = rawDelta > 180 ? rawDelta - 360 : rawDelta < -180 ? rawDelta + 360 : rawDelta;

    if (Math.abs(delta) > 2) {
      hasMoved.current = true;
      setRotation((r) => r + (delta > 0 ? 4 : -4));
      onRotate?.(delta > 0 ? 1 : -1);
      lastAngle.current = angle;
    }
  }, [getAngle, onRotate]);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    hasMoved.current = false;
    lastAngle.current = null;
    setPressed(false);
  }, []);

  // Mouse drag on outer wheel (for rotation only)
  const handleWheelMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if not clicking on the center tap button
    const target = e.target as HTMLElement;
    if (target.closest('[data-tap-button]')) return;
    
    beginDrag(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => updateDrag(ev.clientX, ev.clientY);
    const onUp = () => {
      endDrag();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [beginDrag, updateDrag, endDrag]);

  // Touch drag on outer wheel
  const handleWheelTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-tap-button]')) return;
    
    const t = e.touches[0];
    if (!t) return;
    beginDrag(t.clientX, t.clientY);
  }, [beginDrag]);

  const handleWheelTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    updateDrag(t.clientX, t.clientY);
  }, [updateDrag]);

  const handleWheelTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Tap button click handler
  const handleTapClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTap();
  }, [onTap]);

  // Tick marks around the outer dial
  const ticks = Array.from({ length: TICK_COUNT }).map((_, i) => {
    const angle = (i / TICK_COUNT) * 360;
    const isMajor = i % 5 === 0;
    const isAccent = i === 8 || i === 37;
    return (
      <line
        key={i}
        x1={100}
        y1={10}
        x2={100}
        y2={isMajor ? 22 : 17}
        transform={`rotate(${angle} 100 100)`}
        stroke={isAccent ? '#ffffff' : isMajor ? '#8a8a8e' : '#4a4a4e'}
        strokeWidth={isAccent ? 2.2 : isMajor ? 1.5 : 1}
        strokeLinecap="round"
      />
    );
  });

  const tapButtonSize = size * 0.56;

  return (
    <div
      ref={wheelRef}
      data-testid="tap-wheel"
      onMouseDown={handleWheelMouseDown}
      onTouchStart={handleWheelTouchStart}
      onTouchMove={handleWheelTouchMove}
      onTouchEnd={handleWheelTouchEnd}
      role="button"
      aria-label="Drag to adjust tempo"
      tabIndex={0}
      className="relative select-none touch-none"
      style={{
        width: size,
        height: size,
        cursor: pressed ? 'grabbing' : 'grab',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 0.12s ease-out',
        filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.45))',
      }}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full pointer-events-none">
        <defs>
          <radialGradient id="dial-face" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#333338" />
            <stop offset="55%" stopColor="#232327" />
            <stop offset="100%" stopColor="#17171a" />
          </radialGradient>
          <radialGradient id="knob-face" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#2c2c30" />
            <stop offset="70%" stopColor="#1c1c1f" />
            <stop offset="100%" stopColor="#141416" />
          </radialGradient>
          <radialGradient id="center-face" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#26262a" />
            <stop offset="100%" stopColor="#121214" />
          </radialGradient>
        </defs>

        {/* Outer dial */}
        <circle cx="100" cy="100" r="99" fill="url(#dial-face)" stroke="#3a3a3d" strokeWidth="1" />

        {/* Tick ring (rotates as you spin) */}
        <g transform={`rotate(${rotation} 100 100)`}>{ticks}</g>

        {/* Raised knob ring */}
        <circle cx="100" cy="100" r="78" fill="none" stroke="#0d0d0f" strokeWidth="3" opacity="0.7" />
        <circle cx="100" cy="100" r="75" fill="url(#knob-face)" stroke="#303034" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="66" fill="none" stroke="#3c3c40" strokeWidth="1" opacity="0.6" />

        {/* Center concave disc */}
        <circle cx="100" cy="100" r="52" fill="url(#center-face)" stroke="#0b0b0d" strokeWidth="2" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="#3a3a3e" strokeWidth="0.5" opacity="0.5" />
      </svg>

      {/* Tap button - only this area triggers tap tempo */}
      <button
        data-tap-button
        onClick={handleTapClick}
        className="absolute rounded-full flex items-center justify-center transition-transform active:scale-95"
        style={{
          width: tapButtonSize,
          height: tapButtonSize,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at center, #2a2a2e 0%, #1a1a1e 100%)',
          border: '2px solid #3a3a3e',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 10,
        }}
        aria-label="Tap to set tempo"
      >
        <span className="text-[#9a9a9e] text-sm font-medium tracking-[0.3em] uppercase select-none">
          Tap
        </span>
      </button>
    </div>
  );
}
