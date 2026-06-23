import { useState } from 'react';
import { mockKnowledge } from '../data/mockData';
import { useLang } from '../context/LangContext';

export default function Knowledge() {
  const { t } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: t.knowledge.categories.all, icon: '🌊' },
    { id: 'species', label: t.knowledge.categories.species, icon: '🐟' },
    { id: 'disease', label: t.knowledge.categories.disease, icon: '🦠' },
    { id: 'feed', label: t.knowledge.categories.feed, icon: '🌾' },
    { id: 'water', label: t.knowledge.categories.water, icon: '💧' },
    { id: 'ras', label: t.knowledge.categories.ras, icon: '♻️' },
    { id: 'regulation', label: t.knowledge.categories.regulation, icon: '📋' },
  ];

  const filtered = activeCategory === 'all'
    ? mockKnowledge
    : mockKnowledge.filter(k => k.category === activeCategory);

  const featured = mockKnowledge[5]; // Alimentation

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0D6B8A' }}>📚 {t.knowledge.title}</h1>
        <p className="text-gray-500">{t.knowledge.subtitle}</p>
      </div>

      {/* Featured article */}
      <div
        className="relative rounded-2xl p-8 text-white mb-10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}
      >
        <div className="absolute right-6 top-4 text-6xl opacity-30">📖</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
          ⭐ {t.knowledge.featured}
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-3">{featured.title}</h2>
        <p className="text-white/80 mb-4 max-w-xl">{featured.desc}</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
            📄 {featured.source}
          </span>
          <button className="bg-white text-teal-700 font-semibold px-5 py-2 rounded-lg hover:bg-white/90 transition">
            {t.knowledge.read}
          </button>
        </div>
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

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(k => (
          <div key={k.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
            <div className="text-4xl mb-3">{k.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold text-base mb-2" style={{ color: '#0D6B8A' }}>{k.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{k.desc}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-3">📄 {k.source}</p>
              <button
                className="text-sm font-semibold hover:opacity-80 transition"
                style={{ color: '#0D6B8A' }}
              >
                {t.knowledge.read}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">🔬</div>
        <h3 className="font-bold text-lg mb-2" style={{ color: '#0D6B8A' }}>
          Vous avez une question technique ?
        </h3>
        <p className="text-gray-600 mb-5">
          Notre réseau d'experts FAO et de techniciens aquacoles est disponible pour vous.
        </p>
        <button
          className="text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
          style={{ backgroundColor: '#F4A261' }}
        >
          Poser une question →
        </button>
      </div>
    </div>
  );
}
