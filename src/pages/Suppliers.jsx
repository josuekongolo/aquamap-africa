import { useState } from 'react';
import { mockSuppliers } from '../data/mockData';
import { useLang } from '../context/LangContext';

export default function Suppliers() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: t.suppliers.categories.all, icon: '🌊' },
    { id: 'ras', label: t.suppliers.categories.ras, icon: '♻️' },
    { id: 'feed', label: t.suppliers.categories.feed, icon: '🌾' },
    { id: 'fingerling', label: t.suppliers.categories.fingerling, icon: '🐟' },
    { id: 'aeration', label: t.suppliers.categories.aeration, icon: '💨' },
    { id: 'water', label: t.suppliers.categories.water, icon: '🔬' },
  ];

  const filtered = activeCategory === 'all'
    ? mockSuppliers
    : mockSuppliers.filter(s => s.category === activeCategory);

  const countryFlag = (country) => {
    const flags = {
      'Sénégal': '🇸🇳', 'Côte d\'Ivoire': '🇨🇮', 'Cameroun': '🇨🇲',
      'France': '🇫🇷', 'Ghana': '🇬🇭', 'Nigéria': '🇳🇬',
    };
    return flags[country] || '🌍';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0D6B8A' }}>🏪 {t.suppliers.title}</h1>
        <p className="text-gray-500">{t.suppliers.subtitle}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map(c => (
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
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Supplier cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{s.logo}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base" style={{ color: '#0D6B8A' }}>{s.name}</h3>
                    {s.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Vérifié</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {countryFlag(s.country)} {s.city}, {s.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="flex-1 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Produits & Services</p>
              <div className="flex flex-wrap gap-1.5">
                {s.products.map((p, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-gray-500">📧 {s.email}</p>
              <p className="text-xs text-gray-500">📞 {s.phone}</p>
              <button
                className="mt-2 w-full text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                style={{ backgroundColor: '#F4A261' }}
              >
                {t.suppliers.contact} →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-10 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}
      >
        <div className="text-5xl mb-4">🤝</div>
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
