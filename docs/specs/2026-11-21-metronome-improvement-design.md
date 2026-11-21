# Metronome App — Improvement Round Design

**Date:** 2026-11-21
**Topic:** Improvement round (Option A — Cleanup + Quick Wins)
**Branch:** `feature/metronome-improvement`

## 1. Objective

Clean up accumulated dead weight from the pure-frontend migration and deliver one
high-value user-facing improvement, so the codebase is healthy and the metronome
gains a practical practice aid.

## 2. In Scope

### 2.1 Dead code removal
- Delete `src/components/Metronome/BottomToolbar.tsx` (no longer imported anywhere).
- Delete `src/lib/db.ts` (Dexie wrapper, unused).
- Delete `src/lib/sync.ts` (cache helpers, unused).
- Remove `dexie` from `package.json` dependencies.

### 2.2 Stale artifact cleanup
- Delete `docs/plans/2026-11-18-google-auth-plan.md` (auth plan obsolete after the
  pure-frontend/localStorage simplification).
- Mark `docs/specs/2026-11-15-metronome-design.md` as superseded (historical record).

### 2.3 Lint warning fixes (safe subset)
- `EditTrackModal.tsx` — setState-in-effect warning.
- `Metronome.tsx` — setState-in-effect warning (URL-param sync effect).
- `PlaylistPlayer.tsx` — useCallback dependency/memoization warnings.
- `useMetronome.ts` — self-referencing scheduler callback.

### 2.4 User-facing improvement: Tap-tempo history
- Persist last N tap estimates (capped, e.g. last 20) to localStorage.
- Surface the latest tap estimate in the BPM display.
- Allow clearing the history.

## 3. Out of Scope

- Backend / Auth (intentionally removed; must not regress).
- Major visual redesign.
- New subsystems beyond the tap history.

## 4. Design Details

### 4.1 Cleanup strategy
Pure deletions plus dependency removal; no behavior changes. Run build + tests
after each logical group.

### 4.2 Tap-tempo history design
- Storage: extend `metronome-settings` localStorage entry (via `useSettings`) with
  `tapHistory: number[]` (BPM estimates only, timestamps not required for MVP).
- Cap history length at 20 entries; newest last.
- UI: BPM display shows the most recent estimate when history is non-empty;
  history accessible/clearable from SettingsPanel (or BpmDisplay footer).

### 4.3 Data flow
- Client-only: localStorage keys `metronome-settings`, `metronome-tracks`,
  `metronome-playlists`. No backend.

## 5. Verification Plan

- `npm run build` — clean
- `npx vitest run` — all pass
- `npm run lint` — no new warnings
- Browser console check on dev server — no runtime errors
- Manual smoke: tap wheel, tap tempo, settings persist

## 6. Risks / Mitigations

- Lint refactors could touch metronome scheduling — keep fixes minimal/safe.
- Tap history persistence must not break existing settings load (backward compat).

---

Next step: write the implementation plan via the writing-plans skill.
