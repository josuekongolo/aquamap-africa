'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Command } from 'cmdk';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Layers, X, MapPin, Building2, Target, ExternalLink, ChevronDown, ChevronLeft, Search, Globe, Phone, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { africaCountries as countries } from '../data/africaCountries';
import { SpeciesIcon } from '../lib/icons';
import { countryFromAddress } from '../lib/africa';
import WeatherAdvisory from '../components/WeatherAdvisory';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getMarineForecast } from '../lib/marine';
import { useRealtimeTable } from '../lib/useRealtimeTable';

const SITE_PAGE = 50;

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
  const [sites, setSites] = useState([]);
  const [layers, setLayers] = useState(new Set(['countries', 'sites']));
  const [basemap, setBasemap] = useState('osm');
  const [selected, setSelected] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [inBoundsOnly, setInBoundsOnly] = useState(true);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false); // desktop collapse
  const [rightCollapsed, setRightCollapsed] = useState(false); // desktop collapse
  const [forecast, setForecast] = useState([]);

  // Site search + filters + pagination
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [siteType, setSiteType] = useState('all');
  const [siteCountry, setSiteCountry] = useState('all');
  const [siteHasPhone, setSiteHasPhone] = useState(false);
  const [siteHasWebsite, setSiteHasWebsite] = useState(false);
  const [siteCount, setSiteCount] = useState(SITE_PAGE);
  const [focus, setFocus] = useState(null); // [lng, lat] to fly to

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

  // Live operator markers (RLS-scoped to the signed-in agent).
  useRealtimeTable('operators', setOperators, { enabled: isSupabaseConfigured && !!user });

  // Public aquaculture sites (Google Places) — visible to everyone.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/map/aquaculture');
        const json = await res.json();
        if (active) setSites(json.sites || []);
      } catch { /* offline / unconfigured — map simply omits the sites layer */ }
    })();
    return () => { active = false; };
  }, []);

  // Marine/weather casts (Open-Meteo) — fetched once when any cast layer is enabled.
  const wantForecast = ['waves', 'sst', 'currents', 'wind'].some((k) => layers.has(k));
  useEffect(() => {
    if (!wantForecast || forecast.length) return;
    let active = true;
    getMarineForecast().then((pts) => { if (active) setForecast(pts); });
    return () => { active = false; };
  }, [wantForecast, forecast.length]);

  const onSelect = useCallback((f) => { setSelected(f); setRightOpen(true); }, []);
  const onBounds = useCallback((b) => setBounds(b), []);

  // ⌘K opens the site search palette; Escape closes it, or steps back from a detail.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      else if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false);
        else if (selected) setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, selected]);

  const toggleLayer = (id) => setLayers(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const inB = (lat, lng) => !inBoundsOnly || !bounds || (lat != null && lng != null && bounds.contains([lat, lng]));

  // Site filters drive both the map markers and the right-panel list.
  const siteCountryOf = (s) => countryFromAddress(s.address);
  const siteTypes = [...new Set(sites.map((s) => s.type).filter(Boolean))].sort();
  const siteCountries = [...new Set(sites.map(siteCountryOf).filter(Boolean))].sort();
  const filteredSites = sites.filter((s) =>
    (siteType === 'all' || s.type === siteType) &&
    (siteCountry === 'all' || siteCountryOf(s) === siteCountry) &&
    (!siteHasPhone || !!s.phone) &&
    (!siteHasWebsite || !!s.website));

  const visOperators = layers.has('operators') ? operators.filter(o => inB(o.lat, o.lng)) : [];
  const visSites = layers.has('sites') ? filteredSites.filter(s => inB(s.lat, s.lng)) : [];
  const visCountries = layers.has('countries') ? countries.filter(c => inB(c.coords[0], c.coords[1])) : [];
  const visSitesPage = visSites.slice(0, siteCount);
  const sitesRemaining = visSites.length - visSitesPage.length;

  const resetSitePage = () => setSiteCount(SITE_PAGE);
  const pickType = (v) => { setSiteType(v); resetSitePage(); };
  const pickSiteCountry = (v) => { setSiteCountry(v); resetSitePage(); };
  const toggleSitePhone = () => { setSiteHasPhone(v => !v); resetSitePage(); };
  const toggleSiteWebsite = () => { setSiteHasWebsite(v => !v); resetSitePage(); };
  const clearSiteFilters = () => { setSiteType('all'); setSiteCountry('all'); setSiteHasPhone(false); setSiteHasWebsite(false); resetSitePage(); };
  const focusSite = (s) => { onSelect({ kind: 'site', data: s }); setFocus([s.lng, s.lat]); setPaletteOpen(false); };
  const siteFiltersActive = siteType !== 'all' || siteCountry !== 'all' || siteHasPhone || siteHasWebsite;

  const LAYER_DEFS = [
    ...(user ? [{ id: 'operators', label: fr ? 'Opérateurs' : 'Operators', color: '#0D6B8A', count: operators.length }] : []),
    { id: 'sites', label: fr ? 'Sites aquacoles' : 'Aquaculture sites', color: '#F4A261', count: sites.length },
    { id: 'countries', label: fr ? 'Données par pays' : 'Country data', color: '#00A878', count: countries.length },
  ];

  const FORECAST_DEFS = [
    { id: 'waves', label: fr ? 'Vagues' : 'Waves', color: '#41b6c4' },
    { id: 'sst', label: fr ? 'Température mer' : 'Sea temp', color: '#fc8d59' },
    { id: 'currents', label: fr ? 'Courants' : 'Currents', color: '#0D6B8A' },
    { id: 'wind', label: fr ? 'Vent' : 'Wind', color: '#475569' },
  ];

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-screen flex overflow-hidden bg-gray-100">
      {/* ─── Left: layer panel ─── */}
      <aside className={`${leftOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${leftCollapsed ? 'md:hidden' : ''} absolute md:relative z-[1100] w-72 h-full bg-white border-r shadow-lg md:shadow-none transition-transform flex flex-col`}>
        <div className="flex items-center justify-between px-4 h-12 border-b" style={{ backgroundColor: '#0D6B8A' }}>
          <span className="text-white font-semibold flex items-center gap-2"><Layers className="w-4 h-4" /> {fr ? 'Couches' : 'Layers'}</span>
          <div className="flex items-center gap-1">
            <button className="hidden md:block text-white/90 hover:text-white" title={fr ? 'Réduire' : 'Collapse'} onClick={() => setLeftCollapsed(true)}><PanelLeftClose className="w-5 h-5" /></button>
            <button className="md:hidden text-white" onClick={() => setLeftOpen(false)}><X className="w-5 h-5" /></button>
          </div>
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

          {/* Marine / weather casts (Open-Meteo) */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-3 mb-1">
              {fr ? 'Prévisions marines' : 'Marine forecast'}
            </p>
            {FORECAST_DEFS.map(l => (
              <label key={l.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                <span className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
                <Switch on={layers.has(l.id)} onClick={() => toggleLayer(l.id)} />
              </label>
            ))}
            {wantForecast && forecast.length === 0 && (
              <p className="text-[11px] text-gray-400 px-3 pt-1">{fr ? 'Chargement…' : 'Loading…'}</p>
            )}
          </div>

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
        <ExploreMap operators={operators} sites={filteredSites} countries={countries} layers={layers} basemap={basemap} forecast={forecast} focus={focus} onSelect={onSelect} onBounds={onBounds} />
        {/* Mobile: open drawers */}
        <button onClick={() => setLeftOpen(true)} className="md:hidden absolute top-3 left-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium flex items-center gap-1.5" style={{ color: '#0D6B8A' }}>
          <Layers className="w-4 h-4" /> {fr ? 'Couches' : 'Layers'}
        </button>
        <button onClick={() => setRightOpen(true)} className="lg:hidden absolute top-3 right-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium flex items-center gap-1.5" style={{ color: '#0D6B8A' }}>
          <PanelRightOpen className="w-4 h-4" /> {fr ? 'Détails' : 'Details'}
        </button>
        {/* Desktop: re-open a collapsed panel (kept below the nav reveal band) */}
        {leftCollapsed && (
          <button onClick={() => setLeftCollapsed(false)} className="hidden md:flex absolute top-16 left-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium items-center gap-1.5" style={{ color: '#0D6B8A' }}>
            <PanelLeftOpen className="w-4 h-4" /> {fr ? 'Couches' : 'Layers'}
          </button>
        )}
        {rightCollapsed && (
          <button onClick={() => setRightCollapsed(false)} className="hidden lg:flex absolute top-16 right-3 z-[1000] bg-white rounded-lg shadow px-3 py-2 text-sm font-medium items-center gap-1.5" style={{ color: '#0D6B8A' }}>
            <PanelRightOpen className="w-4 h-4" /> {fr ? 'Détails' : 'Details'}
          </button>
        )}
      </div>

      {/* ─── Right: detail / list panel ─── */}
      <aside className={`${rightOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 ${rightCollapsed ? 'lg:hidden' : ''} absolute right-0 lg:relative z-[1100] w-80 h-full bg-white border-l shadow-lg lg:shadow-none transition-transform flex flex-col`}>
        <div className="flex items-center justify-between px-4 h-12 border-b">
          <span className="font-semibold text-sm" style={{ color: '#0D6B8A' }}>
            {selected ? (fr ? 'Détail' : 'Detail') : (fr ? 'Éléments visibles' : 'Visible items')}
          </span>
          <div className="flex items-center gap-2">
            {selected && <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-700">{fr ? 'Liste' : 'List'}</button>}
            <button className="hidden lg:block text-gray-400 hover:text-gray-700" title={fr ? 'Réduire' : 'Collapse'} onClick={() => setRightCollapsed(true)}><PanelRightClose className="w-5 h-5" /></button>
            <button className="lg:hidden text-gray-400" onClick={() => setRightOpen(false)}><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <>
              <button onClick={() => setSelected(null)}
                className="sticky top-0 z-10 w-full flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b bg-white/95 backdrop-blur hover:bg-gray-50"
                style={{ color: '#0D6B8A' }}>
                <ChevronLeft className="w-4 h-4" /> {fr ? 'Retour à la liste' : 'Back to list'}
              </button>
              <FeatureDetail f={selected} fr={fr} liveProduction={liveProduction} />
            </>
          ) : (
            <>
              {/* Site search + filters */}
              {layers.has('sites') && (
                <div className="px-3 py-3 border-b space-y-2">
                  <button onClick={() => setPaletteOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:border-teal-300 text-left text-sm">
                    <Search className="w-4 h-4" />
                    <span className="flex-1">{fr ? 'Rechercher un site…' : 'Search a site…'}</span>
                    <kbd className="font-mono2 text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded border">⌘K</kbd>
                  </button>
                  <div className="flex gap-2">
                    <select value={siteType} onChange={(e) => pickType(e.target.value)} className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                      <option value="all">{fr ? 'Tous types' : 'All types'}</option>
                      {siteTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={siteCountry} onChange={(e) => pickSiteCountry(e.target.value)} className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                      <option value="all">{fr ? 'Tous pays' : 'All countries'}</option>
                      {siteCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={toggleSiteWebsite} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition ${siteHasWebsite ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} style={siteHasWebsite ? { backgroundColor: '#0D6B8A' } : {}}>
                      <Globe className="w-3 h-3" /> {fr ? 'Site web' : 'Website'}
                    </button>
                    <button onClick={toggleSitePhone} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition ${siteHasPhone ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} style={siteHasPhone ? { backgroundColor: '#0D6B8A' } : {}}>
                      <Phone className="w-3 h-3" /> {fr ? 'Téléphone' : 'Phone'}
                    </button>
                    {siteFiltersActive && <button onClick={clearSiteFilters} className="text-[11px] text-gray-400 underline hover:text-gray-700">{fr ? 'Réinit.' : 'Reset'}</button>}
                  </div>
                </div>
              )}

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
              <Section title={`${fr ? 'Sites aquacoles' : 'Aquaculture sites'} (${visSites.length})`} show={layers.has('sites')}>
                {visSites.length === 0 ? (
                  <Empty fr={fr} />
                ) : (
                  <>
                    {visSitesPage.map(s => (
                      <button key={s.id} onClick={() => focusSite(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" style={{ color: '#F4A261' }} />
                        <span className="text-sm text-gray-700 truncate">{s.name}</span>
                        {s.type && <span className="text-xs text-gray-400 ml-auto truncate">{s.type}</span>}
                      </button>
                    ))}
                    {sitesRemaining > 0 && (
                      <button onClick={() => setSiteCount(c => c + SITE_PAGE)}
                        className="w-full text-center px-4 py-2.5 text-xs font-semibold hover:bg-gray-50" style={{ color: '#0D6B8A' }}>
                        {fr ? `Afficher plus (${sitesRemaining})` : `Show more (${sitesRemaining})`}
                      </button>
                    )}
                  </>
                )}
              </Section>
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

      {/* ⌘K site search palette (searches the filtered set, flies the map on select) */}
      {paletteOpen && (
        <div className="fixed inset-0 z-[1300] bg-black/40 flex items-start justify-center pt-24 px-4" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <Command label={fr ? 'Recherche de sites' : 'Site search'} className="outline-none">
              <div className="flex items-center gap-2 px-4 border-b">
                <Search className="w-4 h-4 text-gray-400" />
                <Command.Input autoFocus placeholder={fr ? 'Rechercher un site aquacole…' : 'Search an aquaculture site…'}
                  className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400" />
                <kbd className="font-mono2 text-[11px] text-gray-400">esc</kbd>
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-gray-400">
                  {fr ? 'Aucun résultat.' : 'No results.'}
                </Command.Empty>
                {filteredSites.slice(0, 500).map(s => (
                  <Command.Item key={s.id} value={`${s.name} ${s.address || ''} ${s.type || ''}`}
                    onSelect={() => focusSite(s)} className="flex items-center gap-3 px-2 py-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: '#F4A261' }} />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 truncate">{s.name}</div>
                      <div className="text-xs text-gray-400 truncate">{s.address}</div>
                    </div>
                    {s.type && <span className="text-[10px] text-gray-400 ml-auto shrink-0">{s.type}</span>}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
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
  if (f.kind === 'site') {
    const s = f.data;
    return (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5" style={{ color: '#F4A261' }} />
          <h3 className="font-bold text-black">{s.name}</h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Google · {fr ? 'non vérifié' : 'unverified'}</span>
        {s.address && <p className="text-sm text-gray-500 flex items-start gap-1.5 mt-3"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {s.address}</p>}
        <dl className="space-y-2 text-sm mt-3">
          {s.type && <Row label={fr ? 'Type' : 'Type'} value={s.type} />}
          {s.phone && <Row label={fr ? 'Téléphone' : 'Phone'} value={s.phone} />}
        </dl>
        <div className="mt-4 flex flex-col gap-1.5">
          {s.website && (
            <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: '#0D6B8A' }}>
              {fr ? 'Site web' : 'Website'} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {s.mapsUri && (
            <a href={s.mapsUri} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }
  const c = f.data;
  // Curated authority link for the pilot countries; otherwise the genuine FAO
  // country profile (FACP uses the ISO-3 code) for every African country.
  const authHref = c.authority?.website || (c.iso3 ? `https://www.fao.org/fishery/en/facp/${c.iso3}` : null);
  const authName = c.authority?.name || (fr ? 'Profil pays FAO' : 'FAO country profile');
  return (
    <div className="p-5">
      <h3 className="font-bold text-lg mb-1 text-black">{c.flag} {c.name}</h3>
      {authHref && (
        <a href={authHref} target="_blank" rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-teal-600 flex items-center gap-1 mb-4">
          <Building2 className="w-3.5 h-3.5" /> {authName} <ExternalLink className="w-3 h-3" />
        </a>
      )}
      <div className="space-y-2 text-sm">
        {(c.production || []).map((p, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span className="text-gray-400 text-xs">{p.source} · {p.year}</span>
            <span className="font-semibold text-gray-700">{p.value}</span>
          </div>
        ))}
        {c.target && (
          <div className="pt-2 text-xs text-gray-500 flex items-start gap-1.5"><Target className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.target}</div>
        )}
      </div>
      <ProductionSparkline series={liveProduction?.[c.name]} fr={fr} />
      {!c.authority && !liveProduction?.[c.name] && (
        <p className="text-xs text-gray-400 mt-4">{fr ? 'Données de production non disponibles (Banque mondiale).' : 'No production data available (World Bank).'}</p>
      )}
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
