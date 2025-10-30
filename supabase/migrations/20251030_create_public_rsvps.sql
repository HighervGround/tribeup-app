-- Create public_rsvps table for unauthenticated RSVPs
create table if not exists public.public_rsvps (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text,
  attending boolean not null default true,
  ip_hash text,
  created_at timestamptz not null default now()
);

create unique index if not exists ux_public_rsvps_game_email on public.public_rsvps (game_id, lower(email));
create index if not exists ix_public_rsvps_game on public.public_rsvps (game_id);

-- Simple aggregate view for fast counts
create or replace view public.game_public_rsvp_count as
select game_id, count(*) filter (where attending) as public_count
from public.public_rsvps
group by game_id;

-- Enable RLS
alter table public.public_rsvps enable row level security;

-- Allow inserts from anon users with minimal fields
drop policy if exists public_rsvps_insert_anon on public.public_rsvps;
create policy public_rsvps_insert_anon on public.public_rsvps
for insert to anon
with check (true);

-- Allow select of minimal fields for anyone
drop policy if exists public_rsvps_select_all on public.public_rsvps;
create policy public_rsvps_select_all on public.public_rsvps
for select to anon, authenticated
using (true);


