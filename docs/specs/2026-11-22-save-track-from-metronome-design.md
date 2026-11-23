# Save Track from Metronome Page — Design Spec

**Date:** 2026-11-22
**Topic:** Save track from metronome page
**Branch:** `feature/metronome-improvement` (or a follow-up branch)

## 1. Objective

Add a "Save" action on the Metronome page so the current BPM and per-track settings can be saved as a new manual track without leaving the metronome.

## 2. Scope

### In scope
- Save button on the Metronome page, shown only when no playlist is loaded.
- SaveTrackModal with title input and read-only current settings.
- Extend `useTracks.addManualTrack` to persist `timeSignature`, `subdivision`, and `accentPattern`.
- Inline success confirmation on the Metronome page.
- Focused tests for the new behavior.

### Out of scope
- Editing an existing track from the Metronome page.
- Auto-saving on every BPM change.
- Persisting global sound type per track.
- Backend or authentication.

## 3. Architecture

- `Metronome` owns `showSaveModal` and `savedMessage` state.
- `useTracks.addManualTrack(title, bpm, settings?)` creates a manual track with the supplied settings.
- Saved track data is stored through the existing localStorage track hook.
- No navigation occurs after saving.

## 4. Components

### Metronome
- Adds `Save` button next to the Play button only when no playlist is loaded.
- Disables `Save` while the modal is open or while saving.
- Shows inline `Saved to Library` for 2 seconds after success.

### SaveTrackModal
- Props: `isOpen`, `onClose`, `onSave(title, settings)`, `bpm`, `timeSignature`, `subdivision`, `accentPattern`.
- Prefills title with `Manual Track <bpm> BPM`.
- Shows current settings as read-only context.
- Validates non-empty title.
- Shows save errors inside the modal.

### Track settings fields
- Reuse the existing time signature, subdivision, and beat accent controls from `EditTrackModal` where practical, or mirror their behavior.

## 5. Data flow

1. User taps `Save`.
2. Modal opens with current metronome state.
3. User edits title or accepts default.
4. On save, `addManualTrack` stores:
   - `title`
   - `bpm`
   - `source: 'manual'`
   - `status: 'ready'`
   - `timeSignature`
   - `subdivision`
   - `accentPattern`
5. On success, modal closes and confirmation appears.
6. On failure, modal stays open and shows the error.

## 6. Edge cases

- Empty or whitespace-only title blocks save.
- BPM is already clamped by the metronome engine (40–240).
- Storage failures show a clear error and keep the modal open.
- Duplicate titles are allowed.
- Tracks without saved settings keep existing default behavior.
- Rapid repeated save attempts are prevented by disabling the Save button while the modal is open.

## 7. Accessibility and UX

- Modal has a close button and labeled inputs.
- Save button has an accessible label.
- Inline confirmation is announced visually and does not block interaction.
- Reduced-motion support remains unaffected.

## 8. Testing

- `useTracks`: `addManualTrack` persists title, BPM, time signature, subdivision, and accent pattern.
- `SaveTrackModal`: renders current settings, blocks empty title, calls `onSave` with settings, shows error on failure.
- `Metronome`: Save button disabled while modal open; confirmation appears after successful save.
- Existing build, lint, and component tests continue to pass.

## 9. Risks

- Modal state must reset cleanly between saves.
- Settings passed from Metronome must be read at save time, not captured stale.
- localStorage quota errors must be handled without partial UI state.
