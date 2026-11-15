import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TapWheel } from '@/components/Metronome/TapWheel';

describe('TapWheel', () => {
  it('renders with tap label', () => {
    render(<TapWheel onTap={vi.fn()} />);
    expect(screen.getByTestId('tap-wheel')).toBeInTheDocument();
    expect(screen.getByText('Tap')).toBeInTheDocument();
  });

  it('calls onTap when clicked without movement', () => {
    const onTap = vi.fn();
    render(<TapWheel onTap={onTap} />);
    const wheel = screen.getByTestId('tap-wheel');
    // Simulate a simple click (mousedown + mouseup without movement)
    wheel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(onTap).toHaveBeenCalled();
  });
});