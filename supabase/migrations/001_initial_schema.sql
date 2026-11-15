-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (managed by Supabase Auth, extended here)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- Tracks in the library
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
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
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Playlist-track junction (ordered)
create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position integer not null,
  primary key (playlist_id, track_id)
);

-- Indexes
create index if not exists tracks_user_id_idx on public.tracks(user_id);
create index if not exists playlists_user_id_idx on public.playlists(user_id);
create index if not exists playlist_tracks_playlist_id_idx on public.playlist_tracks(playlist_id);

-- Row Level Security
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

create policy "Users manage own tracks" on public.tracks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own playlists" on public.playlists
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own playlist_tracks" on public.playlist_tracks
  using (exists (select 1 from public.playlists where id = playlist_id and user_id = auth.uid()))
  with check (exists (select 1 from public.playlists where id = playlist_id and user_id = auth.uid()));

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();