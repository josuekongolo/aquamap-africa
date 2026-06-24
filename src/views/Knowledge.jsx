'use client';

import { useState } from 'react';
import { BookOpen, Star, FileText, FlaskConical } from 'lucide-react';
import { knowledge, knowledgeCategories } from '../data/knowledge';
import { KnowledgeIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import ResearchPanel from '../components/ResearchPanel';

export default function Knowledge() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? knowledge
    : knowledge.filter(k => k.category === activeCategory);

  // Featured: the on-farm feeding & FCR management paper (most directly useful).
  const featured = knowledge.find(k => k.id === 'k9') || knowledge[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: '#0D6B8A' }}><BookOpen className="w-7 h-7" /> {t.knowledge.title}</h1>
        <p className="text-gray-500">{t.knowledge.subtitle}</p>
      </div>

      {/* Featured article */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-2xl p-8 text-white mb-10 overflow-hidden hover:opacity-95 transition"
        style={{ background: 'linear-gradient(135deg, #0D6B8A 0%, #00A878 100%)' }}
      >
        <KnowledgeIcon id={featured.category} className="absolute right-6 top-4 w-16 h-16 opacity-30" />
        <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
          <Star className="inline w-3.5 h-3.5 -mt-0.5" /> {t.knowledge.featured}
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-3 max-w-2xl">{featured.title}</h2>
        <p className="text-white/80 mb-4 max-w-xl">{featured.desc[lang]}</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">
<FileText className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />{featured.org}
          </span>
          <span className="bg-white text-teal-700 font-semibold px-5 py-2 rounded-lg">
            {t.knowledge.read}
          </span>
        </div>
      </a>

      {/* Category filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {knowledgeCategories.map(c => (
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
<KnowledgeIcon id={c.id} className="w-4 h-4" /> {c.label[lang]}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(k => (
          <div key={k.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <KnowledgeIcon id={k.category} className="w-9 h-9 text-[#0D6B8A]" />
              <div className="flex gap-1">
                {k.lang.map(l => (
                  <span key={l} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base mb-2 leading-snug" style={{ color: '#0D6B8A' }}>{k.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{k.desc[lang]}</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {k.org}</p>
              <a
                href={k.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:opacity-80 transition"
                style={{ color: '#0D6B8A' }}
              >
                {t.knowledge.read}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Live related research (Semantic Scholar) */}
      <ResearchPanel category={activeCategory} />

      {/* Bottom CTA */}
      <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
        <div className="mb-3 flex justify-center"><FlaskConical className="w-10 h-10 text-[#0D6B8A]" /></div>
        <h3 className="font-bold text-lg mb-2" style={{ color: '#0D6B8A' }}>
          {lang === 'fr' ? 'Vous avez une question technique ?' : 'Have a technical question?'}
        </h3>
        <p className="text-gray-600 mb-5">
          {lang === 'fr'
            ? "Toutes nos ressources proviennent de la FAO, WorldFish, la CEDEAO et les autorités nationales."
            : 'All our resources come from FAO, WorldFish, ECOWAS and national authorities.'}
        </p>
        <a
          href="https://www.fao.org/fishery/en/aquaculture"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
          style={{ backgroundColor: '#F4A261' }}
        >
          {lang === 'fr' ? 'Explorer la FAO Aquaculture →' : 'Explore FAO Aquaculture →'}
        </a>
      </div>
    </div>
  );
}
