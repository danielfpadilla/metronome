# Metronome App — Design Spec

> **Superseded.** This document describes the abandoned Supabase/Auth design.
> The shipped app is pure frontend with localStorage. See
> `docs/specs/2026-11-21-metronome-improvement-design.md` for current work.

## 1. Architecture Overview

```
┌─────────────────────┐        ┌─────────────────────────┐        ┌────────────────────┐
│  Frontend (SPA)     │  ←─→   │  Supabase Edge Function │  ←─→   │  Supabase Storage  │
│  - Metronome UI     │        │  - yt-dlp + librosa     │        │  - Audio previews  │
│  - Library/Playlists│        │  - BPM extraction       │        │  - Cover art       │
│  - Auth (magic link)│        └─────────────────────────┘        └────────────────────┘
└─────────────────────┘
          │
          ▼
┌─────────────────────┐        ┌────────────────────┐
│  Supabase Postgres  │  ←─→   │  Supabase Auth     │
│  - users            │        │  - email magic     │
│  - tracks           │        │  - RLS policies    │
│  - playlists        │        └────────────────────┘
└─────────────────────┘
```

| Concern | Choice |
|---|---|
| Frontend | Single-page app (React/Preact or plain JS — decided during implementation) |
| Backend for BPM extraction | Supabase Edge Function running **Deno + `yt-dlp` + `librosa`**. Validates URL, downloads audio stream (YouTube), extracts BPM, uploads audio preview to Supabase Storage, stores metadata + BPM in Postgres. |
| Manual BPM entry | Stored directly in the `tracks` table; no audio download needed. |
| Auth | Supabase Auth email magic link (no password). **Metronome UI is publicly accessible without signup**; sign-up only required when saving BPM into a library or playlist. Row Level Security ensures users see only their own tracks/playlists. |
| Playlists | Users create/edit/delete playlists; each playlist contains ordered list of tracks with BPM, duration, etc. |
| Sync / Offline | Not in MVP initially; added later. |

---

## 2. Database Schema

```sql
-- Users (managed by Supabase Auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- Tracks in the library
create table tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  youtube_url text,
  bpm integer,
  duration_seconds integer,
  storage_path text,
  cover_art_url text,
  source text not null check (source in ('youtube', 'manual')),
  created_at timestamptz default now()
);

-- Playlists
create table playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Playlist-track junction (ordered)
create table playlist_tracks (
  playlist_id uuid not null references playlists(id) on delete cascade,
  track_id uuid not null references tracks(id) on delete cascade,
  position integer not null,
  primary key (playlist_id, track_id)
);

-- Indexes
create index tracks_user_id_idx on tracks(user_id);
create index playlists_user_id_idx on playlists(user_id);
create index playlist_tracks_playlist_id_idx on playlist_tracks(playlist_id);
```

**Row Level Security (RLS)** — every table owned by `auth.uid()`:

```sql
alter table tracks enable row level security;
alter table playlists enable row level security;
alter table playlist_tracks enable row level security;

create policy "Users manage own tracks" on tracks using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own playlists" on playlists using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own playlist_tracks" on playlist_tracks using (exists (select 1 from playlists where id = playlist_id and user_id = auth.uid())) with check (exists (select 1 from playlists where id = playlist_id and user_id = auth.uid()));
```

---

## 3. Edge Function: BPM Extraction

**File:** `supabase/functions/extract-bpm/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { exec } from "https://deno.land/std@0.224.0/process/mod.ts";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { youtube_url, track_id } = await req.json();

  // 1. Download audio via yt-dlp (15s preview for BPM analysis)
  const tmpAudio = `/tmp/${track_id}.mp3`;
  await exec([
    "yt-dlp",
    "-f", "bestaudio[ext=m4a]/best",
    "--no-playlist",
    "--max-filesize", "5M",
    "-o", tmpAudio,
    youtube_url,
  ]);

  // 2. Run librosa BPM detection (Python subprocess)
  const { stdout } = await exec([
    "python3",
    "bpm_detect.py",
    tmpAudio,
  ]);
  const bpm = parseInt(stdout.trim());

  // 3. Upload audio preview to Supabase Storage
  const audioBytes = await Deno.readFile(tmpAudio);
  const storagePath = `previews/${track_id}.mp3`;
  await supabase.storage.from("audio").upload(storagePath, audioBytes, {
    contentType: "audio/mpeg",
  });

  // 4. Update track with BPM and storage path
  await supabase
    .from("tracks")
    .update({ bpm, storage_path: storagePath })
    .eq("id", track_id);

  return new Response(JSON.stringify({ bpm, storage_path: storagePath }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Supporting file:** `supabase/functions/extract-bpm/bpm_detect.py`

```python
import sys, librosa
audio_path = sys.argv[1]
y, sr = librosa.load(audio_path, sr=22050, mono=True)
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
print(int(tempo))
```

**Deployment:** `supabase functions deploy extract-bpm`

---

## 4. Frontend Components

### 4.1 Metronome Engine (`Metronome.tsx`)
- Web Audio API oscillator for click generation
- BPM slider (40–240)
- Time signature selector (2/4, 3/4, 4/4, 6/8, …)
- Accent / subdivision controls
- Start/Stop/Pause buttons
- Visual beat indicator (circle fills on each beat)

**Reference features (from Soundbrenner metronome):**
- **BPM display** with numeric BPM + musical term (e.g., "Andante moderato" for 100 BPM)
- **+/- BPM buttons** on either side of the BPM display
- **Tap wheel** — large circular dial in center; tap to set tempo, or rotate to adjust BPM
- **Play/Pause** — wide bar button below the wheel
- **Subdivision buttons** — 4 buttons at bottom showing visual subdivisions (different densities)
- **Settings panel** (right-side) with:
  - Start count-in toggle
  - Pendulum mode toggle
  - Flash accent markers toggle
  - Flash screen toggle
  - Flash numbers toggle
  - Theme selector (Dark/Light)
  - Language selector
  - Accent 1/2/3 sound sliders (Woodblock, volume %, speaker icon)
- **Bottom toolbar** — time display (0:00), play, stop, metronome icon, pencil, eraser tools

### 4.2 Track Library (`Library.tsx`)
- Grid/list of tracks with: title, BPM, duration, cover art
- "Add Track" button → modal with YouTube URL input or manual BPM entry
- Search / filter by BPM, title, source
- Click to play audio preview in metronome (auto-sets BPM)

### 4.3 Playlist Manager (`Playlists.tsx`)
- Create / edit / delete playlists
- Drag-and-drop tracks into playlist (ordered)
- "Play playlist" → iterates tracks in order, sets metronome BPM per track, auto-advances after duration
- Visual progress bar showing time remaining

### 4.4 Auth Flow (`Auth.tsx`)
- **Metronome UI is public**: no sign-up required to open the metronome, adjust BPM/time signature, or play clicks.
- **Sign-up / sign-in required** only when saving a track (YouTube extraction or manual entry) into a library or adding a track to a playlist.
- Email magic link sign-in (no password).
- Session persistence; sign-in modal presented on “Add Track” if the user is not authenticated.
- Protected routes: Library and Playlists require a logged-in user.

### 4.5 Responsive Layout
- Mobile-first: bottom tab bar (Metronome / Library / Playlists / Profile)
- Desktop: sidebar navigation + main content area
- Dark mode (music practice at night)

### 4.6 Offline / PWA Layer
- **Service Worker**: Register for `install` and `fetch` events; cache static assets and index.html.
- **IndexedDB + Dexie.js**: Store tracks, playlists, and cached audio previews locally. First load uses the server; subsequent offline sessions read from DB.
- **Background Sync**: When connectivity returns, queue any pending `POST`/`PUT` calls (e.g., upload audio preview) and retry automatically.
- **Metronome engine** runs entirely client-side (Web Audio API) — works fully offline.
- **Edge function** still required for *online* BPM extraction; offline tracks show `"BPM pending"` until synced.

---

## 5. Data Flow

### 5.1 Adding a YouTube Track (online)
```
User (must be signed in) pastes YouTube URL
  → Frontend validates URL format
  → Creates track record (status: "processing", user_id from session)
  → Calls Supabase Edge Function extract-bpm
  → Edge function downloads audio, extracts BPM, uploads preview
  → Updates track with BPM + storage_path
  → Frontend polls or subscribes to track changes (Realtime)
  → Track appears in library with BPM
```

Note: Since only signed-in users can save BPM into a library/playlist, track creation is performed under the authenticated session. The public metronome UI remains fully functional without sign-in (no track persistence involved).

### 5.2 Adding a Manual Track
```
User (must be signed in) enters title + BPM
  → Frontend creates track record (source: "manual", bpm: user_input, user_id from session)
  → No edge function call
  → Track appears immediately in library
```

Note: Manual entry is only available to logged-in users, as it represents a saved BPM in their library.

### 5.3 Playing a Playlist (online)
```
User clicks "Play Playlist"
  → Frontend iterates tracks in order
  → For each track: set metronome BPM, play audio preview
  → Auto-advance to next track after its duration
  → Visual progress bar shows time remaining
```

### 5.4 Offline Behavior
- Library and metronome UI are available from IndexedDB even without network.
- BPM extraction for YouTube tracks cannot run offline; the track will display `"BPM pending"` and stay in processing state until the edge function completes and syncs.
- On reconnection, background sync pushes the result back to Postgres and updates the UI.

---

## 6. Error Handling

| Scenario | Behavior |
|---|---|
| Invalid YouTube URL | Frontend validation error message |
| YouTube video unavailable / private | Edge function returns 404; track marked "failed" |
| BPM extraction fails (silent audio) | Edge function returns null BPM; track marked "manual_bpm_pending" |
| Edge function timeout (>15 s) | Show "Processing…" with retry button |
| Storage upload fails | Show error, track remains in "processing" state |
| User deletes track | Cascade delete playlist_tracks + storage file |
| Offline mode loss of connection | Queue pending writes; retry on restore |

---

## 7. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS (or Preact for smaller bundle) |
| Styling | Tailwind CSS + dark theme |
| Backend API | Supabase Edge Functions (Deno) |
| BPM Extraction | `yt-dlp` + `librosa` (Python) |
| Database | Supabase Postgres |
| Auth | Supabase Auth (email magic link) |
| Storage | Supabase Storage (audio previews) |
| Realtime | Supabase Realtime (track status updates) |
| Deployment | Supabase dashboard (one-click) + static frontend host (Vercel/Netlify/Cloudflare) |
| Offline / PWA | Service Worker, IndexedDB + Dexie.js, Background Sync |

---

## 7.5. Reference Analysis (Soundbrenner Metronome)

### Source
- **Video:** `reference.mp4` (24.15s, 104.17 BPM detected via librosa)
- **Website:** https://metronome.soundbrenner.com/

### Key Features Adopted

| Category | Features |
|---|---|
| **Tempo Input** | Large circular **tap wheel** — tap to set tempo, rotate to fine-tune BPM; +/- BPM buttons on display |
| **BPM Display** | Numeric BPM + **musical term** (e.g., "Andante moderato" for 100 BPM) |
| **Time Signature** | Selector with visual fraction (4/4, 3/4, 6/8, etc.) |
| **Subdivisions** | 4 visual subdivision buttons with density patterns |
| **Playback Controls** | Wide Play/Pause bar; Stop button in bottom toolbar |
| **Visual Feedback** | **Pendulum mode** (metronome arm swings); **Flash accent markers** (accented beats flash); **Flash screen** (full screen flash); **Flash numbers** (beat numbers flash) |
| **Audio** | 3 accent levels (Accent 1/2/3) with **Woodblock** sound, independent volume sliders, speaker preview |
| **Settings** | Start count-in toggle; Theme (Dark/Light); Language selector |
| **Bottom Toolbar** | Time display (0:00), Play, Stop, Metronome icon, Pencil, Eraser |
| **Theme** | Dark default with **teal/cyan** accent color |

### Design Decisions
- Tap wheel replaces the simple BPM slider for more intuitive tempo control
- Musical term display adds professional feel and aids practice at different tempi
- Flash/pendulum visual modes provide multiple ways to "see" the beat
- Accent sound customization (3 levels) allows matching different practice needs
- Bottom toolbar includes creative tools (pencil/eraser) for marking music

---

## 8. MVP Scope (Phase 1)

**In scope:**
- ✅ Metronome engine (BPM, time signatures, accents, visual indicator)
- ✅ **Public metronome UI** — works without sign-up
- ✅ YouTube BPM extraction via edge function
- ✅ Manual BPM entry
- ✅ Track library (view, search, filter)
- ✅ Playlist creation + track ordering
- ✅ Email magic link auth (only required for saving tracks/playlists)
- ✅ Responsive layout (mobile + desktop)
- ✅ Dark mode
- ✅ **Offline mode & PWA install** — service worker registration, IndexedDB/Dexie cache, background sync for queued uploads
- ✅ **Tap wheel** for tempo input
- ✅ **BPM display** with musical terms (e.g., "Andante moderato")
- ✅ **Subdivision buttons** with visual patterns
- ✅ **Settings panel** (count-in, pendulum, flash modes, accent sounds)
- ✅ **Bottom toolbar** with time display, play/stop, pencil, eraser

**Out of scope (Phase 2+):**
- ❌ Offline-only mode without sync (added above)
- ❌ Local audio file uploads (only YouTube URLs + manual entry)
- ❌ Playlist sharing / collaboration
- ❌ Advanced rhythm patterns (swing, humanization)
- ❌ Custom cover art beyond YouTube thumbnail
- ❌ BPM confidence / key detection

---

## 9. Testing Strategy

| Test Type | Coverage |
|---|---|
| Unit tests | Metronome engine (BPM math, beat subdivisions), utility functions |
| Integration tests | Edge function BPM extraction (mock yt-dlp/librosa), API endpoints |
| Component tests | Track card, playlist manager, auth flow, offline cache |
| E2E (Playwright) | Full flow: sign-in → add YouTube track → BPM appears → create playlist → play playlist |
| Offline tests | Load library from IndexedDB, verify metronome works without network, confirm sync retries |
| Manual testing | Real YouTube URLs, short videos, silent videos, private videos |
| **Reference parity tests** | Verify tap wheel, BPM display with musical terms, flash/pendulum visual modes, accent sound sliders match Soundbrenner reference video |

---

## 10. Open Questions

1. **Frontend framework:** React + TypeScript vs Preact (smaller bundle, similar API)?
2. **Audio preview length:** 15 seconds for BPM analysis — enough or do you want full track previews?
3. **Playlist playback:** Auto-advance through tracks, or manual click-through?
4. **Cover art:** Use YouTube thumbnail by default, or allow custom upload later?
5. **PWA install method:** How should the user trigger the service worker (browser action, devtools, or simple link)? (Affects offline activation speed.)
6. **Offline data limits:** Expected number of tracks/previews stored in IndexedDB before eviction?
7. **Public access enforcement:** Should the app force sign-in immediately on “Add Track”, or allow a brief preview before prompting auth?
8. **Anonymous BPM extraction:** Not required — user must sign up before any BPM is saved to library/playlist (this avoids anonymous writes to Postgres).
9. **Tap wheel vs slider:** Use both? The tap wheel as primary tempo control with a hidden slider fallback?
10. **Musical terms:** Map BPM to standard Italian terms (Largo, Adagio, Andante, Moderato, Allegro, Presto) — include all ranges 40–240?

---

*Document saved to `docs/specs/2026-11-15-metronome-design.md`.*
