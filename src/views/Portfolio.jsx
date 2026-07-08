'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Plus, AlertTriangle, Search, Users, Wheat, PackageCheck, Activity, ChevronRight, Skull, TriangleAlert, Clock } from 'lucide-react';
import { rateFCR } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import LogModal from '../components/LogModal';
import EventModal from '../components/EventModal';
import CommunityPanel from '../components/dashboard/CommunityPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const STALE_DAYS = 14;
const DAY_MS = 86400000;

const daysSince = (dateStr, now) => (dateStr ? Math.floor((now - new Date(dateStr).getTime()) / DAY_MS) : null);

// Portfolio home: answers "who needs me today?" across all the agent's operators.
// Attention strip + quick capture + KPIs + searchable table, fed by the
// agent_portfolio() RPC (per-operator rollups in one RLS-scoped query).
export default function Portfolio() {
  const { t, lang } = useLang();
  const { agent, user, configured } = useAuth();
  const router = useRouter();
  const fr = lang === 'fr';

  const [operators, setOperators] = useState([]);
  const [portfolio, setPortfolio] = useState({}); // operator_id -> rollup
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [captureFor, setCaptureFor] = useState(null); // { operator, kind: 'log'|'event' }
  const [pickerOpen, setPickerOpen] = useState(null); // 'log' | 'event' | null
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const [{ data: ops, error: opErr }, { data: rollup }] = await Promise.all([
      supabase.from('operators').select('*').order('created_at', { ascending: false }),
      supabase.rpc('agent_portfolio'),
    ]);
    if (opErr) setError(opErr.message);
    setOperators(ops || []);
    const map = {};
    for (const r of rollup || []) map[r.operator_id] = r;
    setPortfolio(map);
    setLoading(false);
  }, [configured]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useRealtimeTable('operators', setOperators, { enabled: configured });

  const rows = useMemo(() => operators.map((o) => {
    const p = portfolio[o.id] || {};
    const speciesKey = p.cycle_species ? (SPECIES_KEY[p.cycle_species] || p.cycle_species) : (SPECIES_KEY[o.species?.[0]] || 'Tilapia');
    const gain = (Number(p.cycle_harvest_kg) || 0) - (Number(p.cycle_stocked_kg) || 0);
    const feed = Number(p.cycle_feed_kg) || 0;
    const fcr = feed > 0 && gain > 0 ? feed / gain : null;
    const rating = fcr != null ? rateFCR(speciesKey, fcr) : null;
    const staleDays = daysSince(p.last_log_date, now);
    const cycleDay = p.cycle_start ? daysSince(p.cycle_start, now) : null;
    return {
      op: o, speciesKey, fcr, rating,
      highEvents: Number(p.high_events_30d) || 0,
      mortality: Number(p.cycle_mortality) || 0,
      lastLog: p.last_log_date, staleDays, cycleDay,
      hasCycle: !!p.cycle_start,
    };
  }), [operators, portfolio, now]);

  // Attention: unresolved severe events → FCR out of band → stale/no data.
  const attention = useMemo(() => {
    const items = [];
    for (const r of rows) {
      if (r.highEvents > 0) items.push({ r, level: 'high', reason: fr ? `${r.highEvents} incident(s) grave(s) (30 j)` : `${r.highEvents} severe incident(s) (30d)`, Icon: Skull });
      else if (r.rating?.status === 'high') items.push({ r, level: 'warn', reason: fr ? `FCR élevé (${r.fcr.toFixed(2)})` : `High FCR (${r.fcr.toFixed(2)})`, Icon: TriangleAlert });
      else if (r.staleDays == null) items.push({ r, level: 'stale', reason: fr ? 'Aucune saisie' : 'No data yet', Icon: Clock });
      else if (r.staleDays >= STALE_DAYS) items.push({ r, level: 'stale', reason: fr ? `${r.staleDays} j sans saisie` : `${r.staleDays}d without data`, Icon: Clock });
    }
    const rank = { high: 0, warn: 1, stale: 2 };
    return items.sort((a, b) => rank[a.level] - rank[b.level]);
  }, [rows, fr]);

  // Portfolio KPIs
  const kpis = useMemo(() => {
    const total = rows.length;
    const withData = rows.filter((r) => r.staleDays != null).length;
    const coverage = total ? Math.round((100 * withData) / total) : 0;
    const fcrDist = { excellent: 0, correct: 0, high: 0 };
    for (const r of rows) if (r.rating) fcrDist[r.rating.status] = (fcrDist[r.rating.status] || 0) + 1;
    return { total, coverage, fcrDist };
  }, [rows]);
  // Harvested biomass across open cycles (from the RPC rollup).
  const harvest30 = useMemo(() => rows.reduce((s, r) => s + (Number(portfolio[r.op.id]?.cycle_harvest_kg) || 0), 0), [rows, portfolio]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.op.name} ${r.op.region} ${r.op.country} ${r.op.phone || ''} ${r.speciesKey}`.toLowerCase().includes(q));
  }, [rows, query]);
  // Default sort: staleness (most neglected first; no-data on top).
  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.staleDays ?? 1e9) - (a.staleDays ?? 1e9)), [filtered]);

  const openCapture = (kind, operator) => { setPickerOpen(null); setCaptureFor({ kind, operator }); };

  return (
    <div className="@container/main max-w-7xl mx-auto px-4 py-8 space-y-6">
      {captureFor?.kind === 'log' && (
        <LogModal operator={captureFor.operator} onClose={() => setCaptureFor(null)} onSaved={() => { setCaptureFor(null); load(); }} />
      )}
      {captureFor?.kind === 'event' && (
        <EventModal operator={captureFor.operator} onClose={() => setCaptureFor(null)} onSaved={() => { setCaptureFor(null); load(); }} />
      )}
      {pickerOpen && (
        <OperatorPicker fr={fr} operators={operators} onPick={(o) => openCapture(pickerOpen, o)} onClose={() => setPickerOpen(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-black">{t.dashboard.welcome} {agent?.full_name || user?.email}</h1>
          {agent?.organization && <p className="text-muted-foreground text-sm">{agent.organization}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPickerOpen('log')} className="text-white px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand)' }}>
            <Plus className="size-4" /> {fr ? 'Saisie' : 'Log'}
          </button>
          <button onClick={() => setPickerOpen('event')} className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
            <Plus className="size-4" /> {fr ? 'Événement' : 'Event'}
          </button>
          <Link href="/register" className="px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
            <Users className="size-4" /> <span className="hidden sm:inline">{t.dashboard.registerFirst.replace('+ ', '')}</span>
          </Link>
        </div>
      </div>

      {!configured && <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3"><AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}</div>}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      {configured && !loading && operators.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          {t.dashboard.noOperators}
          <Link href="/register" className="block mt-3 font-medium" style={{ color: 'var(--brand)' }}>{t.dashboard.registerFirst}</Link>
        </CardContent></Card>
      )}

      {operators.length > 0 && (
        <>
          {/* Attention strip */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4" style={{ color: 'var(--brand)' }} /> {fr ? 'À suivre aujourd’hui' : 'Needs attention'}</CardTitle>
              <CardDescription>{fr ? 'Incidents graves, FCR hors plage, données manquantes.' : 'Severe incidents, out-of-range FCR, missing data.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{fr ? 'Rien d’urgent — tous les opérateurs sont à jour. 🎉' : 'Nothing urgent — all operators up to date. 🎉'}</p>
              ) : (
                <div className="divide-y">
                  {attention.slice(0, 8).map(({ r, level, reason, Icon }) => (
                    <button key={r.op.id} onClick={() => router.push(`/dashboard/${r.op.id}`)}
                      className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 -mx-2 px-2 rounded-md">
                      <span className={`shrink-0 size-8 rounded-full flex items-center justify-center ${level === 'high' ? 'bg-red-100 text-red-600' : level === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="size-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.op.name}</p>
                        <p className="text-xs text-muted-foreground">{[r.op.region, r.op.country].filter(Boolean).join(', ')}</p>
                      </div>
                      <span className="text-sm text-right shrink-0" style={{ color: level === 'high' ? '#dc2626' : level === 'warn' ? '#d97706' : '#6b7280' }}>{reason}</span>
                      <ChevronRight className="size-4 text-gray-300 shrink-0" />
                    </button>
                  ))}
                  {attention.length > 8 && <p className="text-xs text-muted-foreground pt-2">+{attention.length - 8} {fr ? 'autres' : 'more'}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi Icon={Users} label={fr ? 'Opérateurs' : 'Operators'} value={kpis.total} />
            <Kpi Icon={Activity} label={fr ? 'Couverture données' : 'Data coverage'} value={`${kpis.coverage}%`} sub={fr ? 'avec au moins une saisie' : 'with at least one log'} />
            <Kpi Icon={PackageCheck} label={fr ? 'Récolte (cycles en cours)' : 'Harvest (open cycles)'} value={`${Math.round(harvest30).toLocaleString()} kg`} />
            <Kpi Icon={Wheat} label="FCR" value={`${kpis.fcrDist.excellent + kpis.fcrDist.correct}/${kpis.fcrDist.excellent + kpis.fcrDist.correct + kpis.fcrDist.high}`} sub={fr ? 'dans la plage / évalués' : 'in range / rated'} />
          </div>

          {/* Operators table */}
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">{fr ? 'Mes opérateurs' : 'My operators'}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder={fr ? 'Rechercher…' : 'Search…'}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-3 py-2 font-medium">{fr ? 'Opérateur' : 'Operator'}</th>
                      <th className="px-3 py-2 font-medium">{fr ? 'Région' : 'Region'}</th>
                      <th className="px-3 py-2 font-medium">{fr ? 'Espèce' : 'Species'}</th>
                      <th className="px-3 py-2 font-medium text-right">FCR</th>
                      <th className="px-3 py-2 font-medium text-right">{fr ? 'Cycle' : 'Cycle'}</th>
                      <th className="px-3 py-2 font-medium text-right">{fr ? 'Dernière saisie' : 'Last activity'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.op.id} onClick={() => router.push(`/dashboard/${r.op.id}`)}
                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer">
                        <td className="px-3 py-2.5 font-medium">{r.op.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{r.op.region || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5"><SpeciesIcon name={r.speciesKey} className="size-3.5 text-[#0D6B8A]" /> {r.speciesKey}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {r.fcr != null
                            ? <Badge variant="outline" style={{ color: r.rating?.color, borderColor: r.rating?.color }}>{r.fcr.toFixed(2)}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{r.hasCycle && r.cycleDay != null ? `${fr ? 'j' : 'd'} ${r.cycleDay}` : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {r.staleDays == null
                            ? <span className="text-red-500">{fr ? 'jamais' : 'never'}</span>
                            : <span className={r.staleDays >= STALE_DAYS ? 'text-amber-600' : 'text-muted-foreground'}>{r.staleDays === 0 ? (fr ? "aujourd'hui" : 'today') : `${r.staleDays} ${fr ? 'j' : 'd'}`}</span>}
                        </td>
                      </tr>
                    ))}
                    {sorted.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">{fr ? 'Aucun résultat.' : 'No results.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <CommunityPanel fr={fr} />
        </>
      )}
    </div>
  );
}

function Kpi({ Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Icon className="size-3.5" /> {label}</p>
        <p className="text-2xl font-semibold tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// Quick-capture operator chooser (cmdk) — the field flow is "I just did X for
// farmer Y", so pick the operator first, then the log/event modal opens.
function OperatorPicker({ fr, operators, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-[1200] bg-black/40 flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command label={fr ? 'Choisir un opérateur' : 'Pick an operator'} className="outline-none">
          <div className="flex items-center gap-2 px-4 border-b">
            <Search className="w-4 h-4 text-gray-400" />
            <Command.Input autoFocus placeholder={fr ? 'Pour quel opérateur ?' : 'For which operator?'} className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400" />
            <kbd className="font-mono2 text-[11px] text-gray-400">esc</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-gray-400">{fr ? 'Aucun opérateur.' : 'No operators.'}</Command.Empty>
            {operators.map((o) => (
              <Command.Item key={o.id} value={`${o.name} ${o.region || ''} ${o.country || ''}`} onSelect={() => onPick(o)}
                className="flex items-center gap-3 px-2 py-2 rounded-md">
                <SpeciesIcon name={SPECIES_KEY[o.species?.[0]] || 'Tilapia'} className="w-4 h-4 text-[#0D6B8A] shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-gray-800 truncate">{o.name}</div>
                  <div className="text-xs text-gray-400 truncate">{[o.region, o.country].filter(Boolean).join(', ')}</div>
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
