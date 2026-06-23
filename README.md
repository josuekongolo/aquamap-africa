# 🐠 AquaMap Africa

**La plateforme gratuite pour les aquaculteurs africains**

A modern React MVP for aquaculture registration and tracking across West Africa (Senegal, Côte d'Ivoire, Cameroon).

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://josuekongolo.github.io/aquamap-africa)

---

## 🌊 Features

- **Landing Page** — Hero, features, stats, CTA
- **Registration Form** — 3-step multi-step form with GPS capture
- **Operator Dashboard** — KPIs, FCR gauge, production charts, FCR calculator
- **Interactive Map** — 28 mock operators with filters (Leaflet.js)
- **FAO Knowledge Base** — 11 technical resources in 6 categories
- **Equipment Suppliers** — 9 supplier directory with categories
- **Admin Dashboard** — Password protected (`aquaadmin2024`), charts, operator table, CSV export
- **French/English toggle** — Full bilingual support

## 🛠️ Tech Stack

- Vite + React 19
- Tailwind CSS v4
- React Router v7 (hash routing)
- Recharts (FCR gauge, bar charts, pie charts)
- Leaflet.js + react-leaflet (map)
- No backend — mock data only

## 🎨 Design

- Primary: `#0D6B8A` (ocean blue)
- Secondary: `#00A878` (aqua green)  
- Accent: `#F4A261` (warm orange CTAs)
- Clean card-based SaaS dashboard look

## 🚀 Deployment

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📋 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/#/register` | Operator registration (3-step) |
| `/#/dashboard` | Operator dashboard |
| `/#/map` | Interactive operator map |
| `/#/knowledge` | FAO knowledge base |
| `/#/suppliers` | Equipment suppliers |
| `/#/admin` | Admin dashboard (password: `aquaadmin2024`) |

## 🌍 Languages

- Default: French 🇫🇷
- Toggle to English 🇬🇧 via navbar button

---

*Développé avec ❤️ pour les aquaculteurs africains*
