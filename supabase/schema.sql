-- Production Portal shared state storage.
-- WARNING: these policies allow anyone with the app URL and anon key to read/write shared data.
-- Use only for trusted internal testing. For production, enable Supabase Auth and restrict policies.

create table if not exists public.production_portal_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.production_portal_state enable row level security;

grant select, insert, update on public.production_portal_state to anon, authenticated;

 drop policy if exists "Public can read shared production portal state" on public.production_portal_state;
create policy "Public can read shared production portal state"
  on public.production_portal_state for select to anon, authenticated using (true);

 drop policy if exists "Public can insert shared production portal state" on public.production_portal_state;
create policy "Public can insert shared production portal state"
  on public.production_portal_state for insert to anon, authenticated with check (true);

 drop policy if exists "Public can update shared production portal state" on public.production_portal_state;
create policy "Public can update shared production portal state"
  on public.production_portal_state for update to anon, authenticated using (true) with check (true);
