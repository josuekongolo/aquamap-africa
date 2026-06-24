# 🐠 AquaMap Africa

**La plateforme gratuite pour les aquaculteurs africains**

A production React app for aquaculture data collection and sector intelligence
across francophone West & Central Africa (Senegal, Côte d'Ivoire, Cameroon).
NGO / extension **agents** register fish farmers (*operators*) and log their
production; the data powers a species-aware FCR engine and an aggregated
national dashboard for the FAO / AfDB pitch.

---

## 🌊 Features

- **Landing page** — hero, features, how-it-works
- **Agent auth** — email + password (Supabase Auth); agents enter data on
  operators' behalf
- **3-step registration** — identity / farm / production, with real GPS capture,
  writing to Postgres
- **Operator dashboard** — per-operator logs (stocking / feed / harvest) with
  **species-specific** FCR computed from real entries (not a hardcoded number)
- **Species-aware FCR calculator** — sourced FAO/SRAC baselines per species
  (a generic "FCR < 2" is wrong for prawn; the tool knows the difference)
- **Knowledge base** — 18 real FAO / WorldFish / ECOWAS publications, working URLs
- **Suppliers** — 19 verified feed / fingerling / RAS / aeration / water-testing
  companies; no fabricated contacts
- **Public map** — country-level institutional overview (authorities, sourced
  production figures, targets) — no farmer PII exposed
- **Admin dashboard** — live aggregates, FCR distribution, species/challenge
  breakdowns, operator map, **CSV export**, institutional data sources
- **Bilingual** — French 🇫🇷 / English 🇬🇧

## 🛠️ Tech stack

- Next.js 16 (App Router) + React 19, Tailwind CSS v4
- Public pages server-rendered (SEO); dashboards are client components
- Supabase (Postgres + Auth + Row-Level Security)
- Recharts · Leaflet / react-leaflet (loaded client-only via `next/dynamic`)
- Hosted on Vercel

## 🗃️ Data

Verified reference data lives in `src/data/` (`species.js`, `institutions.js`,
`suppliers.js`, `knowledge.js`) — every figure and URL is sourced and dated.
Operator/log/event data is stored in Supabase; see `supabase/schema.sql`.

## 🚀 Getting started

See **[SETUP.md](SETUP.md)** for the full Supabase + Vercel walkthrough.

```bash
npm install
cp .env.example .env.local   # add your Supabase URL + anon key
npm run dev
```

## 📋 Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | public | Landing page |
| `/login` | public | Agent sign in / sign up |
| `/map` | public | Country institutional overview map |
| `/knowledge` | public | FAO knowledge base |
| `/suppliers` | public | Verified supplier directory |
| `/register` | agent | Register an operator (3-step) |
| `/dashboard` | agent | Operator portal + FCR |
| `/admin` | admin | Aggregated national dashboard + CSV |

---

*Développé avec ❤️ pour les aquaculteurs africains*
