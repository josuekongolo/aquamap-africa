-- AquaMap Africa — database schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query) once, after
-- creating your project. Idempotent: safe to re-run.
--
-- Model: NGO/extension *agents* are the only authenticated users. Each agent
-- registers *operators* (fish farmers) and records production *logs* and
-- *events* on their behalf. An agent sees only the rows they created; an
-- *admin* sees everything (for the aggregated national dashboard / map).

-- ---------------------------------------------------------------------------
-- 1. AGENTS — profile row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.agents (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  organization text,
  role         text not null default 'agent' check (role in ('agent', 'admin')),
  created_at   timestamptz not null default now()
);

-- Auto-create an agent profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.agents (id, full_name, organization)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'organization', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user an admin?  (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.agents where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. OPERATORS — fish farmers (farm profile folded in; one form, one row)
-- ---------------------------------------------------------------------------
create table if not exists public.operators (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid not null references public.agents (id) on delete cascade,
  name            text not null,
  phone           text,
  country         text,
  region          text,
  lat             double precision,
  lng             double precision,
  gender          text,
  age_range       text,
  legal_status    text,
  units           integer,
  area_m2         numeric,
  systems         text[]  default '{}',
  species         text[]  default '{}',
  water_source    text,
  electricity     boolean,
  road_access     boolean,
  production_range text,
  revenue_range   text,
  sales_channel   text,
  financing       boolean,
  training_wanted boolean,
  challenges      text[]  default '{}',
  created_at      timestamptz not null default now()
);
create index if not exists operators_created_by_idx on public.operators (created_by);

-- ---------------------------------------------------------------------------
-- 3. LOGS — production events (stocking / feed / harvest) → drive FCR
-- ---------------------------------------------------------------------------
create table if not exists public.logs (
  id               uuid primary key default gen_random_uuid(),
  operator_id      uuid not null references public.operators (id) on delete cascade,
  created_by       uuid not null references public.agents (id) on delete cascade,
  type             text not null check (type in ('stocking', 'feed', 'harvest')),
  log_date         date not null,
  species          text,
  fingerlings_count integer,   -- stocking
  avg_weight_g     numeric,    -- stocking / harvest
  feed_kg          numeric,    -- feed
  kg_harvested     numeric,    -- harvest
  kg_sold          numeric,    -- harvest
  price_per_kg     numeric,    -- harvest (FCFA)
  buyer_type       text,       -- harvest
  note             text,
  created_at       timestamptz not null default now()
);
create index if not exists logs_operator_idx on public.logs (operator_id);
create index if not exists logs_created_by_idx on public.logs (created_by);

-- ---------------------------------------------------------------------------
-- 4. EVENTS — incidents (disease / mortality / water / equipment)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators (id) on delete cascade,
  created_by  uuid not null references public.agents (id) on delete cascade,
  event_date  date not null,
  type        text,
  severity    text check (severity in ('low', 'medium', 'high')),
  description text,
  created_at  timestamptz not null default now()
);
create index if not exists events_operator_idx on public.events (operator_id);

-- ---------------------------------------------------------------------------
-- 5. ROW-LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.agents    enable row level security;
alter table public.operators enable row level security;
alter table public.logs      enable row level security;
alter table public.events    enable row level security;

-- agents: read/update own profile; admins read all
drop policy if exists agents_select_self on public.agents;
create policy agents_select_self on public.agents
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists agents_update_self on public.agents;
create policy agents_update_self on public.agents
  for update using (id = auth.uid());

-- operators / logs / events: owner full CRUD; admin read-all.
-- (Macro-style repetition kept explicit for clarity.)
drop policy if exists operators_owner_all on public.operators;
create policy operators_owner_all on public.operators
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists operators_admin_read on public.operators;
create policy operators_admin_read on public.operators
  for select using (public.is_admin());

drop policy if exists logs_owner_all on public.logs;
create policy logs_owner_all on public.logs
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists logs_admin_read on public.logs;
create policy logs_admin_read on public.logs
  for select using (public.is_admin());

drop policy if exists events_owner_all on public.events;
create policy events_owner_all on public.events
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. PROMOTE YOURSELF TO ADMIN (run once, after you sign up the first agent)
--    update public.agents set role = 'admin' where id = (
--      select id from auth.users where email = 'you@example.com'
--    );
-- ---------------------------------------------------------------------------
