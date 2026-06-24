'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Map as MapIcon, Filter, Target, Fish, AlertTriangle } from 'lucide-react';
import { countries } from '../data/institutions';
import { useLang } from '../context/LangContext';

// Leaflet is browser-only — load the map without SSR.
const CountryMap = dynamic(() => import('../components/CountryMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 rounded-xl animate-pulse" />,
});

const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };

// Live World Bank aquaculture production trend (metric tons), if available.
function ProductionSparkline({ series, lang }) {
  if (!series || series.length < 2) return null;
  const latest = series[series.length - 1];
  const fmt = (v) => `${Math.round(v).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')} t`;
  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-400">
          {lang === 'fr' ? 'Production (Banque mondiale)' : 'Production (World Bank)'}
        </span>
        <span className="text-xs font-bold" style={{ color: '#00A878' }}>
          {fmt(latest.value)} <span className="text-gray-400 font-normal">· {latest.year}</span>
        </span>
      </div>
      <div style={{ height: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="wbprod" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A878" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00A878" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              formatter={(v) => [fmt(v), lang === 'fr' ? 'Production' : 'Production']}
              labelFormatter={(l) => series.find(s => s.value === l)?.year || ''}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
            />
            <Area type="monotone" dataKey="value" stroke="#00A878" strokeWidth={2} fill="url(#wbprod)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function MapPage({ liveProduction = {} }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState(null); // country name or null

  const shown = selected ? countries.filter(c => c.name === selected) : countries;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0D6B8A' }}><MapIcon className="w-6 h-6" /> {t.map.title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {lang === 'fr'
            ? "Panorama institutionnel de l'aquaculture en Afrique francophone — chiffres officiels et autorités nationales."
            : 'Institutional overview of aquaculture in francophone Africa — official figures and national authorities.'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-72 space-y-5">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#0D6B8A' }}><Filter className="w-4 h-4" /> {t.map.country}</h3>
            <button
              onClick={() => setSelected(null)}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${selected === null ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              style={selected === null ? { backgroundColor: '#0D6B8A' } : {}}
            >
              {t.map.all}
            </button>
            {countries.map(c => (
              <button
                key={c.name}
                onClick={() => setSelected(c.name)}
                className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${selected === c.name ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                style={selected === c.name ? { backgroundColor: COUNTRY_COLOR[c.name] } : {}}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>

          {/* Country detail cards */}
          {shown.map(c => (
            <div key={c.name} className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold mb-1" style={{ color: '#0D6B8A' }}>{c.flag} {c.name}</h3>
              <a href={c.authority.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-teal-600 block mb-3">{c.authority.name}</a>
              <div className="space-y-1.5 text-sm">
                {c.production.map((p, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-gray-400 text-xs">{p.source} · {p.year}</span>
                    <span className="font-semibold text-gray-700 whitespace-nowrap">{p.value}</span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-gray-500 flex items-start gap-1.5"><Target className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.target}</div>
                <div className="text-xs text-gray-500 flex items-start gap-1.5"><Fish className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.mainSpecies.join(', ')}</div>
                {c.note && <div className="text-xs text-amber-600 italic pt-1 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.note}</div>}
              </div>
              <ProductionSparkline series={liveProduction[c.name]} lang={lang} />
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="flex-1 h-[500px] lg:h-[640px]">
          <CountryMap />
        </div>
      </div>
    </div>
  );
}
