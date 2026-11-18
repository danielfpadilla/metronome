import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TapWheel } from '@/components/Metronome/TapWheel';

describe('TapWheel', () => {
  it('renders with tap label', () => {
    render(<TapWheel onTap={vi.fn()} />);
    expect(screen.getByTestId('tap-wheel')).toBeInTheDocument();
    expect(screen.getByText('Tap')).toBeInTheDocument();
  });

  it('calls onTap when tap button is clicked', () => {
    const onTap = vi.fn();
    render(<TapWheel onTap={onTap} />);
    const tapButton = screen.getByRole('button', { name: /tap to set tempo/i });
    tapButton.click();
    expect(onTap).toHaveBeenCalled();
  });
});