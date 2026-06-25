# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AquaMap Africa — a Next.js + Supabase platform where NGO/extension **agents** register smallholder fish farmers (**operators**) in francophone West/Central Africa (Senegal, Côte d'Ivoire, Cameroon), log production, and compute a **species-aware FCR** (feed conversion ratio). It doubles as a sector-intelligence dashboard pitched to FAO/AfDB. Bilingual FR/EN. Deployed on Vercel (prod alias `aqua-umber.vercel.app`).

## Commands

```bash
npm run dev      # next dev (Turbopack)
npm run build    # next build — the real gate; run before claiming done
npm run lint     # eslint . (eslint-config-next, flat config)
npm run start    # serve a production build
```

No test suite exists. Verify changes with `npm run build` + `npm run lint` (both must be clean), and for UI, by driving the running app.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 (CSS-config, no `tailwind.config.js`) · Supabase (Postgres + Auth + RLS) · shadcn/ui · Leaflet · Recharts · cmdk · TanStack Table.

**Routing & page layout — read this first.** Routes live in `app/<route>/page.jsx`, but those files are thin: they re-export or wrap the real page component, which lives in **`src/views/`**. (Do NOT put pages in `src/pages/` — that triggers Next's Pages Router and breaks the build with "`pages` and `app` directories should be under the same folder".) Example: `app/dashboard/page.jsx` wraps `src/views/Dashboard.jsx` in `<ProtectedRoute>`.

**Global chrome** (Navbar, Footer, BottomNav, OfflineBanner, providers) is assembled once in `app/providers.jsx` (a `'use client'` component rendered by `app/layout.jsx`). All public/content/console pages share the top navbar — there is intentionally **no per-page sidebar**.

**Path alias:** `@/*` → repo root (see `jsconfig.json`). shadcn lives at root: `@/components/ui/*`, `@/lib/utils`, `@/hooks/use-mobile`. App code lives under `@/src/*`. This split is deliberate — shadcn's `components.json` points there.

**Auth & data ownership.** `src/context/AuthContext.jsx` exposes `useAuth()` → `{ user, agent, isAdmin, signIn, signUp, signOut, configured }`. Only agents authenticate (email/password). `src/components/ProtectedRoute.jsx` gates `/dashboard`, `/register`, `/admin` (pass `adminOnly` for admin). RLS in `supabase/schema.sql`: an agent sees only rows where `created_by = auth.uid()`; an `admin` sees all. Tables: `agents` (1:1 auth.users) → `operators` → `logs` (stocking/feed/harvest) + `events`.

**i18n.** `src/context/LangContext.jsx` holds all UI strings for both languages. `useLang()` → `{ lang, t, toggle }`. Static UI text comes from `t.<section>.<key>`; data files carry bilingual fields rendered as `field[lang]`.

**Verified data (no fabrication).** `src/data/` (`species.js`, `institutions.js`, `suppliers.js`, `knowledge.js`) holds real, sourced, dated data — every figure/URL is genuine. Never invent operators, suppliers, citations, or stats (e.g. no "500+ operators"). `species.js` `rateFCR()` and the FCR baselines are species-specific (prawn optimal is ~2–3, not <2).

**Live external APIs (free, no key).** World Bank (`src/lib/worldbank.js`, fetched server-side in `app/map/page.jsx`), Open-Meteo (`WeatherAdvisory.jsx`), CrossRef (`app/api/research/route.js` + `ResearchPanel`).

**Offline-first capture (agents work in the field).** `src/lib/offlineQueue.js` is an IndexedDB-backed write queue (`{ id, table, payload, queuedAt }`) — writes are enqueued when offline and replayed to Supabase on reconnect; all functions are safe no-ops where IndexedDB is unavailable. `OfflineBanner.jsx` surfaces connectivity state, and `ServiceWorkerRegister.jsx` registers `public/sw.js` **in production only** (avoids dev caching headaches). The app is an installable PWA (`public/manifest.webmanifest`). FCR copy: `src/lib/fcr.js` (`fcrInsight()`) turns a raw ratio into bilingual, species-aware advice on top of `species.js`'s `rateFCR()`.

## Conventions & gotchas

- **Brand colors are decoupled from shadcn tokens.** Use CSS vars `--brand` (#0D6B8A teal), `--brand-2` (#00A878 green), `--brand-accent` (#F4A261 orange), `--ink` (#06303d). shadcn's `--primary/--secondary/--accent` are its own semantic tokens (do not repurpose them for brand). Defined in `app/globals.css`.
- **Fonts** via `next/font` in `app/layout.jsx`: Fraunces display (`.font-display`), Hanken Grotesk body (default), JetBrains Mono (`.font-mono2`).
- **Icons:** lucide-react. Data-driven icons (species/category) are mapped in `src/lib/icons.jsx` (`SpeciesIcon`, `KnowledgeIcon`, `SupplierIcon`) — no emoji in UI (country flags excepted).
- **Leaflet is browser-only.** Map components (`MapView`/`OperatorMap`/`ExploreMap`) are loaded via `next/dynamic({ ssr: false })`. Leaflet plugins that expect a global `L` (markercluster, fullscreen, locatecontrol) must be `import()`-ed dynamically **after** setting `window.L = L`; some export control classes rather than registering `L.control.*` — instantiate those directly.
- **ESLint must be v9.** `eslint-config-next@16` breaks on ESLint 10. Fetch-on-mount effects legitimately trip `react-hooks/set-state-in-effect`; disable per-line/file with a justifying comment. TanStack `useReactTable` trips `react-hooks/incompatible-library` — disable that rule in those files.
- **Public map privacy:** `/map` shows the country-institutional layer to everyone; the operators layer only loads for authenticated agents (RLS-scoped). Never expose individual operator PII publicly.

## Backend setup

`SETUP.md` is the source of truth. Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local`, also set on Vercel via the Supabase Marketplace integration). Run `supabase/schema.sql` once in the Supabase SQL editor; promote the first agent to `admin` via the SQL snippet at the bottom of that file.
