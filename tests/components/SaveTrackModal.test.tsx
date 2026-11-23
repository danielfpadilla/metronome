import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveTrackModal } from '@/components/Metronome/SaveTrackModal';

const settings = { timeSignature: '3/4', subdivision: 3, accentPattern: [3, 2, 0] } as const;

function renderModal(onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <SaveTrackModal
      bpm={132}
      timeSignature={settings.timeSignature}
      subdivision={settings.subdivision}
      accentPattern={[...settings.accentPattern]}
      onClose={vi.fn()}
      onSave={onSave}
    />
  );
  return { onSave };
}

describe('SaveTrackModal', () => {
  it('prefills title and shows current settings', () => {
    renderModal();
    expect(screen.getByRole('textbox')).toHaveValue('Manual Track 132 BPM');
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('Triplet')).toBeInTheDocument();
  });

  it('blocks empty title and saves with current settings', async () => {
    const { onSave } = renderModal();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'My Track' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('My Track', {
      timeSignature: '3/4', subdivision: 3, accentPattern: [3, 2, 0],
    }));
  });
});
