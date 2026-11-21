import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsPanel } from '@/components/Metronome/SettingsPanel';
import type { MetronomeSettings } from '@/components/Metronome/SettingsPanel';

const baseSettings: MetronomeSettings = {
  countIn: false,
  pendulum: false,
  flashAccent: true,
  flashScreen: false,
  flashNumbers: false,
  theme: 'dark',
  accentLow: 30,
  accentMid: 60,
  accentHigh: 100,
  soundType: 'woodblock',
  accentPattern: [3, 2, 2, 2],
  tapHistory: [],
};

function renderPanel(settings: MetronomeSettings, onChange = vi.fn()) {
  const utils = render(
    <SettingsPanel
      isOpen={true}
      onClose={vi.fn()}
      settings={settings}
      onChange={onChange}
      previewSound={vi.fn()}
    />
  );
  return { ...utils, onChange };
}

describe('SettingsPanel tap history', () => {
  it('shows empty state when no taps recorded', () => {
    renderPanel(baseSettings);
    expect(screen.getByText('No taps recorded')).toBeInTheDocument();
  });

  it('shows stored tap history entries', () => {
    const { rerender } = renderPanel(baseSettings);
    rerender(
      <SettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        settings={{ ...baseSettings, tapHistory: [120, 132] }}
        onChange={vi.fn()}
        previewSound={vi.fn()}
      />
    );
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('132')).toBeInTheDocument();
  });

  it('clears tap history via Clear button', () => {
    const { onChange } = renderPanel({ ...baseSettings, tapHistory: [120, 132] });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({ tapHistory: [] });
  });
});
