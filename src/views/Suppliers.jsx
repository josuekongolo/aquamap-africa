'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { BadgeCheck, Phone, Search, MapPin, ExternalLink, Loader2, AlertTriangle, Globe } from 'lucide-react';
import { suppliers as curatedSuppliers, supplierCategories } from '../data/suppliers';
import { SupplierIcon } from '../lib/icons';
import { countryFromAddress } from '../lib/africa';
import { useLang } from '../context/LangContext';

const PAGE_SIZE = 50;

const countryFlags = {
  'Sénégal': '🇸🇳', "Côte d'Ivoire": '🇨🇮', 'Cameroun': '🇨🇲', 'Ghana': '🇬🇭',
  'Nigéria': '🇳🇬', 'France': '🇫🇷', 'Danemark': '🇩🇰', 'Norvège': '🇳🇴',
  'Pays-Bas': '🇳🇱', 'États-Unis': '🇺🇸', 'États-Unis / Italie': '🇺🇸', 'Chine': '🇨🇳',
  'Canada': '🇨🇦',
};

// Curated entries → same card model as DB (Places) rows.
function curatedToCard(s) {
  return {
    id: s.id, name: s.name, category: s.category,
    location: `${countryFlags[s.country] || '🌍'} ${s.city}, ${s.country}`,
    country: countryFromAddress(s.country), chips: s.products,
    phone: s.phone, website: s.website, mapsUri: null,
    confidence: s.confidence, // 'high' | 'medium'
  };
}
function dbToCard(s) {
  return {
    id: s.id, name: s.name, category: s.category,
    location: s.address || '', country: countryFromAddress(s.address),
    chips: s.type ? [s.type] : [],
    phone: s.phone, website: s.website, mapsUri: s.mapsUri,
    confidence: null,
  };
}

// verified/confirmed badges for curated; neutral "Google" tag for precomputed rows.
const badgeFor = (confidence) => ({
  high: { fr: 'Vérifié', en: 'Verified', cls: 'bg-green-100 text-green-700', icon: true },
  medium: { fr: 'Existence confirmée', en: 'Confirmed', cls: 'bg-amber-100 text-amber-700', icon: true },
  unverified: { fr: 'Google', en: 'Google', cls: 'bg-gray-100 text-gray-500', icon: false },
}[confidence]);

export default function Suppliers() {
  const { t, lang } = useLang();
  const fr = lang === 'fr';
  const [activeCategory, setActiveCategory] = useState('all');
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters + pagination
  const [country, setCountry] = useState('all');
  const [onlyWebsite, setOnlyWebsite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load the precomputed directory once; fall back to the curated list if the
  // table is empty / unconfigured / errors.
  useEffect(() => {
    let active = true;
    const curated = () => curatedSuppliers.map(curatedToCard);
    (async () => {
      try {
        const res = await fetch('/api/suppliers/list');
        const json = await res.json();
        if (!active) return;
        if (json.configured === false || json.error || !(json.suppliers || []).length) {
          if (json.error) setError(json.error);
          setCards(curated());
        } else {
          setCards(json.suppliers.map(dbToCard));
        }
      } catch (e) {
        if (!active) return;
        setError(String(e?.message || e));
        setCards(curated());
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // ⌘K palette toggle.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
      else if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const catCount = (id) => (id === 'all' ? cards.length : cards.filter((s) => s.category === id).length);

  // Country options present in the data (sorted), for the country dropdown.
  const countryOptions = [...new Set(cards.map((s) => s.country).filter(Boolean))].sort();

  const filtered = cards.filter((s) =>
    (activeCategory === 'all' || s.category === activeCategory) &&
    (country === 'all' || s.country === country) &&
    (!onlyWebsite || !!s.website) &&
    (!onlyPhone || !!s.phone));

  // Any filter change resets pagination back to the first page.
  const reset = () => setVisibleCount(PAGE_SIZE);
  const pickCategory = (id) => { setActiveCategory(id); reset(); };
  const pickCountry = (v) => { setCountry(v); reset(); };
  const toggleWebsite = () => { setOnlyWebsite((v) => !v); reset(); };
  const togglePhone = () => { setOnlyPhone((v) => !v); reset(); };
  const clearFilters = () => { setCountry('all'); setOnlyWebsite(false); setOnlyPhone(false); reset(); };

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header + search trigger */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-black">{t.suppliers.title}</h1>
        <p className="text-gray-500 mb-5">{t.suppliers.subtitle}</p>
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full max-w-xl flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-teal-300 hover:shadow-sm transition text-left"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-sm">{fr ? 'Rechercher un fournisseur, un produit, un pays…' : 'Search a supplier, product, country…'}</span>
          <kbd className="font-mono2 text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
        </button>
      </div>

      {/* Docs-style layout: category sidebar + supplier list */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
        {/* Sidebar nav */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-3 md:pb-0 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
          {supplierCategories.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => pickCategory(c.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={active ? { backgroundColor: '#0D6B8A14', color: '#0D6B8A' } : {}}
              >
                <SupplierIcon id={c.id} className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{c.label[lang]}</span>
                <span className="text-xs text-gray-400">{catCount(c.id)}</span>
              </button>
            );
          })}
        </nav>

        {/* Supplier list */}
        <div className="min-w-0">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={country}
              onChange={(e) => pickCountry(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 max-w-[60vw]"
            >
              <option value="all">{fr ? 'Tous les pays' : 'All countries'}</option>
              {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={toggleWebsite}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${onlyWebsite ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={onlyWebsite ? { backgroundColor: 'var(--brand)' } : {}}
            >
              <Globe className="w-3.5 h-3.5" /> {fr ? 'Avec site web' : 'Has website'}
            </button>
            <button
              onClick={togglePhone}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${onlyPhone ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={onlyPhone ? { backgroundColor: 'var(--brand)' } : {}}
            >
              <Phone className="w-3.5 h-3.5" /> {fr ? 'Avec téléphone' : 'Has phone'}
            </button>
            {(country !== 'all' || onlyWebsite || onlyPhone) && (
              <button onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-gray-700 underline">
                {fr ? 'Réinitialiser' : 'Reset'}
              </button>
            )}
          </div>

          {/* Source / status strip */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 min-h-5">
            {loading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {fr ? 'Chargement…' : 'Loading…'}</span>
            ) : (
              <>
                <span>{fr ? `${visible.length} sur ${filtered.length}` : `${visible.length} of ${filtered.length}`} {fr ? 'fournisseurs' : 'suppliers'}</span>
              </>
            )}
            {error && <span className="flex items-center gap-1 text-amber-600 ml-2"><AlertTriangle className="w-3.5 h-3.5" /> {error}</span>}
          </div>

          <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm">
            {!loading && filtered.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-gray-400">{fr ? 'Aucun fournisseur trouvé.' : 'No suppliers found.'}</p>
            )}
            {visible.map((s) => {
              const badge = badgeFor(s.confidence);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 hover:bg-gray-50 transition">
                  <SupplierIcon id={s.category} className="w-6 h-6 mt-0.5 text-[#0D6B8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-black">{s.name}</h3>
                      {badge && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                          {badge.icon && <BadgeCheck className="inline w-3 h-3 -mt-0.5" />} {badge[lang]}
                        </span>
                      )}
                    </div>
                    {s.location && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {s.location}
                      </p>
                    )}
                    {s.chips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.chips.map((p, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sm:w-44 shrink-0 sm:text-right space-y-1">
                    {s.phone && <p className="text-xs text-gray-500 flex sm:justify-end items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-1 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand)' }}>
                        {fr ? 'Visiter le site' : 'Visit website'} →
                      </a>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">{fr ? 'Site non publié' : 'No website'}</p>
                    )}
                    {s.mapsUri && (
                      <a href={s.mapsUri} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600 flex sm:justify-end items-center gap-1">
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && remaining > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="text-sm font-semibold px-5 py-2.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                {fr ? `Afficher plus (${remaining})` : `Show more (${remaining})`}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* CTA — list your company (editorial ink band) */}
      <div className="mt-12 relative isolate rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="noise" />
        <div className="relative px-8 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.22em] text-[#7fd4be] mb-2">
              {fr ? 'Annuaire des fournisseurs' : 'Supplier directory'}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{t.suppliers.cta}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{t.suppliers.ctaDesc}</p>
          </div>
          <a
            href="mailto:i.josuekongolo@gmail.com?subject=AQAFRIKA%20%E2%80%94%20R%C3%A9f%C3%A9rencement%20fournisseur"
            className="shrink-0 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full text-white hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {t.suppliers.ctaBtn} <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      {/* ⌘K command palette (cmdk) — searches the loaded directory */}
      {paletteOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/40 flex items-start justify-center pt-24 px-4" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Command label={fr ? 'Recherche fournisseurs' : 'Supplier search'} className="outline-none">
              <div className="flex items-center gap-2 px-4 border-b">
                <Search className="w-4 h-4 text-gray-400" />
                <Command.Input
                  autoFocus
                  placeholder={fr ? 'Rechercher un fournisseur…' : 'Search a supplier…'}
                  className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400"
                />
                <kbd className="font-mono2 text-[11px] text-gray-400">esc</kbd>
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-gray-400">
                  {fr ? 'Aucun résultat.' : 'No results.'}
                </Command.Empty>
                {cards.map((s) => (
                  <Command.Item
                    key={s.id}
                    value={`${s.name} ${s.location} ${s.chips.join(' ')}`}
                    onSelect={() => {
                      const link = s.website || s.mapsUri;
                      if (link) window.open(link, '_blank', 'noopener');
                      setPaletteOpen(false);
                    }}
                    className="flex items-center gap-3 px-2 py-2"
                  >
                    <SupplierIcon id={s.category} className="w-4 h-4 text-[#0D6B8A] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 truncate">{s.name}</div>
                      <div className="text-xs text-gray-400 truncate">{s.location}</div>
                    </div>
                    {(s.website || s.mapsUri) && <span className="text-[10px] text-teal-600 ml-auto shrink-0">↗</span>}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
}
