-- AlivioVenezuela — initial schema.
--
-- Run this once in the Supabase SQL editor for a new project. It creates the
-- enums (ordered to match `src/domain/Need.ts`, so `ORDER BY urgency` sorts
-- critical-first with no extra mapping logic), the `needs` + `status_updates`
-- tables, read-only RLS policies for the anon (browser) client, the realtime
-- publication, and a handful of demo seed rows so a fresh deploy is never
-- blank.
--
-- Writes (insert/update) are performed by the server using the service role
-- key, which bypasses RLS, so no write policies are defined here.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type category as enum ('water', 'medicine', 'shelter', 'food', 'other');
create type urgency as enum ('critical', 'high', 'medium');
create type need_status as enum ('open', 'in_progress', 'covered');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table needs (
  id uuid primary key default gen_random_uuid(),
  category category not null,
  description text not null check (char_length(description) between 1 and 500),
  urgency urgency not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location_label text not null check (char_length(location_label) between 1 and 200),
  status need_status not null default 'open',
  created_at timestamptz not null default now(),
  reporter_contact text check (char_length(reporter_contact) <= 200)
);

create index needs_category_idx on needs (category);
create index needs_status_idx on needs (status);
create index needs_urgency_created_at_idx on needs (urgency, created_at desc);

create table status_updates (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references needs (id) on delete cascade,
  old_status need_status,
  new_status need_status not null,
  changed_at timestamptz not null default now(),
  changed_by text check (char_length(changed_by) <= 200)
);

create index status_updates_need_id_idx on status_updates (need_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: read-only for the anon (browser) client.
-- The server writes with the service role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table needs enable row level security;
alter table status_updates enable row level security;

create policy "Public read access to needs"
  on needs for select
  to anon, authenticated
  using (true);

create policy "Public read access to status_updates"
  on status_updates for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Realtime: broadcast changes on `needs` so every connected client stays in
-- sync without a manual refresh.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table needs;

-- ---------------------------------------------------------------------------
-- Demo seed rows so the deployed URL is never blank.
-- ---------------------------------------------------------------------------
insert into needs
  (category, description, urgency, lat, lng, location_label, status, reporter_contact, created_at)
values
  ('water', 'Familias sin agua potable desde el terremoto.', 'critical', 10.34, -68.74, 'San Felipe, Yaracuy', 'open', 'Comité vecinal', now() - interval '12 minutes'),
  ('medicine', 'Se necesitan insulina y analgésicos.', 'critical', 10.162, -68.0077, 'Valencia centro, Carabobo', 'open', null, now() - interval '34 minutes'),
  ('shelter', 'Refugio temporal para 12 personas.', 'high', 10.235, -68.73, 'Cocorote, Yaracuy', 'in_progress', 'Cruz local', now() - interval '70 minutes'),
  ('food', 'Comida para albergue infantil.', 'high', 10.178, -67.99, 'Naguanagua, Carabobo', 'open', null, now() - interval '95 minutes'),
  ('water', 'Cisterna requerida para sector alto.', 'medium', 10.07, -68.005, 'Los Guayos, Carabobo', 'open', null, now() - interval '140 minutes'),
  ('other', 'Pañales y artículos de higiene.', 'medium', 10.33, -68.755, 'Independencia, Yaracuy', 'covered', 'Donante anónimo', now() - interval '220 minutes');
