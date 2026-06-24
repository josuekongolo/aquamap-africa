# AquaMap Africa — backend & deploy setup

This app is a **Next.js (App Router)** app backed by **Supabase** (Postgres +
Auth) and deployed on **Vercel**. Public pages (landing, knowledge, suppliers,
map) are server-rendered for SEO; login, registration and dashboards are client
components that need Supabase configured.

## 1. Create the Supabase project (~3 min)

1. Go to <https://supabase.com> → **New project**. Pick a region close to West
   Africa (e.g. `eu-west` / London or `eu-central`).
2. Once it's ready, open **SQL Editor → New query**, paste the entire contents
   of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates
   the `agents`, `operators`, `logs`, `events` tables, the signup trigger, and
   Row-Level Security policies.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Local environment (~1 min)

```bash
cp .env.example .env.local
# edit .env.local and paste the two values from step 1.3
npm install
npm run dev
```

## 3. Create your first agent + make yourself admin

1. Run the app, go to `/login`, **Sign up** with your email + password.
   (Email confirmation can be disabled in Supabase → Authentication → Providers
   → Email, for faster pilot onboarding.)
2. Promote yourself to admin so you can see the national dashboard — in the
   Supabase SQL editor:
   ```sql
   update public.agents set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

## 4. Deploy to Vercel

1. Push this repo to GitHub (already at `josuekongolo/aquamap-africa`).
2. In Vercel → **Add New → Project** → import the repo. Framework preset:
   **Next.js** (auto-detected).
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under **Settings → Environment Variables**
   (Production + Preview).
4. Deploy. No extra routing config is needed — Next.js handles it.

## Data model in one glance

```
auth.users ──1:1── agents (role: agent | admin)
                     │ created_by
                     ▼
                  operators ──1:N── logs   (stocking / feed / harvest → FCR)
                            └──1:N── events (disease / mortality / incidents)
```

An **agent** sees only the operators (and their logs/events) they created.
An **admin** sees everything — that's the aggregated national view for the
FAO / AfDB pitch.
