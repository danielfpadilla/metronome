# Docs, Screenshots and Code Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Finish the existing improvement spec: remove dead code, fix lint warnings, add tap-tempo history, refresh docs/screenshots, and verify the app.

**Architecture:** Pure-frontend React/TS/Vite app. localStorage is the only persistence layer. Changes are small, isolated edits; no backend or auth introduced.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Vitest, oxlint, Playwright CLI.

---

## File Structure

- Delete: `src/components/Metronome/BottomToolbar.tsx`, `src/lib/db.ts`, `src/lib/sync.ts`, `docs/plans/2026-11-18-google-auth-plan.md`
- Modify: `package.json`, `docs/specs/2026-11-15-metronome-design.md`, `docs/specs/2026-11-21-metronome-improvement-design.md`, `README.md`
- Modify: `src/components/Metronome/SettingsPanel.tsx`, `src/hooks/useSettings.ts`, `src/lib/bpmMath.ts`, `src/components/Metronome/SettingsPanel.tsx`, `src/components/Metronome/BpmDisplay.tsx`, `src/components/Metronome/Metronome.tsx`, `src/components/Metronome/PlaylistPlayer.tsx`, `src/components/Library/EditTrackModal.tsx`, `src/components/Library/Library.tsx`
- Create: `tests/unit/tapHistory.test.ts`
- Regenerate: `screenshots/*.jpg`

## Task Outline

1. Task 1 — Dead code and stale docs removal
2. Task 2 — Tap-tempo history (types + pure helper + tests)
3. Task 3 — Tap-tempo history UI + settings wiring
4. Task 4 — Lint warning cleanup
5. Task 5 — Screenshot regeneration
6. Task 6 — README and spec updates, final verification

---

## Task 1: Dead code and stale docs removal

**Files:**
- Delete: `src/components/Metronome/BottomToolbar.tsx`, `src/lib/db.ts`, `src/lib/sync.ts`, `docs/plans/2026-11-18-google-auth-plan.md`
- Modify: `package.json`, `docs/specs/2026-11-15-metronome-design.md`

- [x] **Step 1: Confirm files unused**

Run:
```bash
grep -rn "BottomToolbar\|from '@/lib/db'\|from '@/lib/sync'" src tests
```
Expected: only self-references inside files being deleted; no imports from other files.

- [x] **Step 2: Delete dead files**

Run:
```bash
rm src/components/Metronome/BottomToolbar.tsx src/lib/db.ts src/lib/sync.ts docs/plans/2026-11-18-google-auth-plan.md
```

- [x] **Step 3: Remove Dexie dependency**

Edit `package.json` dependencies: delete line `"dexie": "^4.4.7",`.

Run:
```bash
npm install
npm run build
```
Expected: build clean; no `dexie` in dependency tree.

- [x] **Step 4: Mark old design spec superseded**

At top of `docs/specs/2026-11-15-metronome-design.md`, after `# Metronome App — Design Spec`, add:
```markdown
> **Superseded.** This document describes the abandoned Supabase/Auth design.
> The shipped app is pure frontend with localStorage. See
> `docs/specs/2026-11-21-metronome-improvement-design.md` for current work.
```

- [x] **Step 5: Verify + commit**

Run:
```bash
npm run build && npx vitest run
git add -A && git commit -m "chore: remove dead code and stale docs"
```

---

## Task 2: Tap-tempo history — model and helper

**Files:**
- Modify: `src/components/Metronome/SettingsPanel.tsx`, `src/hooks/useSettings.ts`, `src/lib/bpmMath.ts`
- Test: `tests/unit/tapHistory.test.ts`

- [x] **Step 1: Add `tapHistory` to settings type and defaults**

In `src/components/Metronome/SettingsPanel.tsx`, add to `MetronomeSettings`:
```ts
  tapHistory: number[]; // recent tap-tempo BPM estimates, newest last
```
In `src/hooks/useSettings.ts`, add to `DEFAULT_SETTINGS`:
```ts
  tapHistory: [],
```
Old saved settings load correctly: `loadSettings()` already merges defaults with saved JSON.

- [x] **Step 2: Add pure helper to `src/lib/bpmMath.ts`**

```ts
export function appendTapHistory(history: number[], bpm: number, limit = 20): number[] {
  return [...history, bpm].slice(-limit);
}
```

- [x] **Step 3: Write failing test**

Create `tests/unit/tapHistory.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { appendTapHistory } from '@/lib/bpmMath';

describe('appendTapHistory', () => {
  it('appends newest BPM last', () => {
    expect(appendTapHistory([100, 110], 120)).toEqual([100, 110, 120]);
  });

  it('caps history at 20 entries', () => {
    const input = Array.from({ length: 25 }, (_, i) => 100 + i);
    const result = appendTapHistory(input, 200);
    expect(result).toHaveLength(20);
    expect(result[0]).toBe(105);
    expect(result[19]).toBe(200);
  });
});
```

- [x] **Step 4: Run test**

Run: `npx vitest run tests/unit/tapHistory.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/components/Metronome/SettingsPanel.tsx src/hooks/useSettings.ts src/lib/bpmMath.ts tests/unit/tapHistory.test.ts
git commit -m "feat: add tap-tempo history model and helper"
```

---

## Task 3: Tap-tempo history UI and wiring

**Files:**
- Modify: `src/components/Metronome/Metronome.tsx`, `src/components/Metronome/BpmDisplay.tsx`, `src/components/Metronome/SettingsPanel.tsx`

- [x] **Step 1: Record tap estimates in `Metronome.tsx`**

Import `appendTapHistory` from `@/lib/bpmMath`.

Replace `handleTap` with:
```tsx
  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, now].slice(-6);
    const newBpm = tapTempoToBpm(tapTimesRef.current);
    if (newBpm !== null) {
      metro.setBpm(newBpm);
      updateSettings((prev) => ({ ...prev, tapHistory: appendTapHistory(prev.tapHistory, newBpm) }));
    }
  }, [metro, updateSettings]);
```
Problem: `updateSettings` only accepts `Partial<MetronomeSettings>`, not a function. In `src/hooks/useSettings.ts` change its signature to:
```ts
  updateSettings: (patch: Partial<MetronomeSettings> | ((prev: MetronomeSettings) => Partial<MetronomeSettings>)) => void;
```
and implementation:
```ts
  const updateSettings = useCallback((patch: Partial<MetronomeSettings> | ((prev: MetronomeSettings) => Partial<MetronomeSettings>)) => {
    setSettings((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);
```
Keep all existing callers unchanged.

- [x] **Step 2: Show latest estimate in `BpmDisplay.tsx`**

Add optional prop `lastTap?: number`. Render below musical term, only when `lastTap` present:
```tsx
        {lastTap !== undefined && (
          <div className="text-[10px] text-[var(--ink-3)] mt-0.5">Last tap: {lastTap}</div>
        )}
```
In `Metronome.tsx`, pass `lastTap={settings.tapHistory.at(-1)}` to `<BpmDisplay>`.

- [x] **Step 3: Add history list + clear to SettingsPanel**

Inside `SettingsPanel`, after sound type selector:
```tsx
          <div className="pt-2 border-t border-[#333]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Tap History</h3>
              <button
                onClick={() => onChange({ tapHistory: [] })}
                className="text-xs text-[var(--ink-3)] hover:text-[var(--danger)] transition-colors"
              >
                Clear
              </button>
            </div>
            {settings.tapHistory.length === 0 ? (
              <p className="text-xs text-[var(--ink-3)]">No taps recorded</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {settings.tapHistory.slice(-10).map((bpm, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--ink-2)] font-mono">{bpm}</span>
                ))}
              </div>
            )}
          </div>
```

- [x] **Step 4: Verify + commit**

Run: `npm run build && npx vitest run`
Expected: build clean; tests pass.
```bash
git add src/components/Metronome/Metronome.tsx src/components/Metronome/BpmDisplay.tsx src/components/Metronome/SettingsPanel.tsx src/hooks/useSettings.ts
git commit -m "feat: show and persist tap-tempo history"
```

---

## Task 4: Lint warning cleanup

**Files:** `src/components/Metronome/PlaylistPlayer.tsx`, `src/components/Metronome/Metronome.tsx`, `src/hooks/useMetronome.ts`, `src/components/Library/EditTrackModal.tsx`

- [x] **Step 1: Fix PlaylistPlayer declaration order**

Move these two declarations to immediately after `tracks`:
```tsx
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrackList, setShowTrackList] = useState(false);
```
Remove their later declarations. This fixes "setCurrentIndex read while initializing" and useCallback memoization warnings.

- [x] **Step 2: Fix PlaylistPlayer effect + memoization warnings**

Replace sync effect with:
```tsx
  useEffect(() => {
    if (!initialPlaylistId) return;
    if (!playlists.some((p) => p.id === initialPlaylistId)) return;
    setSelectedPlaylistId(initialPlaylistId);
    setCurrentIndex(0);
  }, [initialPlaylistId, playlists]);
```
Convert `goToTrack`, `nextTrack`, `prevTrack`, `clearPlaylist` from `useCallback` to plain functions (`const goToTrack = (index: number) => { ... };`). They are only used by button handlers; no memoization needed.

- [x] **Step 3: Fix Metronome deps warnings**

In `applyTrackSettings`, destructure stable setters before callback:
```tsx
  const { setTimeSignature, setSubdivision } = metro;
  const currentTs = metro.timeSignature;

  const applyTrackSettings = useCallback((track: Track) => {
    // use setTimeSignature, setSubdivision, currentTs
  }, [setTimeSignature, setSubdivision, currentTs, updateSettings]);
```
This avoids the missing-`metro` warning without adding unstable `metro` object to deps.
In URL-param effect, add `navigate` to deps:
```tsx
  }, [location.search, metro, updateSettings, navigate]);
```
For `handleTap`, keep `[metro, updateSettings]` after Task 3 change.

- [x] **Step 4: Fix useMetronome scheduler self-reference**

Replace `scheduler` useCallback with named function expression referenced via ref:
```ts
  const schedulerRef = useRef<() => void>(() => {});

  const scheduler = useCallback(function schedule() {
    // existing body
    timerRef.current = window.setTimeout(() => schedulerRef.current(), 25);
  }, [playLevel]);

  schedulerRef.current = scheduler;
```
Remove `subdivisionInterval` from deps (not a hook value).

- [x] **Step 5: Fix EditTrackModal setState-in-effect**

In `src/components/Library/Library.tsx`, render modal with `key`:
```tsx
      <EditTrackModal
        key={editingTrack?.id ?? 'none'}
        track={editingTrack}
        ...
      />
```
In `EditTrackModal.tsx`, remove `useEffect` import and effect; initialize state from `track` directly:
```tsx
  const [title, setTitle] = useState(track?.title ?? '');
  const [bpm, setBpm] = useState(track?.bpm ? String(track.bpm) : '');
```
But `track` may be null; since component returns null when no track, guard is fine. For time signature/subdivision/pattern, use `track ? ... : default` initializers. Keep `handleTimeSignature`, `handleSave` as-is.

- [x] **Step 6: Verify lint + commit**

Run:
```bash
npm run lint
npm run build && npx vitest run
git add -A && git commit -m "refactor: clear lint warnings in metronome components"
```
Expected: zero oxlint warnings; build clean; tests pass. If any warning remains, fix inline before commit.

---

## Task 5: Regenerate screenshots

**Files:** `screenshots/metronome-desktop.jpg`, `screenshots/metronome-mobile.jpg`, `screenshots/library-mobile.jpg`, `screenshots/playlists-mobile.jpg`

- [x] **Step 1: Ensure preview server running**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```
Expected: `200`. If not running, run `npx vite preview --port 3000` in background.

- [x] **Step 2: Capture screenshots**

Use browser tool with explicit viewport sizes (desktop 1440×900, mobile 390×844). For each view:
- Open `http://localhost:3000/`, resize desktop, screenshot fullPage → `screenshots/metronome-desktop.jpg`
- Open `http://localhost:3000/`, resize mobile, screenshot fullPage → `screenshots/metronome-mobile.jpg`
- Open `http://localhost:3000/library`, resize mobile, screenshot fullPage → `screenshots/library-mobile.jpg`
- Open `http://localhost:3000/playlists`, resize mobile, screenshot fullPage → `screenshots/playlists-mobile.jpg`

If browser resize is unreliable, use Playwright CLI:
```bash
npx playwright screenshot --viewport-size="390,844" --full-page http://localhost:3000/ screenshots/metronome-mobile.jpg
```

- [x] **Step 3: Verify screenshots**

Run: `file screenshots/*.jpg`
Expected: valid JPEG files, non-trivial sizes.

- [x] **Step 4: Commit**

```bash
git add screenshots/ && git commit -m "docs: refresh app screenshots"
```

---

## Task 6: README and spec updates, final verification

**Files:** `README.md`, `docs/specs/2026-11-21-metronome-improvement-design.md`

- [x] **Step 1: Update README**

- Replace placeholder image line `![Metronome Screenshot](https://via.placeholder.com/...)` with screenshot table (already present in current README? verify; if present keep).
- Add features: per-track settings (time signature, subdivision, beat accents), tap-tempo history, FAB speed dial, desktop Settings nav, playlist memory.
- Update project structure: remove `BottomNav`, `db` from `lib`; add `BurgerMenu`; correct `Layout` comment.
- Update Edit tracks bullet: "Change title, BPM, time signature, subdivision, beat accents".
- Update Playlist player bullet: "remembers last playlist".

- [x] **Step 2: Update improvement spec status**

Append to `docs/specs/2026-11-21-metronome-improvement-design.md`:
```markdown
## Status (2026-11-21)
- Dead code removed; Dexie dependency removed.
- Stale auth plan removed; original design marked superseded.
- Lint warnings cleared.
- Tap-tempo history implemented and persisted.
- Docs and screenshots refreshed.
- Additional shipped work: FAB speed dial, desktop Settings nav, per-track settings, playlist memory, mobile spacing fixes.
```

- [x] **Step 3: Final verification**

Run:
```bash
npm run build
npx vitest run
npm run lint
```
Expected: build clean, tests pass, zero lint warnings.
Browser smoke: open metronome, library, playlists; check console empty; tap wheel a few times; open settings; verify tap history appears.

- [x] **Step 4: Commit + push**

```bash
git add -A && git commit -m "docs: update README and improvement spec"
git push origin feature/metronome-improvement
```

---

## Self-review notes

- Spec requirement coverage: Task 1 (dead code/stale docs), Task 2-3 (tap history), Task 4 (lint), Task 5-6 (docs/screenshots).
- All file paths and function names match current code at plan time.
- No placeholders.
