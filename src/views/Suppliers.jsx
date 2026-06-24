'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { BadgeCheck, Phone, Mail, Handshake, Search, MapPin } from 'lucide-react';
import { suppliers, supplierCategories } from '../data/suppliers';
import { SupplierIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';

const countryFlags = {
  'Sénégal': '🇸🇳', "Côte d'Ivoire": '🇨🇮', 'Cameroun': '🇨🇲', 'Ghana': '🇬🇭',
  'Nigéria': '🇳🇬', 'France': '🇫🇷', 'Danemark': '🇩🇰', 'Norvège': '🇳🇴',
  'Pays-Bas': '🇳🇱', 'États-Unis': '🇺🇸', 'États-Unis / Italie': '🇺🇸', 'Chine': '🇨🇳',
  'Canada': '🇨🇦',
};

const confidenceBadge = {
  high: { fr: 'Vérifié', en: 'Verified', cls: 'bg-green-100 text-green-700' },
  medium: { fr: 'Existence confirmée', en: 'Confirmed', cls: 'bg-amber-100 text-amber-700' },
};

export default function Suppliers() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const catCount = (id) => (id === 'all' ? suppliers.length : suppliers.filter(s => s.category === id).length);
  const filtered = activeCategory === 'all' ? suppliers : suppliers.filter(s => s.category === activeCategory);
  const groups = supplierCategories.filter(c => c.id !== 'all');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header + search trigger */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">{t.suppliers.title}</h1>
        <p className="text-gray-500 mb-5">{t.suppliers.subtitle}</p>
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full max-w-xl flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-teal-300 hover:shadow-sm transition text-left"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-sm">{lang === 'fr' ? 'Rechercher un fournisseur, un produit, un pays…' : 'Search a supplier, product, country…'}</span>
          <kbd className="font-mono2 text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
        </button>
      </div>

      {/* Docs-style layout: category sidebar + supplier list */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
        {/* Sidebar nav */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-3 md:pb-0 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
          {supplierCategories.map(c => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
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
          <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm">
            {filtered.map(s => {
              const badge = confidenceBadge[s.confidence];
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 hover:bg-gray-50 transition">
                  <SupplierIcon id={s.category} className="w-6 h-6 mt-0.5 text-[#0D6B8A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[15px] text-black">{s.name}</h3>
                      {badge && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                          <BadgeCheck className="inline w-3 h-3 -mt-0.5" /> {badge[lang]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {countryFlags[s.country] || '🌍'} {s.city}, {s.country}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.products.map((p, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{p}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {lang === 'fr' ? 'Dessert' : 'Serves'} : {s.servesRegion.join(' · ')}
                    </p>
                  </div>
                  <div className="sm:w-44 shrink-0 sm:text-right space-y-1">
                    {s.phone && <p className="text-xs text-gray-500 flex sm:justify-end items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    {s.email && <p className="text-xs text-gray-500 flex sm:justify-end items-center gap-1.5"><Mail className="w-3 h-3" /> {s.email}</p>}
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-1 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
                        style={{ backgroundColor: '#F4A261' }}>
                        {lang === 'fr' ? 'Visiter le site' : 'Visit website'} →
                      </a>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">{lang === 'fr' ? 'Site non publié' : 'No website'}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl p-10 text-center text-white" style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}>
        <div className="mb-4 flex justify-center"><Handshake className="w-12 h-12" /></div>
        <h2 className="text-2xl font-bold mb-3">{t.suppliers.cta}</h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">{t.suppliers.ctaDesc}</p>
        <button className="text-teal-800 font-bold px-8 py-3 rounded-xl bg-white hover:bg-gray-50 transition text-lg">
          {t.suppliers.ctaBtn} →
        </button>
      </div>

      {/* ⌘K command palette (cmdk) */}
      {paletteOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/40 flex items-start justify-center pt-24 px-4" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <Command label={lang === 'fr' ? 'Recherche fournisseurs' : 'Supplier search'} className="outline-none">
              <div className="flex items-center gap-2 px-4 border-b">
                <Search className="w-4 h-4 text-gray-400" />
                <Command.Input
                  autoFocus
                  placeholder={lang === 'fr' ? 'Rechercher un fournisseur…' : 'Search a supplier…'}
                  className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400"
                />
                <kbd className="font-mono2 text-[11px] text-gray-400">esc</kbd>
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-gray-400">
                  {lang === 'fr' ? 'Aucun résultat.' : 'No results.'}
                </Command.Empty>
                {groups.map(cat => {
                  const items = suppliers.filter(s => s.category === cat.id);
                  if (!items.length) return null;
                  return (
                    <Command.Group key={cat.id} heading={cat.label[lang]}>
                      {items.map(s => (
                        <Command.Item
                          key={s.id}
                          value={`${s.name} ${s.country} ${s.city} ${s.products.join(' ')} ${cat.label[lang]}`}
                          onSelect={() => { if (s.website) window.open(s.website, '_blank', 'noopener'); setPaletteOpen(false); }}
                          className="flex items-center gap-3 px-2 py-2"
                        >
                          <SupplierIcon id={s.category} className="w-4 h-4 text-[#0D6B8A] shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-800 truncate">{s.name}</div>
                            <div className="text-xs text-gray-400 truncate">{countryFlags[s.country] || '🌍'} {s.city}, {s.country}</div>
                          </div>
                          {s.website && <span className="text-[10px] text-teal-600 ml-auto shrink-0">↗</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
}
