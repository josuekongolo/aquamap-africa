'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Layers, PanelRightClose, X, MapPin, Building2, Target, ExternalLink, ChevronDown } from 'lucide-react';
import { countries } from '../data/institutions';
import { SpeciesIcon } from '../lib/icons';
import WeatherAdvisory from '../components/WeatherAdvisory';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ExploreMap = dynamic(() => import('../components/explore/ExploreMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />,
});

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };

// Unified live GIS map. Public: country institutional layer. Logged-in agents
// also get their operators layer (RLS-scoped) clustered on the map.
export default function MapPage({ liveProduction = {} }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const fr = lang === 'fr';

  const [operators, setOperators] = useState([]);
  const [layers, setLayers] = useState(new Set(['countries']));
  const [basemap, setBasemap] = useState('osm');
  const [selected, setSelected] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [inBoundsOnly, setInBoundsOnly] = useState(true);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Operators only for authenticated agents.
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from('operators').select('*').order('created_at', { ascending: false });
      if (active) { setOperators(data || []); setLayers(prev => new Set(prev).add('operators')); }
    })();
    return () => { active = false; };
  }, [user]);

  const onSelect = useCallback((f) => { setSelected(f); setRightOpen(true); }, []);
  const onBounds = useCallback((b) => setBounds(b), []);

  const toggleLayer = (id) => setLayers(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const inB = (lat, lng) => !inBoundsOnly || !bounds || (lat != null && lng != null && bounds.contains([lat, lng]));
  const visOperators = layers.has('operators') ? operators.filter(o => inB(o.lat, o.lng)) : [];
  const visCountries = layers.has('countries') ? countries.filter(c => inB(c.coords[0], c.coords[1])) : [];

  const LAYER_DEFS = [
    ...(user ? [{ id: 'operators', label: fr ? 'Opérateurs' : 'Operators', color: '#0D6B8A', count: operators.length }] : []),
    { id: 'countries', label: fr ? 'Données par pays' : 'Country data', color: '#00A878', count: countries.length },
  ];

  return (
    <div className="relative h-[calc(100vh-4rem)] flex overflow-hidden bg-gray-100">
      {/* ─── Left: layer panel ─── */}
      <aside className={`${leftOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 absolute md:relative z-[1100] w-72 h-full bg-white border-r shadow-lg md:shadow-none transition-transform flex flex-col`}>
        <div className="flex items-center justify-between px-4 h-12 border-b" style={{ backgroundColor: '#0D6B8A' }}>
          <span className="text-white font-semibold flex items-center gap-2"><Layers className="w-4 h-4" /> {fr ? 'Couches' : 'Layers'}</span>
          <button className="md:hidden text-white" onClick={() => setLeftOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3 space-y-1 overflow-y-auto">
          {LAYER_DEFS.map(l => (
            <label key={l.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="flex items-center gap-2.5 text-sm text-gray-700">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
                <span className="text-xs text-gray-400">({l.count})</span>
              </span>
              <Switch on={layers.has(l.id)} onClick={() => toggleLayer(l.id)} />
            </label>
          ))}

          {/* Background maps */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-3 mb-1">
              {fr ? 'Fond de carte' : 'Background map'}
            </p>
            {[{ id: 'osm', label: fr ? 'Plan (OSM)' : 'Street (OSM)' }, { id: 'satellite', label: 'Satellite' }].map(b => (
              <label key={b.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                <input type="radio" name="basemap" checked={basemap === b.id} onChange={() => setBasemap(b.id)} />
                {b.label}
              </label>
            ))}
          </div>

          {!user && (
            <p className="text-[11px] text-gray-400 px-3 pt-3">
              {fr ? 'Connectez-vous (espace agent) pour afficher la couche opérateurs.' : 'Sign in (agent area) to show the operators layer.'}
            </p>
          )}
        </div>
      </aside>

      {/* ─── Center: map ─── */}
      <div className="flex-1 relative">
        <ExploreMap operators={operators} countries={countries} layers={layers} basemap={basemap} onSelect={onSelect} onBounds={onBounds} />
        <button onClick={() => setLeftOpen(true)} className="md:hidden absolute top-3 left-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium flex items-center gap-1.5" style={{ color: '#0D6B8A' }}>
          <Layers className="w-4 h-4" /> {fr ? 'Couches' : 'Layers'}
        </button>
        <button onClick={() => setRightOpen(true)} className="lg:hidden absolute top-3 right-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium flex items-center gap-1.5" style={{ color: '#0D6B8A' }}>
          <PanelRightClose className="w-4 h-4" /> {fr ? 'Détails' : 'Details'}
        </button>
      </div>

      {/* ─── Right: detail / list panel ─── */}
      <aside className={`${rightOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 absolute right-0 lg:relative z-[1100] w-80 h-full bg-white border-l shadow-lg lg:shadow-none transition-transform flex flex-col`}>
        <div className="flex items-center justify-between px-4 h-12 border-b">
          <span className="font-semibold text-sm" style={{ color: '#0D6B8A' }}>
            {selected ? (fr ? 'Détail' : 'Detail') : (fr ? 'Éléments visibles' : 'Visible items')}
          </span>
          <div className="flex items-center gap-2">
            {selected && <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-700">{fr ? 'Liste' : 'List'}</button>}
            <button className="lg:hidden text-gray-400" onClick={() => setRightOpen(false)}><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <FeatureDetail f={selected} fr={fr} liveProduction={liveProduction} />
          ) : (
            <>
              <label className="flex items-center gap-2 px-4 py-3 border-b text-xs text-gray-600">
                <input type="checkbox" checked={inBoundsOnly} onChange={e => setInBoundsOnly(e.target.checked)} />
                {fr ? 'Afficher uniquement dans la zone visible' : 'Only show items in map bounds'}
              </label>
              {user && (
                <Section title={`${fr ? 'Opérateurs' : 'Operators'} (${visOperators.length})`} show={layers.has('operators')}>
                  {visOperators.length === 0
                    ? <Empty fr={fr} />
                    : visOperators.map(o => (
                      <button key={o.id} onClick={() => onSelect({ kind: 'operator', data: o })}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2">
                        <SpeciesIcon name={SPECIES_KEY[o.species?.[0]] || 'Tilapia'} className="w-4 h-4 text-[#0D6B8A] shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{o.name}</span>
                        <span className="text-xs text-gray-400 ml-auto truncate">{o.region}</span>
                      </button>
                    ))}
                </Section>
              )}
              <Section title={`${fr ? 'Pays' : 'Countries'} (${visCountries.length})`} show={layers.has('countries')}>
                {visCountries.map(c => (
                  <button key={c.name} onClick={() => onSelect({ kind: 'country', data: c })}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </button>
                ))}
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} type="button"
      className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? '' : 'bg-gray-300'}`}
      style={on ? { backgroundColor: '#00A878' } : {}}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function Section({ title, show, children }) {
  const [open, setOpen] = useState(true);
  if (!show) return null;
  return (
    <div className="border-b">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function Empty({ fr }) {
  return <p className="px-4 py-4 text-sm text-gray-400">{fr ? 'Aucun élément ici.' : 'No items here.'}</p>;
}

function ProductionSparkline({ series, fr }) {
  if (!series || series.length < 2) return null;
  const latest = series[series.length - 1];
  const fmt = (v) => `${Math.round(v).toLocaleString(fr ? 'fr-FR' : 'en-US')} t`;
  return (
    <div className="mt-4 pt-3 border-t">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-400">{fr ? 'Production (Banque mondiale)' : 'Production (World Bank)'}</span>
        <span className="text-xs font-bold" style={{ color: '#00A878' }}>{fmt(latest.value)} <span className="text-gray-400 font-normal">· {latest.year}</span></span>
      </div>
      <div style={{ height: 44 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="wbprod2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A878" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00A878" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip formatter={(v) => [fmt(v), 'Production']} labelFormatter={(l) => series.find(s => s.value === l)?.year || ''} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Area type="monotone" dataKey="value" stroke="#00A878" strokeWidth={2} fill="url(#wbprod2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FeatureDetail({ f, fr, liveProduction }) {
  if (f.kind === 'operator') {
    const o = f.data;
    return (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <SpeciesIcon name={SPECIES_KEY[o.species?.[0]] || 'Tilapia'} className="w-5 h-5 text-[#0D6B8A]" />
          <h3 className="font-bold text-black">{o.name}</h3>
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4"><MapPin className="w-3.5 h-3.5" /> {o.region}{o.region && o.country ? ', ' : ''}{o.country}</p>
        <dl className="space-y-2 text-sm">
          <Row label={fr ? 'Espèces' : 'Species'} value={(o.species || []).map(s => SPECIES_KEY[s] || s).join(', ') || '—'} />
          <Row label={fr ? 'Systèmes' : 'Systems'} value={(o.systems || []).join(', ') || '—'} />
          <Row label={fr ? 'Production' : 'Production'} value={o.production_range || '—'} />
          <Row label={fr ? 'Surface' : 'Area'} value={o.area_m2 ? `${o.area_m2} m²` : '—'} />
        </dl>
        {o.lat != null && o.lng != null && (
          <div className="mt-4">
            <WeatherAdvisory lat={o.lat} lng={o.lng} speciesKey={SPECIES_KEY[o.species?.[0]] || 'Tilapia'} />
          </div>
        )}
        <Link href="/dashboard" className="mt-5 inline-block text-sm font-semibold" style={{ color: '#0D6B8A' }}>
          {fr ? 'Voir au tableau de bord →' : 'Open in dashboard →'}
        </Link>
      </div>
    );
  }
  const c = f.data;
  return (
    <div className="p-5">
      <h3 className="font-bold text-lg mb-1 text-black">{c.flag} {c.name}</h3>
      <a href={c.authority.website} target="_blank" rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-teal-600 flex items-center gap-1 mb-4">
        <Building2 className="w-3.5 h-3.5" /> {c.authority.name} <ExternalLink className="w-3 h-3" />
      </a>
      <div className="space-y-2 text-sm">
        {c.production.map((p, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span className="text-gray-400 text-xs">{p.source} · {p.year}</span>
            <span className="font-semibold text-gray-700">{p.value}</span>
          </div>
        ))}
        <div className="pt-2 text-xs text-gray-500 flex items-start gap-1.5"><Target className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.target}</div>
      </div>
      <ProductionSparkline series={liveProduction?.[c.name]} fr={fr} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-700 text-right">{value}</dd>
    </div>
  );
}
