# Save Track from Metronome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Let users save the current metronome BPM and settings as a new manual track from the Metronome page.

**Architecture:** `Metronome` owns modal/confirmation state and renders a Save button next to Play when no playlist is loaded. `SaveTrackModal` collects the title and shows read-only settings. `useTracks.addManualTrack` persists the selected settings to localStorage.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Tailwind, localStorage.

---

## File map

- Modify: `src/hooks/useTracks.ts`
- Create: `src/components/Metronome/SaveTrackModal.tsx`
- Modify: `src/components/Metronome/Metronome.tsx`
- Test: `tests/hooks/useTracks.test.tsx`
- Test: `tests/components/SaveTrackModal.test.tsx`

## Tasks

1. Task 1 — Extend `addManualTrack` with settings; test it.
2. Task 2 — Create `SaveTrackModal`; test it.
3. Task 3 — Wire Save button + confirmation into `Metronome`.
4. Task 4 — Final verification.

---

## Task 1: Extend `addManualTrack` with settings

**Files:** `src/hooks/useTracks.ts`, `tests/hooks/useTracks.test.tsx`

- [x] **Step 1: Write failing test**

Create `tests/hooks/useTracks.test.tsx`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTracks } from '@/hooks/useTracks';

describe('useTracks.addManualTrack', () => {
  beforeEach(() => localStorage.clear());

  it('persists optional track settings', async () => {
    const { result } = renderHook(() => useTracks());
    const settings = { timeSignature: '3/4', subdivision: 3, accentPattern: [3, 2, 0] } as const;
    let saved: Awaited<ReturnType<typeof result.current.addManualTrack>> | undefined;
    await act(async () => {
      saved = await result.current.addManualTrack('My Track', 132, settings);
    });
    expect(saved).toMatchObject({
      title: 'My Track', bpm: 132, source: 'manual', status: 'ready', ...settings,
    });
    const stored = JSON.parse(localStorage.getItem('metronome-tracks') ?? '[]');
    expect(stored[0]).toMatchObject(settings);
  });
});
```

- [x] **Step 2: Run test; expect failure**

Run: `npx vitest run tests/hooks/useTracks.test.tsx`
Expected: FAIL — third argument ignored, settings missing.

- [x] **Step 3: Implement signature**

In `src/hooks/useTracks.ts`, change:
```ts
  const addManualTrack = useCallback(async (title: string, bpm: number) => {
```
to:
```ts
  const addManualTrack = useCallback(async (
    title: string,
    bpm: number,
    settings?: Pick<Track, 'timeSignature' | 'subdivision' | 'accentPattern'>
  ) => {
```
Add to the created `track` object after `status: 'ready',`:
```ts
      ...(settings ?? {}),
```

- [x] **Step 4: Run test; expect pass**

Run: `npx vitest run tests/hooks/useTracks.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/hooks/useTracks.ts tests/hooks/useTracks.test.tsx
git commit -m "feat: persist per-track settings when adding manual track"
```

---

## Task 2: Create SaveTrackModal

**Files:** `src/components/Metronome/SaveTrackModal.tsx`, `tests/components/SaveTrackModal.test.tsx`

- [x] **Step 1: Write failing test**

Create `tests/components/SaveTrackModal.test.tsx`:
```ts
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
```

- [x] **Step 2: Run test; expect failure** — `npx vitest run tests/components/SaveTrackModal.test.tsx`. Expected module not found.

Create `src/components/Metronome/SaveTrackModal.tsx`:
```ts
import { useState } from 'react';
import type { Track, TimeSignature, Subdivision } from '@/types';

export type TrackSettings = Pick<Track, 'timeSignature' | 'subdivision' | 'accentPattern'>;

interface SaveTrackModalProps {
  bpm: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  accentPattern: number[];
  onClose: () => void;
  onSave: (title: string, settings: TrackSettings) => Promise<void>;
}
```
Then add `export function SaveTrackModal(props: SaveTrackModalProps) { ... }`.

- [x] **Step 4: Implement title state and validation**

Use `const [title, setTitle] = useState(`Manual Track ${bpm} BPM`);`, `const [error, setError] = useState<string | null>(null);`, `const [saving, setSaving] = useState(false);`. In save handler, trim title; if empty set error and return.

- [x] **Step 5: Implement modal UI**

Use the existing modal shell style from `SettingsPanel`/`EditTrackModal`. Show title input, read-only settings rows (BPM, time signature, subdivision, accent pattern). Include Save/Cancel buttons; disable Save while `saving`.

- [x] **Step 6: Run test; expect pass**

Run: `npx vitest run tests/components/SaveTrackModal.test.tsx`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/components/Metronome/SaveTrackModal.tsx tests/components/SaveTrackModal.test.tsx
git commit -m "feat: add save track modal"
```

---

## Task 3: Wire Save button into Metronome

**Files:** `src/components/Metronome/Metronome.tsx`

- [x] **Step 1: Add hook and state**

At top: `const { addManualTrack } = useTracks();`. Add `const [showSaveModal, setShowSaveModal] = useState(false);`, `const [savedMessage, setSavedMessage] = useState(false);`, and `const [playlistLoaded, setPlaylistLoaded] = useState(() => !!(initialPlaylistId || localStorage.getItem('metronome-last-playlist')));`.

Also add to `PlaylistPlayer`: optional `onLoadedChange?: (loaded: boolean) => void`, an effect syncing `!!selectedPlaylist` to that callback, and call `onLoadedChange?.(false)` in `clearPlaylist`.

- [x] **Step 2: Add save handler**

```tsx
  const handleSaveTrack = useCallback((title: string, trackSettings: TrackSettings) => {
    return addManualTrack(title, metro.bpm, trackSettings).then(() => {
      setShowSaveModal(false);
      setSavedMessage(true);
      window.setTimeout(() => setSavedMessage(false), 2000);
    });
  }, [addManualTrack, metro.bpm]);
```
`SaveTrackModal` owns its error state and catches rejection from `onSave`.

- [x] **Step 3: Render Save button next to Play when no playlist**

Replace the Play row with:
```tsx
        <div className="flex items-center justify-center gap-2">
          <div className="w-full max-w-xs">
            <PlayBar isPlaying={metro.isPlaying} onToggle={metro.toggle} />
          </div>
          {!playlistLoaded && (
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={showSaveModal}
              className="h-10 px-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm hover:border-[var(--accent)] disabled:opacity-50 transition-colors"
              aria-label="Save current tempo as track"
            >
              Save
            </button>
          )}
        </div>
        {savedMessage && (
          <p role="status" className="text-center text-xs text-[var(--accent)] mt-2">Saved to Library</p>
        )}
```

- [x] **Step 4: Render modal**

Add near `SettingsPanel`:
```tsx
      {showSaveModal && (
        <SaveTrackModal
          bpm={metro.bpm}
          timeSignature={metro.timeSignature}
          subdivision={metro.subdivision}
          accentPattern={settings.accentPattern}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveTrack}
        />
      )}
```
Import `SaveTrackModal` and `useTracks`.

- [x] **Step 5: Verify and commit**

Run `npm run lint`, `npm run build`, `npx vitest run`. Expected zero lint warnings, clean build, all tests pass.
```bash
git add src/components/Metronome/Metronome.tsx
git commit -m "feat: save current tempo as track from metronome page"
```

---

## Task 4: Final verification

- [x] **Step 1:** Run `npm run lint && npm run build && npx vitest run`. Expect zero warnings, clean build, all tests pass.
- [x] **Step 2:** Browser smoke: open `/`, confirm Save next to Play when no playlist; open modal, save, confirm "Saved to Library"; open Library and confirm track exists with correct BPM/settings; load playlist and confirm Save hidden.
- [x] **Step 3:** Push: `git push origin feature/metronome-improvement`.

---

## Self-review

- Spec coverage: save button, modal, useTracks settings, confirmation, tests all covered.
- No placeholders: all code shown.
- Type consistency: `TrackSettings` = `Pick<Track, 'timeSignature' | 'subdivision' | 'accentPattern'>` used in modal and hook.
