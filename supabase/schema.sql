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

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. PRE-LAUNCH SECURITY HARDENING
--     (a) agents cannot self-promote to admin; (b) deleting an agent no longer
--     cascade-deletes their field data; (c) soft deactivation; (d) farmer
--     consent capture (privacy compliance).

-- 11a. Block role self-promotion. agents_update_self allows profile edits, but
--      role changes must come from an admin. Rule: requests carrying an
--      end-user JWT (auth.uid() not null) may only change role if that user is
--      an admin. Service-role and SQL-editor sessions have no auth.uid() and
--      stay able to promote (that's how the first admin is made); anon can't
--      reach UPDATE at all (RLS agents_update_self requires id = auth.uid()).
create or replace function public.protect_agent_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'role changes require an administrator';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_agent_role on public.agents;
create trigger protect_agent_role
  before update on public.agents
  for each row execute function public.protect_agent_role();

-- 11b. Offboarding safety: created_by FKs become RESTRICT so removing an agent
--      (or their auth.users row, which cascades to agents) cannot silently
--      destroy operators, logs, events, or DACMS records. Reassign first
--      (Phase-4 reassign_agent_data), then delete.
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events','groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('alter table public.%1$s drop constraint if exists %1$s_created_by_fkey', tbl);
    execute format('alter table public.%1$s add constraint %1$s_created_by_fkey foreign key (created_by) references public.agents (id) on delete restrict', tbl);
  end loop;
end $$;

-- 11c. Soft deactivation (offboarding without deletion).
alter table public.agents add column if not exists active boolean not null default true;

-- 11d. Farmer consent (agent attests informed consent at registration).
alter table public.operators add column if not exists consent_given boolean;
alter table public.operators add column if not exists consent_date  date;

-- 11e. agent_portfolio() — one query powering the portfolio dashboard:
--      per-operator rollups for the caller's visible operators (SECURITY
--      INVOKER, so RLS scopes it: agent → own rows; admin → all). The "current
--      cycle" is the window since the latest stocking log. FCR rating happens
--      client-side (species bands live in src/data/species.js).
create or replace function public.agent_portfolio()
returns table (
  operator_id        uuid,
  last_log_date      date,
  last_event_date    date,
  high_events_30d    integer,
  cycle_start        date,
  cycle_species      text,
  cycle_fingerlings  integer,
  cycle_stocked_kg   numeric,
  cycle_feed_kg      numeric,
  cycle_harvest_kg   numeric,
  cycle_mortality    integer
)
language sql
stable
as $$
  with last_stock as (
    select distinct on (operator_id)
           operator_id, log_date, species, fingerlings_count,
           (coalesce(fingerlings_count, 0) * coalesce(avg_weight_g, 0)) / 1000.0 as stocked_kg
    from public.logs
    where type = 'stocking'
    order by operator_id, log_date desc
  )
  select
    o.id,
    (select max(l.log_date)   from public.logs   l where l.operator_id = o.id),
    (select max(e.event_date) from public.events e where e.operator_id = o.id),
    (select count(*)::int from public.events e
      where e.operator_id = o.id and e.severity = 'high'
        and e.event_date >= current_date - interval '30 days'),
    ls.log_date, ls.species, ls.fingerlings_count, ls.stocked_kg,
    (select coalesce(sum(l.feed_kg), 0) from public.logs l
      where l.operator_id = o.id and l.type = 'feed' and l.log_date >= ls.log_date),
    (select coalesce(sum(l.kg_harvested), 0) from public.logs l
      where l.operator_id = o.id and l.type = 'harvest' and l.log_date >= ls.log_date),
    (select coalesce(sum(nullif(e.details->>'count', '')::int), 0) from public.events e
      where e.operator_id = o.id and e.type = 'mortality' and e.event_date >= ls.log_date)
  from public.operators o
  left join last_stock ls on ls.operator_id = o.id;
$$;
grant execute on function public.agent_portfolio() to authenticated;

-- 11f. updated_at + lightweight audit trail on the editable data tables (edit
--      UI now exists, so track mutations). audit_log is append-only, owner-read.
alter table public.operators add column if not exists updated_at timestamptz not null default now();
alter table public.logs      add column if not exists updated_at timestamptz not null default now();
alter table public.events    add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events'] loop
    execute format('drop trigger if exists touch_updated_at on public.%s', tbl);
    execute format('create trigger touch_updated_at before update on public.%s for each row execute function public.touch_updated_at()', tbl);
  end loop;
end $$;

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  table_name text not null,
  row_id     uuid not null,
  action     text not null,               -- INSERT | UPDATE | DELETE
  actor      uuid,                          -- auth.uid() at mutation time
  at         timestamptz not null default now()
);
create index if not exists audit_log_row_idx on public.audit_log (table_name, row_id);
alter table public.audit_log enable row level security;
drop policy if exists audit_log_admin_read on public.audit_log;
create policy audit_log_admin_read on public.audit_log for select using (public.is_admin());

create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (table_name, row_id, action, actor)
  values (tg_table_name, coalesce(new.id, old.id), tg_op, auth.uid());
  return coalesce(new, old);
end;
$$;
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events'] loop
    execute format('drop trigger if exists write_audit on public.%s', tbl);
    execute format('create trigger write_audit after insert or update or delete on public.%s for each row execute function public.write_audit()', tbl);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. MULTI-ORGANIZATION TEAM MODEL
--     Moves data ownership from the individual agent (created_by = auth.uid())
--     to the ORGANIZATION: teammates in the same org share operators, groups and
--     all field data; a coordinator supervises; a viewer reads without PII edit
--     rights; a platform admin still sees everything. created_by is retained for
--     attribution ("registered by"). The whole section runs idempotently and is
--     safe to re-run; wrap in a single txn when applying to avoid a policy gap.

-- 12a. Organizations + default org for the existing pilot agents.
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
insert into public.organizations (id, name)
  select '00000000-0000-4000-a000-0000000000a1', 'AQAFRIKA Pilot'
  where not exists (select 1 from public.organizations);

alter table public.agents add column if not exists org_id uuid references public.organizations (id);
-- Backfill any org-less agents into the oldest org (the pilot org).
update public.agents set org_id = (select id from public.organizations order by created_at limit 1)
  where org_id is null;

-- Widen roles: agent | coordinator | admin | viewer (admin stays platform-level).
alter table public.agents drop constraint if exists agents_role_check;
alter table public.agents add constraint agents_role_check
  check (role in ('agent', 'coordinator', 'admin', 'viewer'));

-- 12b. Org-aware helpers (security definer → no RLS recursion, mirrors is_admin()).
create or replace function public.current_org()
returns uuid language sql security definer set search_path = public stable as $$
  select org_id from public.agents where id = auth.uid();
$$;
create or replace function public.is_coordinator()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.agents where id = auth.uid() and role in ('coordinator', 'admin'));
$$;
create or replace function public.can_write()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.agents where id = auth.uid() and role in ('agent', 'coordinator', 'admin'));
$$;

-- 12c. org_id on every data table, backfilled from the creator's org.
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events','groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('alter table public.%s add column if not exists org_id uuid references public.organizations (id)', tbl);
    execute format('create index if not exists %s_org_idx on public.%s (org_id)', tbl, tbl);
    execute format($f$update public.%1$s t set org_id = a.org_id from public.agents a where a.id = t.created_by and t.org_id is null$f$, tbl);
  end loop;
end $$;

-- 12d. Stamp org_id on insert from the creator's org (keyed on created_by, NOT
--      auth.uid(), so offline-queue payloads and service-role seeds insert
--      cleanly). BEFORE INSERT runs before the RLS WITH CHECK, so policies may
--      require org_id = current_org().
create or replace function public.stamp_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null then
    select org_id into new.org_id from public.agents where id = new.created_by;
  end if;
  return new;
end;
$$;
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events','groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('drop trigger if exists stamp_org_id on public.%s', tbl);
    execute format('create trigger stamp_org_id before insert on public.%s for each row execute function public.stamp_org_id()', tbl);
  end loop;
end $$;

-- 12e. Replace owner-silo RLS with org-scoped RLS.
--      read: any org member (or admin). write: writers in the org, and inserts
--      must be attributed to the caller. groups DELETE is coordinator-only.
do $$
declare tbl text;
begin
  foreach tbl in array array['operators','logs','events','groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('drop policy if exists %1$s_owner_all on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_admin_read on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_org_read on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_org_insert on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_org_update on public.%1$s', tbl);
    execute format('drop policy if exists %1$s_org_delete on public.%1$s', tbl);
    execute format('create policy %1$s_org_read on public.%1$s for select using (org_id = public.current_org() or public.is_admin())', tbl);
    execute format('create policy %1$s_org_insert on public.%1$s for insert with check (created_by = auth.uid() and public.can_write() and (org_id is null or org_id = public.current_org()))', tbl);
    execute format('create policy %1$s_org_update on public.%1$s for update using (org_id = public.current_org() and public.can_write())', tbl);
  end loop;
  -- deletes: coordinator-only for groups, writer for the rest.
  execute 'create policy groups_org_delete on public.groups for delete using (org_id = public.current_org() and public.is_coordinator())';
  foreach tbl in array array['operators','logs','events','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('create policy %1$s_org_delete on public.%1$s for delete using (org_id = public.current_org() and public.can_write())', tbl);
  end loop;
end $$;

-- 12f. Relax the role-protection trigger for coordinators (own org, never admin).
create or replace function public.protect_agent_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    -- coordinators may change roles within their own org, but never grant admin
    if public.is_coordinator()
       and old.org_id = public.current_org()
       and new.role in ('agent', 'coordinator', 'viewer') then
      return new;
    end if;
    raise exception 'role changes require a coordinator (and admin cannot be self-granted)';
  end if;
  return new;
end;
$$;

-- 12g. Invitations (coordinator-managed; consumed on signup).
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  email      text not null,
  role       text not null default 'agent' check (role in ('agent', 'coordinator', 'viewer')),
  invited_by uuid references public.agents (id) on delete set null,
  token      uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invites_email_idx on public.invites (lower(email));
alter table public.invites enable row level security;
drop policy if exists invites_coord_all on public.invites;
create policy invites_coord_all on public.invites
  for all using (org_id = public.current_org() and public.is_coordinator())
  with check (org_id = public.current_org() and public.is_coordinator());

-- 12h. On signup, create the agent row AND consume a matching invite (org+role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare inv public.invites;
begin
  select * into inv from public.invites
    where lower(email) = lower(new.email) and accepted_at is null and expires_at > now()
    order by created_at desc limit 1;

  insert into public.agents (id, full_name, organization, org_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'organization', ''),
    inv.org_id,
    coalesce(inv.role, 'agent')
  )
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.invites set accepted_at = now() where id = inv.id;
  end if;
  return new;
end;
$$;

-- 12i. Reassign one agent's data to another (offboarding). Coordinator/admin
--      only; both agents must share the caller's org (or caller is admin).
create or replace function public.reassign_agent_data(from_agent uuid, to_agent uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare tbl text;
declare from_org uuid; declare to_org uuid;
begin
  select org_id into from_org from public.agents where id = from_agent;
  select org_id into to_org   from public.agents where id = to_agent;
  if not public.is_admin() then
    if not public.is_coordinator() or from_org is distinct from public.current_org() or to_org is distinct from public.current_org() then
      raise exception 'not authorized to reassign across organizations';
    end if;
  end if;
  foreach tbl in array array['operators','logs','events','groups','group_members','meetings','plans','plan_indicators','incidents','zones','assessments'] loop
    execute format('update public.%s set created_by = $1 where created_by = $2', tbl) using to_agent, from_agent;
  end loop;
end;
$$;
revoke all on function public.reassign_agent_data(uuid, uuid) from public;
grant execute on function public.reassign_agent_data(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. PRODUCTION CYCLES / PONDS
--     Until now cycles were DERIVED client-side from stocking-log dates. This
--     makes them explicit (an operator can run several ponds/batches at once,
--     which stocking-date derivation cannot represent) while staying backward
--     compatible: logs.cycle_id is nullable and the app still falls back to
--     derived cycles when it's null. Same org-scoped ownership as everything else.

create table if not exists public.cycles (
  id           uuid primary key default gen_random_uuid(),
  operator_id  uuid not null references public.operators (id) on delete cascade,
  created_by   uuid not null references public.agents (id) on delete restrict,
  org_id       uuid references public.organizations (id),
  pond_label   text,                       -- e.g. "Étang 1", "Cage A"
  species      text,
  stocked_on   date,
  closed_on    date,                        -- null = open cycle
  fingerlings  integer,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists cycles_operator_idx on public.cycles (operator_id);
create index if not exists cycles_org_idx on public.cycles (org_id);

alter table public.logs   add column if not exists cycle_id uuid references public.cycles (id) on delete set null;
alter table public.events add column if not exists cycle_id uuid references public.cycles (id) on delete set null;
create index if not exists logs_cycle_idx   on public.logs (cycle_id);
create index if not exists events_cycle_idx on public.events (cycle_id);

-- 13a. Backfill: one cycle per existing stocking log, then attach each log/event
--      to the cycle whose [stocked_on, next stocking) window contains its date.
do $$
declare r record;
begin
  -- Only backfill once (skip if any cycle already exists).
  if not exists (select 1 from public.cycles) then
    insert into public.cycles (operator_id, created_by, org_id, species, stocked_on, fingerlings)
      select operator_id, created_by, org_id, species, log_date, fingerlings_count
      from public.logs where type = 'stocking' and log_date is not null;

    -- Attach logs to the latest cycle whose stocked_on <= the log's date.
    for r in select id, operator_id, log_date from public.logs loop
      update public.logs l set cycle_id = (
        select c.id from public.cycles c
        where c.operator_id = r.operator_id and c.stocked_on <= r.log_date
        order by c.stocked_on desc limit 1
      ) where l.id = r.id;
    end loop;
    for r in select id, operator_id, event_date from public.events loop
      update public.events e set cycle_id = (
        select c.id from public.cycles c
        where c.operator_id = r.operator_id and c.stocked_on <= r.event_date
        order by c.stocked_on desc limit 1
      ) where e.id = r.id;
    end loop;
  end if;
end $$;

-- 13b. Org stamping + RLS (same pattern as section 12).
drop trigger if exists stamp_org_id on public.cycles;
create trigger stamp_org_id before insert on public.cycles for each row execute function public.stamp_org_id();

alter table public.cycles enable row level security;
drop policy if exists cycles_org_read on public.cycles;
drop policy if exists cycles_org_insert on public.cycles;
drop policy if exists cycles_org_update on public.cycles;
drop policy if exists cycles_org_delete on public.cycles;
create policy cycles_org_read on public.cycles for select using (org_id = public.current_org() or public.is_admin());
create policy cycles_org_insert on public.cycles for insert with check (created_by = auth.uid() and public.can_write() and (org_id is null or org_id = public.current_org()));
create policy cycles_org_update on public.cycles for update using (org_id = public.current_org() and public.can_write());
create policy cycles_org_delete on public.cycles for delete using (org_id = public.current_org() and public.can_write());

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. PHOTOS & DOCUMENTS (Supabase Storage)
--     Private buckets; access scoped to the uploader's organization via the
--     first path segment (org_id). Files are stored as {org_id}/{...}. The app
--     reads them through short-lived signed URLs. Columns hold the object path.

insert into storage.buckets (id, name, public)
  values ('operator-photos', 'operator-photos', false), ('group-docs', 'group-docs', false)
  on conflict (id) do nothing;

-- Org-scoped access on both private buckets: a user may read/write objects whose
-- top folder equals their org_id. can_write() gates uploads/deletes (viewers RO).
do $$
declare b text;
begin
  foreach b in array array['operator-photos','group-docs'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_org_read');
    execute format('drop policy if exists %I on storage.objects', b || '_org_write');
    execute format('drop policy if exists %I on storage.objects', b || '_org_delete');
    execute format($p$create policy %I on storage.objects for select using (bucket_id = %L and (storage.foldername(name))[1] = public.current_org()::text)$p$,
      b || '_org_read', b);
    execute format($p$create policy %I on storage.objects for insert with check (bucket_id = %L and (storage.foldername(name))[1] = public.current_org()::text and public.can_write())$p$,
      b || '_org_write', b);
    execute format($p$create policy %I on storage.objects for delete using (bucket_id = %L and (storage.foldername(name))[1] = public.current_org()::text and public.can_write())$p$,
      b || '_org_delete', b);
  end loop;
end $$;

-- Path columns (nullable; store the object path within the bucket).
alter table public.operators add column if not exists photo_path      text;
alter table public.meetings  add column if not exists attachment_path text;
alter table public.groups    add column if not exists agreement_path  text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. NETWORK BENCHMARKING (anonymized, threshold-guarded)
--     Per-species network-wide median FCR across ALL organizations, exposed only
--     when at least MIN_N operators contribute (below that, a median is noise —
--     the audit critic's caution). Security definer; authenticated only; returns
--     aggregates only (no row-level data, no org identity).
create or replace function public.species_fcr_benchmark()
returns jsonb
language sql
security definer set search_path = public
stable
as $$
  with per_op as (
    -- One FCR per operator's latest cycle (species from the latest stocking).
    select o.id as operator_id,
           ls.species,
           sum(l.feed_kg) filter (where l.type = 'feed') as feed,
           coalesce(sum(l.kg_harvested) filter (where l.type = 'harvest'), 0)
             - coalesce(sum((l.fingerlings_count * l.avg_weight_g) / 1000.0) filter (where l.type = 'stocking'), 0) as gain
    from operators o
    join lateral (
      select species, log_date from logs
      where operator_id = o.id and type = 'stocking' order by log_date desc limit 1
    ) ls on true
    join logs l on l.operator_id = o.id and l.log_date >= ls.log_date
    group by o.id, ls.species
  ),
  fcrs as (
    select species, feed / nullif(gain, 0) as fcr from per_op
    where feed > 0 and gain > 0
  ),
  by_species as (
    select species,
           count(*) as n,
           percentile_cont(0.5) within group (order by fcr) as median_fcr
    from fcrs group by species
  )
  select case when auth.uid() is null then null else coalesce(
    jsonb_object_agg(species, jsonb_build_object('n', n, 'median_fcr', round(median_fcr::numeric, 2)))
      filter (where n >= 5), '{}'::jsonb) end
  from by_species;
$$;
revoke all on function public.species_fcr_benchmark() from public, anon;
grant execute on function public.species_fcr_benchmark() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. i18n STABLE IDS — gender stored as a stable id ('male'|'female'|'other')
--     instead of a localized display label ('Homme'/'Femme'/'Male'/'Female'),
--     which had forced dual-language checks in SQL and the app. Idempotent:
--     the CASE maps any legacy label (and already-migrated ids) to the id.
update public.operators set gender = case lower(coalesce(gender, ''))
  when 'homme' then 'male'   when 'male'   then 'male'
  when 'femme' then 'female' when 'female' then 'female'
  when 'autre' then 'other'  when 'other'  then 'other'
  else nullif(gender, '') end
where gender is not null;

-- community_overview() now checks the stable id.
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
    'women_share',       (select round(100.0 * count(*) filter (where gender = 'female')
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
                                   count(*) filter (where o.gender = 'female') as women,
                                   (select count(*) from groups gr where gr.country = o.country) as g
                            from operators o where o.country is not null and o.country <> ''
                            group by o.country order by count(*) desc
                          ) c)
  ) end;
$$;
