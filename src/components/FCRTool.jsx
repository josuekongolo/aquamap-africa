'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { speciesBenchmarks, speciesList } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import FCRInsight from './FCRInsight';

// Standalone species-aware FCR calculator + benchmark reference. Works fully
// offline — the core agronomic value of the app, independent of any backend.
export default function FCRTool({ defaultSpecies = 'Tilapia' }) {
  const { t } = useLang();
  const [species, setSpecies] = useState(
    speciesList.includes(defaultSpecies) ? defaultSpecies : speciesList[0]
  );
  const [feed, setFeed] = useState('');
  const [gain, setGain] = useState('');

  const b = speciesBenchmarks[species];
  const fcr = feed && gain && parseFloat(gain) > 0
    ? parseFloat(feed) / parseFloat(gain)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: '#0D6B8A' }}><Calculator className="w-5 h-5" /> {t.dashboard.fcrTool}</h3>
      <p className="text-xs text-gray-400 mb-4">{t.dashboard.disclaimer}</p>

      {/* Species selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {speciesList.map(key => (
          <button
            key={key}
            onClick={() => setSpecies(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition ${
              species === key
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
<SpeciesIcon name={key} className="w-4 h-4" /> {key}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calculator */}
        <div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.feedKg}</label>
              <input
                type="number" min="0" value={feed} onChange={e => setFeed(e.target.value)}
                placeholder="Ex: 1000"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.gainKg}</label>
              <input
                type="number" min="0" value={gain} onChange={e => setGain(e.target.value)}
                placeholder="Ex: 550"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>

          {fcr != null && (
            <div className="mt-4">
              <FCRInsight speciesKey={species} fcr={fcr} />
            </div>
          )}
        </div>

        {/* Baseline reference */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm">
          <div className="font-semibold text-gray-700 mb-2">
<SpeciesIcon name={species} className="inline w-4 h-4" /> {species} <span className="font-normal italic text-gray-400">— {b.scientificName}</span>
          </div>
          <dl className="space-y-1.5 text-gray-600">
            <Row label={`FCR ${t.dashboard.optimal}`} value={`${b.fcrOptimal[0]}–${b.fcrOptimal[1]}`} strong color="#00A878" />
            <Row label={`FCR ${t.dashboard.typical}`} value={`${b.fcrTypical[0]}–${b.fcrTypical[1]}`} />
            <Row label={t.dashboard.growout} value={`${b.growoutDays[0]}–${b.growoutDays[1]} j`} />
            <Row label={t.dashboard.marketWeight} value={`${b.marketWeightG[0]}–${b.marketWeightG[1]} g`} />
            <Row label={t.dashboard.protein} value={`${b.feedProteinPct.growout[0]}–${b.feedProteinPct.growout[1]} %`} />
            <Row label={t.dashboard.waterParams} value={`${b.water.tempC[0]}–${b.water.tempC[1]}°C · O₂≥${b.water.doMin} · pH ${b.water.ph[0]}–${b.water.ph[1]}`} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, color }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className={strong ? 'font-bold' : 'font-medium text-gray-700'} style={color ? { color } : undefined}>
        {value}
      </dd>
    </div>
  );
}
