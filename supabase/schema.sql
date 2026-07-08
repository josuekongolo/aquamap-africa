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

-- ---------------------------------------------------------------------------
-- 7. REAL-TIME, EXPANDED EVENTS & JOURNAL  (run once; re-run safe)
--    Powers: live dashboard/map (Realtime), richer event types, unified journal.
-- ---------------------------------------------------------------------------

-- 7a. Structured payload for richer events (mortality / treatment / water / sampling…).
--     events.type is free-text, so new categories need no constraint change.
alter table public.events add column if not exists details jsonb not null default '{}'::jsonb;

-- 7b. Unified, RLS-respecting journal (logs ∪ events) for the timeline UI.
--     security_invoker => the caller's existing RLS applies (agents see only theirs).
create or replace view public.journal with (security_invoker = on) as
  select id, operator_id, created_by, 'log'::text as source,
         type as entry_type, log_date as entry_date, note as description,
         jsonb_build_object(
           'species', species, 'fingerlings_count', fingerlings_count,
           'avg_weight_g', avg_weight_g, 'feed_kg', feed_kg,
           'kg_harvested', kg_harvested, 'kg_sold', kg_sold,
           'price_per_kg', price_per_kg, 'buyer_type', buyer_type
         ) as data, null::text as severity, created_at
  from public.logs
  union all
  select id, operator_id, created_by, 'event'::text as source,
         type as entry_type, event_date as entry_date, description,
         coalesce(details, '{}'::jsonb) as data, severity, created_at
  from public.events;

-- 7c. Realtime — expose tables on the supabase_realtime publication + full row images
--     (replica identity full so UPDATE/DELETE payloads carry operator_id/created_by).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'operators') then
    alter publication supabase_realtime add table public.operators;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'logs') then
    alter publication supabase_realtime add table public.logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'events') then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
alter table public.operators replica identity full;
alter table public.logs      replica identity full;
alter table public.events    replica identity full;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Aquaculture sites (precomputed Google Places cache for the public map).
--    NOT user-owned reference data: populated by scripts/populate-aquaculture-sites.mjs
--    (service role, bypasses RLS). Everyone may read; nobody writes via anon/auth.
create table if not exists public.aquaculture_sites (
  id          text primary key,           -- Google place id
  name        text not null,
  address     text,
  phone       text,
  website     text,
  lat         double precision,
  lng         double precision,
  type        text,
  maps_uri    text,
  source      text not null default 'google_places',
  updated_at  timestamptz not null default now()
);
alter table public.aquaculture_sites enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'aquaculture_sites' and policyname = 'aquaculture_sites_public_read'
  ) then
    create policy aquaculture_sites_public_read on public.aquaculture_sites
      for select using (true);  -- public map data; no write policy => only service role writes
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Equipment suppliers (precomputed Google Places cache for /suppliers, Africa-wide).
--    Like aquaculture_sites but with a `category` (feed/fingerling/ras/aeration/water).
--    Populated by scripts/populate-equipment-suppliers.mjs (service role). Public read.
create table if not exists public.equipment_suppliers (
  id          text primary key,           -- Google place id
  name        text not null,
  category    text not null,              -- feed | fingerling | ras | aeration | water
  address     text,
  phone       text,
  website     text,
  lat         double precision,
  lng         double precision,
  type        text,
  maps_uri    text,
  source      text not null default 'google_places',
  updated_at  timestamptz not null default now()
);
alter table public.equipment_suppliers enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'equipment_suppliers' and policyname = 'equipment_suppliers_public_read'
  ) then
    create policy equipment_suppliers_public_read on public.equipment_suppliers
      for select using (true);
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. AQUACULTURE CO-MANAGEMENT (ACM) — FAO DACMS-aligned entities.
--     Terminology follows FAO's "Guidebook for developing aquaculture
--     co-management systems" (FAO 2024, doi 10.4060/cd1410en) and its Annex 1/2
--     assessment sheets (cd0722en / cd0723en). Same ownership model as the rest
--     of the app: the registering agent owns the rows; admins read everything.

-- 10a. GROUPS — co-management committees / producer organizations.
--      acm_model + degree use the guidebook's typologies (§3.2, §3.3).
create table if not exists public.groups (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references public.agents (id) on delete cascade,
  name          text not null,
  group_type    text check (group_type in ('committee', 'cooperative', 'association', 'network')),
  acm_model     text check (acm_model in ('communal', 'collective', 'zonal', 'intersectoral')),
  degree        text check (degree in ('instructive', 'consultative', 'cooperative', 'delegated')),
  country       text,
  region        text,
  lat           double precision,
  lng           double precision,
  description   text,
  established_on date,
  registered    boolean default false,   -- formally registered organization (Annex I.1.3.1)
  members_declared integer,              -- total members incl. those not registered as operators
  women_declared   integer,
  youth_declared   integer,
  created_at    timestamptz not null default now()
);
create index if not exists groups_created_by_idx on public.groups (created_by);

-- 10b. GROUP MEMBERS — links registered operators to a group (role on committee).
create table if not exists public.group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  operator_id uuid not null references public.operators (id) on delete cascade,
  created_by  uuid not null references public.agents (id) on delete cascade,
  role        text not null default 'member' check (role in ('member', 'committee', 'leader')),
  joined_on   date,
  created_at  timestamptz not null default now(),
  unique (group_id, operator_id)
);
create index if not exists group_members_group_idx on public.group_members (group_id);

-- 10c. MEETINGS — regular participatory meetings + minutes (Annex 1.2.A.4/1.2.C.3;
--      women attendance tracked per indicator 1.2.C.3.2).
create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups (id) on delete cascade,
  created_by      uuid not null references public.agents (id) on delete cascade,
  meeting_date    date not null,
  title           text,
  attendees_count integer,
  women_count     integer,
  minutes         text,     -- meeting minutes available to all participants (1.2.B.6.1)
  decisions       text,
  created_at      timestamptz not null default now()
);
create index if not exists meetings_group_idx on public.meetings (group_id);

-- 10d. PLANS — the co-management PLAN (technical document) and, optionally, the
--      signed AGREEMENT (legal document) per guidebook Box 2.
create table if not exists public.plans (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid not null references public.groups (id) on delete cascade,
  created_by          uuid not null references public.agents (id) on delete cascade,
  title               text not null,
  status              text not null default 'draft' check (status in ('draft', 'active', 'under_review', 'completed')),
  vision              text,     -- collective vision / goals & objectives
  conflict_mechanism  text,     -- documented conflict-management mechanism (1.2.B.5.1)
  adopted_on          date,
  review_due          date,     -- agreed timeline for re-evaluation (§6.2 step 9; every 3–5 yrs)
  has_agreement       boolean default false,
  agreement_signed_on date,
  languages           text[] default '{}',  -- translations available (1.2.C.1.3)
  created_at          timestamptz not null default now()
);
create index if not exists plans_group_idx on public.plans (group_id);

-- 10e. PLAN INDICATORS — SMART indicators with baseline & target defined in the
--      plan's M&E section (Annex 1.2.C.5.2). Categories from Annex 2 (social /
--      economic / ecological / governance).
create table if not exists public.plan_indicators (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.plans (id) on delete cascade,
  created_by  uuid not null references public.agents (id) on delete cascade,
  name        text not null,
  category    text not null check (category in ('social', 'economic', 'ecological', 'governance')),
  unit        text,
  baseline    numeric,
  target      numeric,
  current     numeric,
  note        text,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists plan_indicators_plan_idx on public.plan_indicators (plan_id);

-- 10f. INCIDENTS — conflict & compliance register (Annex 1.2.B.5 conflict
--      mechanism; I.1.7/I.1.8 enforcement & graduated sanctions).
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  created_by    uuid not null references public.agents (id) on delete cascade,
  incident_date date not null,
  kind          text not null check (kind in ('conflict', 'violation')),
  conflict_type text check (conflict_type in ('producer_producer', 'producer_state', 'producer_external')),
  parties       text,
  description   text,
  status        text not null default 'open' check (status in ('open', 'mediation', 'resolved', 'escalated')),
  sanction      text,     -- graduated sanction applied, if a rule violation (I.1.8.1)
  resolution    text,
  resolved_on   date,
  created_at    timestamptz not null default now()
);
create index if not exists incidents_group_idx on public.incidents (group_id);

-- 10g. ZONES — demarcated boundaries as GeoJSON polygons: the co-managed area
--      plus exclusion zones (conservation, nursery grounds, navigation routes)
--      per Annex indicator I.1.2.1 ("GIS-based maps … incorporated in the
--      co-management agreement").
create table if not exists public.zones (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  created_by  uuid not null references public.agents (id) on delete cascade,
  name        text not null,
  zone_type   text not null default 'comanaged' check (zone_type in ('comanaged', 'conservation', 'nursery', 'navigation', 'other')),
  geojson     jsonb not null,   -- GeoJSON Polygon geometry
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists zones_group_idx on public.zones (group_id);

-- 10h. ASSESSMENTS — DACMS Annex 1 self-assessment: one score per indicator per
--      group (yes / partly / no / not applicable), updated in place.
create table if not exists public.assessments (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  created_by   uuid not null references public.agents (id) on delete cascade,
  criterion_id text not null,   -- e.g. 'I.1.2.1' — ids ship in src/data/dacms.js
  score        text not null check (score in ('yes', 'partly', 'no', 'na')),
  comment      text,
  assessed_on  date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (group_id, criterion_id)
);
create index if not exists assessments_group_idx on public.assessments (group_id);

-- 10i. RLS — owner full CRUD; admin read-all (same pattern as operators/logs).
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.meetings        enable row level security;
alter table public.plans           enable row level security;
alter table public.plan_indicators enable row level security;
alter table public.incidents       enable row level security;
alter table public.zones           enable row level security;
alter table public.assessments     enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('drop policy if exists %1$s_owner_all on public.%1$s', tbl);
    execute format('create policy %1$s_owner_all on public.%1$s for all using (created_by = auth.uid()) with check (created_by = auth.uid())', tbl);
    execute format('drop policy if exists %1$s_admin_read on public.%1$s', tbl);
    execute format('create policy %1$s_admin_read on public.%1$s for select using (public.is_admin())', tbl);
  end loop;
end $$;

-- 10j. COMMUNITY OVERVIEW — the transparency mechanism (Annex 1.2.A.4
--      "establish transparent information"). Signed-in agents see ANONYMIZED
--      aggregates across ALL agents (never row-level data, never PII); the
--      per-agent RLS silo stays intact for everything else.
create or replace function public.community_overview()
returns jsonb
language sql
security definer set search_path = public
stable
as $$
  select case when auth.uid() is null then null else jsonb_build_object(
    'operators_total',   (select count(*) from operators),
    'agents_total',      (select count(*) from agents),
    'groups_total',      (select count(*) from groups),
    'members_total',     (select count(*) from group_members),
    'women_share',       (select round(100.0 * count(*) filter (where gender in ('Femme', 'Female'))
                                 / nullif(count(*) filter (where gender is not null and gender <> ''), 0))
                          from operators),
    'youth_share',       (select round(100.0 * count(*) filter (where age_range in ('18-25', '26-35'))
                                 / nullif(count(*) filter (where age_range is not null and age_range <> ''), 0))
                          from operators),
    'harvest_12m_kg',    (select coalesce(sum(kg_harvested), 0) from logs
                          where type = 'harvest' and log_date >= current_date - interval '12 months'),
    'feed_12m_kg',       (select coalesce(sum(feed_kg), 0) from logs
                          where type = 'feed' and log_date >= current_date - interval '12 months'),
    'meetings_12m',      (select count(*) from meetings where meeting_date >= current_date - interval '12 months'),
    'incidents_open',    (select count(*) from incidents where status in ('open', 'mediation', 'escalated')),
    'incidents_resolved_12m', (select count(*) from incidents where status = 'resolved'
                               and coalesce(resolved_on, incident_date) >= current_date - interval '12 months'),
    'countries',         (select coalesce(jsonb_agg(jsonb_build_object(
                            'country', c.country, 'operators', c.n, 'women', c.women, 'groups', c.g)), '[]'::jsonb)
                          from (
                            select o.country, count(*) as n,
                                   count(*) filter (where o.gender in ('Femme', 'Female')) as women,
                                   (select count(*) from groups gr where gr.country = o.country) as g
                            from operators o where o.country is not null and o.country <> ''
                            group by o.country order by count(*) desc
                          ) c)
  ) end;
$$;
revoke all on function public.community_overview() from public;
revoke all on function public.community_overview() from anon;
grant execute on function public.community_overview() to authenticated;
