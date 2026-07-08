'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wheat, PackageCheck, Plus, TrendingUp, AlertTriangle, Download, Skull, Pill, Droplets, Ruler, Eye, Pencil, ChevronLeft, HeartPulse, Trash2 } from 'lucide-react';
import { rateFCR, speciesBenchmarks } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { buildCycles, cycleLogs, cycleMetrics, cycleDay, biomassEstimate } from '../lib/cycles';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { toast } from 'sonner';
import LogModal from '../components/LogModal';
import EventModal from '../components/EventModal';
import WeatherAdvisory from '../components/WeatherAdvisory';
import FCRInsight from '../components/FCRInsight';
import GrowthCurveChart from '../components/dashboard/GrowthCurveChart';
import { LogsDataTable } from '../components/dashboard/LogsDataTable';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const STATUS_LABEL = { excellent: 'fcrExcellent', correct: 'fcrCorrect', high: 'fcrHigh' };

const EVENT_META = {
  mortality: { Icon: Skull, fr: 'Mortalité', en: 'Mortality' },
  treatment: { Icon: Pill, fr: 'Traitement', en: 'Treatment' },
  water: { Icon: Droplets, fr: "Qualité d'eau", en: 'Water quality' },
  sampling: { Icon: Ruler, fr: 'Échantillon', en: 'Sampling' },
  observation: { Icon: Eye, fr: 'Observation', en: 'Observation' },
};
const SEVERITY_CLS = {
  high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600',
};

function eventDetails(e, fr) {
  const d = e.details || {};
  const out = [];
  const add = (label, val, unit = '') => { if (val != null && val !== '') out.push(`${label}: ${val}${unit}`); };
  if (e.type === 'mortality') { add(fr ? 'Nombre' : 'Count', d.count); add(fr ? 'Cause' : 'Cause', d.cause); }
  else if (e.type === 'treatment') { add(fr ? 'Produit' : 'Product', d.product); add(fr ? 'Dose' : 'Dose', d.dose); }
  else if (e.type === 'water') { add(fr ? 'Temp.' : 'Temp', d.temp_c, '°C'); add('pH', d.ph); add(fr ? 'O₂' : 'DO', d.do_mgl, ' mg/L'); }
  else if (e.type === 'sampling') { add(fr ? 'Échantillon' : 'Sampled', d.count); add(fr ? 'Poids moy.' : 'Avg wt', d.avg_weight_g, ' g'); }
  return out;
}

function primarySpeciesKey(operator) {
  return SPECIES_KEY[operator?.species?.[0]] || 'Tilapia';
}

// Single-operator detail — everything the old dashboard showed, but scoped to a
// selected production CYCLE (FCR over a whole lifetime is agronomically wrong).
export default function OperatorDetail({ operatorId }) {
  const { t, lang } = useLang();
  const { configured } = useAuth();
  const fr = lang === 'fr';

  const [operator, setOperator] = useState(null);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState('all');
  const [cycleId, setCycleId] = useState(null);
  const [error, setError] = useState('');

  const loadOperator = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data, error } = await supabase.from('operators').select('*').eq('id', operatorId).single();
    if (error) setError(error.message); else setOperator(data);
    setLoading(false);
  }, [configured, operatorId]);

  const loadLogs = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase.from('logs').select('*').eq('operator_id', operatorId).order('log_date', { ascending: false });
    setLogs(data || []);
  }, [configured, operatorId]);

  const loadEvents = useCallback(async () => {
    if (!configured) return;
    const { data } = await supabase.from('events').select('*').eq('operator_id', operatorId).order('event_date', { ascending: false });
    setEvents(data || []);
  }, [configured, operatorId]);

  const deleteLog = useCallback(async (log) => {
    if (!window.confirm(fr ? 'Supprimer cette saisie ?' : 'Delete this log entry?')) return;
    const { error } = await supabase.from('logs').delete().eq('id', log.id);
    if (error) toast.error(error.message); else { toast.success(fr ? 'Saisie supprimée.' : 'Log deleted.'); loadLogs(); }
  }, [fr, loadLogs]);

  const deleteEvent = useCallback(async (ev) => {
    if (!window.confirm(fr ? 'Supprimer cet événement ?' : 'Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', ev.id);
    if (error) toast.error(error.message); else { toast.success(fr ? 'Événement supprimé.' : 'Event deleted.'); loadEvents(); }
  }, [fr, loadEvents]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOperator(); }, [loadOperator]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(); }, [loadLogs]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEvents(); }, [loadEvents]);

  useRealtimeTable('events', setEvents, { enabled: configured, filter: `operator_id=eq.${operatorId}` });
  useRealtimeTable('logs', setLogs, {
    enabled: configured,
    filter: `operator_id=eq.${operatorId}`,
    onEvent: ({ eventType, new: row }) => {
      // Compute from fresh rows (avoid the stale-closure bug) via the updater.
      if (eventType !== 'INSERT' || row?.type !== 'harvest') return;
      setLogs((prev) => {
        const next = [row, ...prev.filter((l) => l.id !== row.id)];
        const cyc = buildCycles(next);
        const cur = cyc[cyc.length - 1] || null;
        const m = cycleMetrics(next, events, cur);
        if (m.fcr != null) {
          const r = rateFCR(primarySpeciesKey(operator), m.fcr);
          if (r?.status === 'high') {
            toast.warning(`${operator?.name || ''} — FCR ${m.fcr.toFixed(2)}`, {
              description: fr ? 'Au-dessus de la plage optimale' : 'Above optimal range',
            });
          }
        }
        return next;
      });
    },
  });

  const cycles = buildCycles(logs);
  const cycle = cycles.find((c) => c.id === cycleId) || cycles[cycles.length - 1] || null;
  const speciesKey = cycle?.species ? (SPECIES_KEY[cycle.species] || cycle.species) : primarySpeciesKey(operator);
  const metrics = cycleMetrics(logs, events, cycle);
  const rating = metrics.fcr != null ? rateFCR(speciesKey, metrics.fcr) : null;
  const inCycleLogs = cycle ? cycleLogs(logs, cycle) : logs;
  const dayN = cycleDay(cycle);
  const biomass = biomassEstimate(logs, events, cycle, speciesBenchmarks[speciesKey]);

  const exportCsv = () => {
    if (!operator) return;
    const cols = ['log_date', 'type', 'species', 'feed_kg', 'fingerlings_count', 'avg_weight_g', 'kg_harvested', 'kg_sold', 'price_per_kg', 'note'];
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [cols.join(','), ...inCycleLogs.map((l) => cols.map((c) => esc(l[c])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(operator.name || 'operator').replace(/\s+/g, '_')}_cycle.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const seriesData = (() => {
    const byDate = {};
    for (const l of inCycleLogs) {
      const d = l.log_date;
      if (!d) continue;
      const e = (byDate[d] ||= { date: d, feed: 0, harvest: 0, stocking: 0, sold: 0, revenue: 0 });
      if (l.type === 'feed') e.feed += Number(l.feed_kg) || 0;
      else if (l.type === 'harvest') {
        e.harvest += Number(l.kg_harvested) || 0;
        e.sold += Number(l.kg_sold) || 0;
        e.revenue += (Number(l.kg_sold) || 0) * (Number(l.price_per_kg) || 0);
      } else if (l.type === 'stocking') {
        e.stocking += ((Number(l.fingerlings_count) || 0) * (Number(l.avg_weight_g) || 0)) / 1000;
      }
    }
    return Object.values(byDate).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  })();
  const seriesConfig = {
    feed: { label: fr ? 'Aliments (kg)' : 'Feed (kg)', color: 'var(--brand)' },
    harvest: { label: fr ? 'Récolte (kg)' : 'Harvest (kg)', color: 'var(--brand-2)' },
    stocking: { label: fr ? 'Empoissonnement (kg)' : 'Stocking (kg)', color: '#F4A261' },
    sold: { label: fr ? 'Vendu (kg)' : 'Sold (kg)', color: '#8b5cf6' },
    revenue: { label: fr ? 'Revenu (FCFA)' : 'Revenue', color: '#06b6d4' },
  };

  if (!loading && !operator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft className="size-4" /> {t.nav.dashboard}</Link>
        <p className="mt-6 text-sm text-muted-foreground">{error || (fr ? 'Opérateur introuvable.' : 'Operator not found.')}</p>
      </div>
    );
  }

  return (
    <div className="@container/main max-w-7xl mx-auto px-4 py-8 space-y-6">
      {modalOpen && operator && (
        <LogModal operator={operator} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadLogs(); }} />
      )}
      {eventModalOpen && operator && (
        <EventModal operator={operator} onClose={() => setEventModalOpen(false)} onSaved={() => { setEventModalOpen(false); loadEvents(); }} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-1"><ChevronLeft className="size-4" /> {fr ? 'Portefeuille' : 'Portfolio'}</Link>
          <h1 className="font-display text-3xl font-bold text-black">{operator?.name}</h1>
          <p className="text-muted-foreground text-sm">{[operator?.region, operator?.country].filter(Boolean).join(', ')}</p>
        </div>
        <div className="flex items-center gap-2">
          {cycles.length > 1 && (
            <Select value={cycle?.id || ''} onValueChange={setCycleId}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cycles.map((c, i) => (
                  <SelectItem key={c.id} value={c.id}>{fr ? 'Cycle' : 'Cycle'} {i + 1} · {c.start}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link href={`/operators/${operatorId}/edit`} className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
            <Pencil className="size-4" /> <span className="hidden sm:inline">{fr ? 'Modifier' : 'Edit'}</span>
          </Link>
          {inCycleLogs.length > 0 && (
            <button onClick={exportCsv} className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
              <Download className="size-4" /> CSV
            </button>
          )}
        </div>
      </div>

      {!configured && <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3"><AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}</div>}

      {operator && (
        <>
          <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Kpi description={t.dashboard.fcr} value={metrics.fcr != null ? metrics.fcr.toFixed(2) : '—'}
              action={rating && <Badge variant="outline" style={{ color: rating.color, borderColor: rating.color }}>{t.dashboard[STATUS_LABEL[rating.status]]}</Badge>}
              footerMain={<>{speciesKey} <SpeciesIcon name={speciesKey} className="size-4" /></>}
              footerSub={cycle ? `${fr ? 'Cycle depuis' : 'Cycle since'} ${cycle.start}${dayN != null ? ` · ${fr ? 'jour' : 'day'} ${dayN}` : ''}` : (fr ? 'Aucun cycle' : 'No cycle')} />
            <Kpi description={t.dashboard.feedKg} value={`${Math.round(metrics.feed)} kg`}
              action={<Badge variant="outline"><Wheat className="size-3.5" /></Badge>}
              footerMain={fr ? 'Aliments du cycle' : 'Cycle feed'} footerSub={fr ? 'Distribué' : 'Distributed'} />
            <Kpi description={t.dashboard.harvest} value={`${Math.round(metrics.harvested)} kg`}
              action={<Badge variant="outline"><PackageCheck className="size-3.5" /></Badge>}
              footerMain={<>{fr ? 'Récolté' : 'Harvested'} <TrendingUp className="size-4" /></>} footerSub={`${Math.round(metrics.gain > 0 ? metrics.gain : 0)} kg ${fr ? 'gain net' : 'net gain'}`} />
            <Kpi description={fr ? 'Taux de survie' : 'Survival rate'} value={metrics.survivalPct != null ? `${metrics.survivalPct}%` : '—'}
              action={<Badge variant="outline"><HeartPulse className="size-3.5" /></Badge>}
              footerMain={metrics.stockedCount ? `${metrics.stockedCount.toLocaleString()} ${fr ? 'empoissonnés' : 'stocked'}` : '—'}
              footerSub={metrics.mortality ? `${metrics.mortality.toLocaleString()} ${fr ? 'mortalités' : 'mortalities'}` : (fr ? 'Aucune mortalité' : 'No mortalities')} />
          </div>

          {/* Estimated biomass + projected harvest (from latest sample) */}
          {biomass && biomass.biomassKg != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><PackageCheck className="size-4" style={{ color: 'var(--brand)' }} /> {fr ? 'Biomasse estimée & récolte projetée' : 'Estimated biomass & projected harvest'}</CardTitle>
                <CardDescription>{fr ? 'À partir du dernier échantillon de poids et du taux de survie — enregistrez un « Événement → Échantillon » pour affiner.' : 'From the latest weight sample and survival rate — log an “Event → Sampling” to refine.'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{fr ? 'Poids moyen actuel' : 'Current avg weight'}</p>
                    <p className="text-lg font-semibold tabular-nums">{Math.round(biomass.latestWeightG)} g</p>
                    <p className="text-[11px] text-muted-foreground">{fr ? 'jour' : 'day'} {biomass.latestDay}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{fr ? 'Individus survivants' : 'Surviving stock'}</p>
                    <p className="text-lg font-semibold tabular-nums">{biomass.surviving != null ? biomass.surviving.toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{fr ? 'Biomasse estimée' : 'Estimated biomass'}</p>
                    <p className="text-lg font-semibold tabular-nums" style={{ color: 'var(--brand)' }}>{biomass.biomassKg.toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{fr ? 'Récolte projetée' : 'Projected harvest'}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {biomass.projectedHarvest
                        ? (biomass.projectedHarvest.daysRemaining === 0 ? (fr ? 'prête' : 'ready') : `~${biomass.projectedHarvest.daysRemaining} ${fr ? 'j' : 'd'}`)
                        : '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{fr ? 'poids marchand' : 'to market weight'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <ChartAreaInteractive data={seriesData} config={seriesConfig}
            filename={`${(operator.name || 'operator').replace(/\s+/g, '_')}_cycle`}
            title={fr ? 'Production du cycle' : 'Cycle production'}
            description={fr ? 'Choisissez les indicateurs à afficher' : 'Choose which metrics to display'} />

          <GrowthCurveChart speciesKey={speciesKey} logs={logs} events={events} fr={fr} cycle={cycle} />

          <div className="grid lg:grid-cols-2 gap-4">
            {metrics.fcr != null && (
              <Card><CardHeader><CardTitle>{t.dashboard.fcrGauge}</CardTitle></CardHeader>
                <CardContent><FCRInsight speciesKey={speciesKey} fcr={metrics.fcr} /></CardContent></Card>
            )}
            <WeatherAdvisory lat={operator.lat} lng={operator.lng} speciesKey={speciesKey} />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{fr ? 'Saisies du cycle' : 'Cycle logs'}</CardTitle>
              <CardAction>
                <button onClick={() => setModalOpen(true)} className="text-white px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand)' }}>
                  <Plus className="size-4" /> {t.dashboard.addLog.replace('+ ', '')}
                </button>
              </CardAction>
            </CardHeader>
            <CardContent><LogsDataTable logs={inCycleLogs} t={t} onDelete={deleteLog} /></CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{fr ? 'Événements' : 'Events'}</CardTitle>
                <CardDescription>{fr ? "Mortalité, traitements, qualité d'eau, échantillons…" : 'Mortality, treatments, water quality, sampling…'}</CardDescription>
              </div>
              <CardAction>
                <button onClick={() => setEventModalOpen(true)} className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                  <Plus className="size-4" /> {fr ? 'Événement' : 'Event'}
                </button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs value={eventTab} onValueChange={setEventTab}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">{t.map.all}</TabsTrigger>
                  {Object.entries(EVENT_META).map(([id, m]) => (
                    <TabsTrigger key={id} value={id}>{fr ? m.fr : m.en}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{fr ? 'Type' : 'Type'}</TableHead>
                      <TableHead>{fr ? 'Date' : 'Date'}</TableHead>
                      <TableHead>{fr ? 'Gravité' : 'Severity'}</TableHead>
                      <TableHead>{fr ? 'Détails' : 'Details'}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const rows = eventTab === 'all' ? events : events.filter((e) => e.type === eventTab);
                      if (rows.length === 0) {
                        return <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">{fr ? 'Aucun événement.' : 'No events.'}</TableCell></TableRow>;
                      }
                      return rows.map((e) => {
                        const meta = EVENT_META[e.type] || { Icon: Eye, fr: e.type, en: e.type };
                        const details = [...eventDetails(e, fr), e.description].filter(Boolean).join(' · ');
                        return (
                          <TableRow key={e.id}>
                            <TableCell><span className="inline-flex items-center gap-1.5 font-medium"><meta.Icon className="size-3.5 text-[#0D6B8A]" /> {fr ? meta.fr : meta.en}</span></TableCell>
                            <TableCell className="tabular-nums text-muted-foreground whitespace-nowrap">{e.event_date}</TableCell>
                            <TableCell>{e.severity ? <Badge variant="outline" className={`border-transparent ${SEVERITY_CLS[e.severity] || ''}`}>{e.severity}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-muted-foreground">{details || '—'}</TableCell>
                            <TableCell>
                              <button onClick={() => deleteEvent(e)} className="text-gray-300 hover:text-red-600" title={fr ? 'Supprimer' : 'Delete'}><Trash2 className="size-4" /></button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ description, value, action, footerMain, footerSub }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {footerMain && <div className="line-clamp-1 flex items-center gap-2 font-medium">{footerMain}</div>}
        {footerSub && <div className="text-muted-foreground">{footerSub}</div>}
      </CardFooter>
    </Card>
  );
}
