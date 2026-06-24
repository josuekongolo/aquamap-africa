'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';

// Live "related research" per knowledge category, via the cached /api/research
// route (Semantic Scholar). Supplementary — hides itself on error/empty.
const QUERY = {
  all: 'smallholder aquaculture Africa',
  species: 'tilapia catfish aquaculture Africa',
  disease: 'tilapia lake virus fish disease aquaculture',
  feed: 'fish feed conversion ratio tilapia catfish',
  water: 'pond water quality aquaculture dissolved oxygen',
  ras: 'recirculating aquaculture system design',
  regulation: 'aquaculture policy regulation West Africa',
};

export default function ResearchPanel({ category = 'all' }) {
  const { lang } = useLang();
  const [papers, setPapers] = useState(null); // null = loading

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const q = QUERY[category] || QUERY.all;
        const res = await fetch(`/api/research?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (active) setPapers(json.papers || []);
      } catch {
        if (active) setPapers([]);
      }
    })();
    return () => { active = false; };
  }, [category]);

  if (papers && papers.length === 0) return null; // nothing to show

  const title = lang === 'fr' ? 'Recherche récente liée' : 'Related recent research';
  const sub = lang === 'fr'
    ? 'Articles évalués par les pairs (Semantic Scholar) — liens PDF en libre accès quand disponibles.'
    : 'Peer-reviewed papers (Semantic Scholar) — open-access PDF links where available.';

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-md p-8">
      <h3 className="font-bold text-lg mb-1 text-black">{title}</h3>
      <p className="text-xs text-gray-400 mb-5">{sub}</p>

      {papers === null ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {papers.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="block border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm leading-snug" style={{ color: '#0D6B8A' }}>{p.title}</span>
                {p.openAccess && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
                    PDF
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {p.authors.join(', ')}{p.authors.length ? ' · ' : ''}{p.year || ''}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
