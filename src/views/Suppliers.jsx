'use client';

import { useState } from 'react';
import { Store, BadgeCheck, Phone, Mail, Handshake } from 'lucide-react';
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

  const filtered = activeCategory === 'all'
    ? suppliers
    : suppliers.filter(s => s.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: '#0D6B8A' }}><Store className="w-7 h-7" /> {t.suppliers.title}</h1>
        <p className="text-gray-500">{t.suppliers.subtitle}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {supplierCategories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeCategory === c.id
                ? 'text-white shadow'
                : 'bg-white text-gray-600 hover:shadow-sm border border-gray-200'
            }`}
            style={activeCategory === c.id ? { backgroundColor: '#0D6B8A' } : {}}
          >
<SupplierIcon id={c.id} className="w-4 h-4" /> {c.label[lang]}
          </button>
        ))}
      </div>

      {/* Supplier cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filtered.map(s => {
          const badge = confidenceBadge[s.confidence];
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <SupplierIcon id={s.category} className="w-9 h-9 text-[#0D6B8A] shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base" style={{ color: '#0D6B8A' }}>{s.name}</h3>
                      {badge && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
<BadgeCheck className="inline w-3.5 h-3.5 -mt-0.5" /> {badge[lang]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {countryFlags[s.country] || '🌍'} {s.city}, {s.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="flex-1 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {lang === 'fr' ? 'Produits & Services' : 'Products & Services'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {s.products.map((p, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Serves region */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  {lang === 'fr' ? 'Dessert' : 'Serves'}
                </p>
                <p className="text-xs text-gray-600">{s.servesRegion.join(' · ')}</p>
              </div>

              {/* Contact */}
              <div className="border-t pt-4 space-y-1.5">
                {s.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone}</p>}
                {s.email && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {s.email}</p>}
                {!s.phone && !s.email && (
                  <p className="text-xs text-gray-400 italic">
                    {lang === 'fr' ? 'Contact via le site web' : 'Contact via website'}
                  </p>
                )}
                {s.website ? (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block w-full text-center text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: '#F4A261' }}
                  >
                    {lang === 'fr' ? 'Visiter le site' : 'Visit website'} →
                  </a>
                ) : (
                  <p className="mt-2 text-center text-xs text-gray-400 py-2">
                    {lang === 'fr' ? 'Site web non publié' : 'No website published'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-10 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}
      >
        <div className="mb-4 flex justify-center"><Handshake className="w-12 h-12" /></div>
        <h2 className="text-2xl font-bold mb-3">{t.suppliers.cta}</h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">{t.suppliers.ctaDesc}</p>
        <button
          className="text-teal-800 font-bold px-8 py-3 rounded-xl bg-white hover:bg-gray-50 transition text-lg"
        >
          {t.suppliers.ctaBtn} →
        </button>
      </div>
    </div>
  );
}
