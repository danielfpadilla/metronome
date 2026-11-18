import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Metronome } from '@/components/Metronome/Metronome';

vi.mock('@/hooks/useMetronome', () => ({
  useMetronome: () => ({
    bpm: 100, setBpm: vi.fn(), timeSignature: '4/4', setTimeSignature: vi.fn(),
    subdivision: 1, setSubdivision: vi.fn(), isPlaying: false, currentBeat: 0,
    start: vi.fn(), stop: vi.fn(), toggle: vi.fn(), countInBeat: null,
    previewSound: vi.fn(),
  }),
}));

describe('Metronome', () => {
  it('renders BPM display', () => {
    render(
      <MemoryRouter>
        <Metronome />
      </MemoryRouter>
    );
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  it('renders play button', () => {
    render(
      <MemoryRouter>
        <Metronome />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('button', { name: /play/i }).length).toBeGreaterThan(0);
  });
  it('renders tap wheel', () => {
    render(
      <MemoryRouter>
        <Metronome />
      </MemoryRouter>
    );
    expect(screen.getByTestId('tap-wheel')).toBeInTheDocument();
  });
});