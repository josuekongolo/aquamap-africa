'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { ShieldCheck, AlertTriangle, FileText, BarChart3, Fish, Map as MapIcon, Users, Landmark, Download } from 'lucide-react';
import { countries as institutions, dataSources } from '../data/institutions';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Leaflet is browser-only — load the operator map without SSR.
const OperatorMap = dynamic(() => import('../components/OperatorMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 rounded animate-pulse" />,
});

const COLORS = ['#0D6B8A', '#00A878', '#F4A261', '#8b5cf6', '#ef4444', '#06b6d4'];
const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const SPECIES_IDS = Object.keys(SPECIES_KEY);

function operatorFCR(logsForOp) {
  let feed = 0, harvested = 0, stocked = 0;
  for (const l of logsForOp) {
    if (l.type === 'feed') feed += Number(l.feed_kg) || 0;
    else if (l.type === 'harvest') harvested += Number(l.kg_harvested) || 0;
    else if (l.type === 'stocking') stocked += ((Number(l.fingerlings_count) || 0) * (Number(l.avg_weight_g) || 0)) / 1000;
  }
  const gain = harvested - stocked;
  return feed > 0 && gain > 0 ? feed / gain : null;
}

function toCSV(rows) {
  // Donor M&E columns: identity + disaggregation (gender, age) + geo + production.
  const cols = ['name', 'country', 'region', 'lat', 'lng', 'gender', 'age_range',
    'legal_status', 'species', 'systems', 'units', 'area_m2', 'water_source',
    'electricity', 'road_access', 'production_range', 'revenue_range', 'sales_channel',
    'financing', 'training_wanted', 'challenges', 'created_at'];
  const esc = (v) => {
    const s = Array.isArray(v) ? v.join('|') : (v ?? '');
    return `"${String(s).replace(/"/g, '""')}"`;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export default function Admin() {
  const { t, lang } = useLang();
  const [operators, setOperators] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const [opRes, logRes] = await Promise.all([
        supabase.from('operators').select('*').order('created_at', { ascending: false }),
        supabase.from('logs').select('operator_id, type, feed_kg, kg_harvested, fingerlings_count, avg_weight_g'),
      ]);
      if (!active) return;
      setOperators(opRes.data || []);
      setLogs(logRes.data || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = operators.filter(op => {
    if (filterCountry !== 'all' && op.country !== filterCountry) return false;
    if (filterSpecies !== 'all' && !(op.species || []).includes(filterSpecies)) return false;
    return true;
  });

  // Derived aggregates
  const byCountry = {};
  for (const op of operators) byCountry[op.country] = (byCountry[op.country] || 0) + 1;

  const speciesDist = SPECIES_IDS.map(id => ({
    name: SPECIES_KEY[id],
    value: operators.filter(o => (o.species || []).includes(id)).length,
  })).filter(d => d.value > 0);

  const challengeTally = {};
  for (const op of operators) for (const c of op.challenges || []) challengeTally[c] = (challengeTally[c] || 0) + 1;
  const challengeDist = Object.entries(challengeTally)
    .map(([challenge, count]) => ({ challenge, count }))
    .sort((a, b) => b.count - a.count).slice(0, 6);

  // FCR distribution from per-operator logs
  const logsByOp = {};
  for (const l of logs) (logsByOp[l.operator_id] ||= []).push(l);
  const buckets = [
    { fcr: '< 1.5', count: 0 }, { fcr: '1.5–2', count: 0 }, { fcr: '2–2.5', count: 0 },
    { fcr: '2.5–3', count: 0 }, { fcr: '> 3', count: 0 },
  ];
  for (const op of operators) {
    const f = operatorFCR(logsByOp[op.id] || []);
    if (f == null) continue;
    const i = f < 1.5 ? 0 : f < 2 ? 1 : f < 2.5 ? 2 : f < 3 ? 3 : 4;
    buckets[i].count += 1;
  }
  const bucketColor = ['#00A878', '#00A878', '#F4A261', '#F4A261', '#ef4444'];

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquamap-operators-${filtered.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const mapMarkers = filtered
    .filter(o => o.lat != null && o.lng != null)
    .map(o => ({
      id: o.id,
      lat: o.lat,
      lng: o.lng,
      label: `${o.name} — ${(o.species || []).map(s => SPECIES_KEY[s] || s).join(', ')}`,
    }));

  // Donor M&E disaggregation (gender / youth / geo-verification / area).
  const total = filtered.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const women = filtered.filter(o => ['Femme', 'Female'].includes(o.gender)).length;
  const youth = filtered.filter(o => ['18-25', '26-35'].includes(o.age_range)).length;
  const geo = filtered.filter(o => o.lat != null && o.lng != null).length;
  const totalAreaHa = filtered.reduce((s, o) => s + (Number(o.area_m2) || 0), 0) / 10000;
  const trainingWanted = filtered.filter(o => o.training_wanted === true).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0D6B8A' }}><ShieldCheck className="w-6 h-6" /> {t.admin.title}</h1>
          <p className="text-gray-500 text-sm">
            {lang === 'fr' ? "Vue d'ensemble du secteur — opérateurs enregistrés" : 'Sector overview — registered operators'}
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#00A878' }}
        >
<Download className="inline w-4 h-4 mr-1.5 -mt-0.5" />{t.admin.export}
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
<AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      )}

      {/* Country cards: live registered + sourced national figures */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {institutions.map(c => (
          <div key={c.name} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#0D6B8A' }}>{c.flag} {c.name}</h3>
            <a href={c.authority.website} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-teal-600 block mb-3">{c.authority.name}</a>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{lang === 'fr' ? 'Enregistrés (AquaMap)' : 'Registered (AquaMap)'}</span>
                <span className="font-bold" style={{ color: '#00A878' }}>{byCountry[c.name] || 0}</span>
              </div>
              {c.production.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-400 text-xs">{p.source} · {p.year}</span>
                  <span className="font-semibold text-gray-700">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Donor M&E indicators (gender/youth-disaggregated, geo-verified) */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>
<FileText className="inline w-5 h-5 mr-1.5 -mt-0.5" />{lang === 'fr' ? 'Indicateurs de suivi (S&E)' : 'Monitoring indicators (M&E)'}
          <span className="ml-2 text-xs font-normal text-gray-400">
            {lang === 'fr' ? 'désagrégés genre / jeunesse — alignés FAO / BAD' : 'gender/youth-disaggregated — FAO/AfDB-aligned'}
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Indicator value={total} label={lang === 'fr' ? 'Opérateurs' : 'Operators'} color="#0D6B8A" />
          <Indicator value={`${pct(women)}%`} sub={`${women}`} label={lang === 'fr' ? 'Femmes' : 'Women'} color="#8b5cf6" />
          <Indicator value={`${pct(youth)}%`} sub={`${youth}`} label={lang === 'fr' ? 'Jeunes (18–35)' : 'Youth (18–35)'} color="#00A878" />
          <Indicator value={`${pct(geo)}%`} sub={`${geo}`} label={lang === 'fr' ? 'Géolocalisés' : 'Geo-verified'} color="#F4A261" />
          <Indicator value={totalAreaHa.toFixed(1)} label={lang === 'fr' ? 'Surface (ha)' : 'Area (ha)'} color="#0D6B8A" />
          <Indicator value={`${pct(trainingWanted)}%`} sub={`${trainingWanted}`} label={lang === 'fr' ? 'Demande formation' : 'Want training'} color="#06b6d4" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#0D6B8A' }}><BarChart3 className="w-5 h-5" /> {t.admin.fcrDist}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fcr" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name={t.admin.operators} radius={[4, 4, 0, 0]}>
                {buckets.map((_, i) => <Cell key={i} fill={bucketColor[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#0D6B8A' }}><AlertTriangle className="w-5 h-5" /> {t.admin.challenges}</h3>
          {challengeDist.length === 0 ? (
            <Empty loading={loading} lang={lang} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={challengeDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="challenge" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" name={t.admin.operators} fill="#0D6B8A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Species pie + map */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>
<Fish className="inline w-5 h-5 mr-1.5 -mt-0.5" />{lang === 'fr' ? 'Répartition par espèce' : 'Species breakdown'}
          </h3>
          {speciesDist.length === 0 ? (
            <Empty loading={loading} lang={lang} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={speciesDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {speciesDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-3" style={{ color: '#0D6B8A' }}>
<MapIcon className="inline w-5 h-5 mr-1.5 -mt-0.5" />{lang === 'fr' ? 'Carte des opérateurs' : 'Operator map'} ({mapMarkers.length})
          </h3>
          <div style={{ height: '220px' }}>
            <OperatorMap markers={mapMarkers} />
          </div>
        </div>
      </div>

      {/* Operators table */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: '#0D6B8A' }}><Users className="w-5 h-5" /> {t.admin.operators} ({filtered.length})</h3>
          <div className="flex flex-wrap gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="all">{t.admin.filterCountry}</option>
              {institutions.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}>
              <option value="all">{t.admin.filterSpecies}</option>
              {SPECIES_IDS.map(id => <option key={id} value={id}>{SPECIES_KEY[id]}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <Empty loading lang={lang} />
        ) : filtered.length === 0 ? (
          <Empty loading={false} lang={lang} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="text-left py-2 px-3">Nom</th>
                  <th className="text-left py-2 px-3">{t.map.country}</th>
                  <th className="text-left py-2 px-3">{t.map.species}</th>
                  <th className="text-left py-2 px-3">{t.map.system}</th>
                  <th className="text-right py-2 px-3">{t.register.production}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((op, i) => (
                  <tr key={op.id} className={`border-b last:border-0 hover:bg-gray-50 ${i % 2 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-2 px-3 font-medium text-gray-800">{op.name}</td>
                    <td className="py-2 px-3 text-gray-600">{op.country}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        {(op.species || []).map(s => (
                          <span key={s} className="inline-flex items-center gap-1"><SpeciesIcon name={SPECIES_KEY[s]} className="w-3.5 h-3.5 text-[#0D6B8A]" /> {SPECIES_KEY[s] || s}</span>
                        ))}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{(op.systems || []).join(', ')}</td>
                    <td className="py-2 px-3 text-right font-medium">{op.production_range || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Institutional data sources — credibility for the pitch */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>
<Landmark className="inline w-5 h-5 mr-1.5 -mt-0.5" />{lang === 'fr' ? 'Sources de données institutionnelles' : 'Institutional data sources'}
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {dataSources.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="block bg-white rounded-lg px-4 py-3 hover:shadow-sm transition">
              <div className="font-medium text-sm" style={{ color: '#0D6B8A' }}>{s.name}</div>
              <div className="text-xs text-gray-500">{s.desc[lang]}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Indicator({ value, sub, label, color }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold leading-tight" style={{ color }}>
        {value}{sub != null && <span className="text-sm font-normal text-gray-400"> ({sub})</span>}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function Empty({ loading, lang }) {
  return (
    <div className="text-gray-400 text-sm py-10 text-center">
      {loading ? '…' : (lang === 'fr' ? 'Aucune donnée pour le moment.' : 'No data yet.')}
    </div>
  );
}
