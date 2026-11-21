import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Metronome } from '@/components/Metronome/Metronome';

const { setBpm, setTimeSignature, setSubdivision } = vi.hoisted(() => ({
  setBpm: vi.fn(),
  setTimeSignature: vi.fn(),
  setSubdivision: vi.fn(),
}));

vi.mock('@/hooks/useMetronome', () => ({
  useMetronome: () => ({
    bpm: 100, setBpm, timeSignature: '4/4', setTimeSignature,
    subdivision: 1, setSubdivision, isPlaying: false, currentBeat: 0,
    start: vi.fn(), stop: vi.fn(), toggle: vi.fn(), countInBeat: null,
    previewSound: vi.fn(),
  }),
}));

function seedPlaylist() {
  localStorage.setItem('metronome-playlists', JSON.stringify([{
    id: 'p1',
    user_id: 'local',
    name: 'Test Playlist',
    description: null,
    created_at: '2026-01-01T00:00:00.000Z',
    tracks: [{ playlist_id: 'p1', track_id: 't1', position: 0 }],
  }]));
}

function Harness() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div>
      <button onClick={() => navigate('/')}>Home</button>
      <button onClick={() => navigate('/?settings=1')}>Open settings</button>
      <button onClick={() => navigate('/?playlist=p1')}>Open playlist</button>
      <button onClick={() => navigate('/?bpm=120')}>Open bpm</button>
      <div data-testid="location">{location.pathname + location.search}</div>
      <Routes>
        <Route path="/" element={<Metronome />} />
        <Route path="/library" element={<Link to="/?playlist=p1">Load playlist from library</Link>} />
      </Routes>
    </div>
  );
}

function renderHarness(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness />
    </MemoryRouter>
  );
}

describe('Metronome', () => {
  beforeEach(() => {
    localStorage.clear();
    setBpm.mockClear();
    setTimeSignature.mockClear();
    setSubdivision.mockClear();
  });

  it('renders BPM display', () => {
    renderHarness();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  it('renders play button', () => {
    renderHarness();
    expect(screen.getAllByRole('button', { name: /play/i }).length).toBeGreaterThan(0);
  });
  it('renders tap wheel', () => {
    renderHarness();
    expect(screen.getByTestId('tap-wheel')).toBeInTheDocument();
  });

  it('opens settings when search changes while Metronome stays mounted', async () => {
    const user = userEvent.setup();
    renderHarness();
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toBe('/?settings=1');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('loads a playlist when search changes while Metronome stays mounted', async () => {
    const user = userEvent.setup();
    seedPlaylist();
    renderHarness();
    expect(screen.queryByLabelText('Close playlist')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open playlist' }));
    expect(screen.getByLabelText('Close playlist')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toBe('/?playlist=p1');

    await user.click(screen.getByLabelText('Close playlist'));
    expect(screen.queryByLabelText('Close playlist')).not.toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('loads a playlist when navigating from another route', async () => {
    const user = userEvent.setup();
    seedPlaylist();
    renderHarness('/library');

    await user.click(screen.getByRole('link', { name: 'Load playlist from library' }));
    expect(screen.getByLabelText('Close playlist')).toBeInTheDocument();
    expect(screen.getByTestId('location').textContent).toBe('/?playlist=p1');
  });

  it('applies bpm from search and strips only consumed params', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'Open bpm' }));
    expect(setBpm).toHaveBeenCalledWith(120);
    expect(screen.getByTestId('location').textContent).toBe('/');
  });
});
