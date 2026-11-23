import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BpmDisplay } from '@/components/Metronome/BpmDisplay';

describe('BpmDisplay', () => {
  it('does not show last tap when lastTap is omitted', () => {
    render(
      <BpmDisplay
        bpm={120}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
      />
    );
    expect(screen.queryByText(/Last tap/)).not.toBeInTheDocument();
  });

  it('shows last tap value when provided', () => {
    render(
      <BpmDisplay
        bpm={120}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        lastTap={132}
      />
    );
    expect(screen.getByText('Last tap: 132')).toBeInTheDocument();
  });
});
