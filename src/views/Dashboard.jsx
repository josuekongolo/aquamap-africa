'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wheat, PackageCheck, Plus, TrendingUp, AlertTriangle, Download, Skull, Pill, Droplets, Ruler, Eye } from 'lucide-react';
import { rateFCR } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { toast } from 'sonner';
import FCRTool from '../components/FCRTool';
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

// Human-readable detail chips from an event's structured `details` JSON.
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
function computeMetrics(logs) {
  let feed = 0, harvested = 0, stocked = 0;
  for (const l of logs) {
    if (l.type === 'feed') feed += Number(l.feed_kg) || 0;
    else if (l.type === 'harvest') harvested += Number(l.kg_harvested) || 0;
    else if (l.type === 'stocking') stocked += ((Number(l.fingerlings_count) || 0) * (Number(l.avg_weight_g) || 0)) / 1000;
  }
  const gain = harvested - stocked;
  return { feed, harvested, stocked, gain, fcr: feed > 0 && gain > 0 ? feed / gain : null };
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user, agent, configured } = useAuth();

  const [operators, setOperators] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTab, setEventTab] = useState('all');
  const [error, setError] = useState('');

  const selected = operators.find(o => o.id === selectedId) || null;

  const exportCsv = useCallback(() => {
    if (!selected) return;
    const cols = ['log_date', 'type', 'species', 'feed_kg', 'fingerlings_count', 'avg_weight_g', 'kg_harvested', 'kg_sold', 'price_per_kg', 'note'];
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [cols.join(','), ...logs.map(l => cols.map(c => esc(l[c])).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(selected.name || 'operator').replace(/\s+/g, '_')}_logs.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [logs, selected]);

  const loadOperators = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('operators').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else { setOperators(data || []); setSelectedId(prev => prev || data?.[0]?.id || null); }
    setLoading(false);
  }, [configured]);

  const loadLogs = useCallback(async (operatorId) => {
    if (!configured || !operatorId) return;
    const { data } = await supabase.from('logs').select('*').eq('operator_id', operatorId).order('log_date', { ascending: false });
    setLogs(data || []);
  }, [configured]);

  const loadEvents = useCallback(async (operatorId) => {
    if (!configured || !operatorId) return;
    const { data } = await supabase.from('events').select('*').eq('operator_id', operatorId).order('event_date', { ascending: false });
    setEvents(data || []);
  }, [configured]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOperators(); }, [loadOperators]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(selectedId); }, [selectedId, loadLogs]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEvents(selectedId); }, [selectedId, loadEvents]);

  // Live updates: operator list + logs + events for the selected operator (RLS-scoped).
  useRealtimeTable('operators', setOperators, { enabled: configured });
  useRealtimeTable('events', setEvents, {
    enabled: configured && !!selectedId,
    filter: selectedId ? `operator_id=eq.${selectedId}` : undefined,
  });
  useRealtimeTable('logs', setLogs, {
    enabled: configured && !!selectedId,
    filter: selectedId ? `operator_id=eq.${selectedId}` : undefined,
    onEvent: ({ eventType, new: row }) => {
      if (eventType !== 'INSERT' || row?.type !== 'harvest') return;
      const m = computeMetrics([row, ...logs]);
      if (m.fcr == null) return;
      const r = rateFCR(primarySpeciesKey(selected), m.fcr);
      if (r?.status === 'high') {
        toast.warning(`${selected?.name || ''} — FCR ${m.fcr.toFixed(2)}`, {
          description: lang === 'fr' ? 'Au-dessus de la plage optimale' : 'Above optimal range',
        });
      }
    },
  });

  const metrics = computeMetrics(logs);
  const speciesKey = primarySpeciesKey(selected);
  const rating = metrics.fcr != null ? rateFCR(speciesKey, metrics.fcr) : null;

  const fr = lang === 'fr';
  // Aggregate logs by date into a real production time series (sum per day).
  const seriesData = (() => {
    const byDate = {};
    for (const l of logs) {
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

  return (
    <div className="@container/main max-w-7xl mx-auto px-4 py-8 space-y-6">
      {modalOpen && selected && (
        <LogModal operator={selected} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadLogs(selectedId); }} />
      )}
      {eventModalOpen && selected && (
        <EventModal operator={selected} onClose={() => setEventModalOpen(false)} onSaved={() => { setEventModalOpen(false); loadEvents(selectedId); }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-black">{t.dashboard.welcome} {agent?.full_name || user?.email}</h1>
          {agent?.organization && <p className="text-muted-foreground text-sm">{agent.organization}</p>}
        </div>
        <div className="flex items-center gap-2">
          {operators.length > 0 && (
            <Select value={selectedId || ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder={t.dashboard.myOperators} /></SelectTrigger>
              <SelectContent>{operators.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {selected && logs.length > 0 && (
            <button onClick={exportCsv} className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
              <Download className="size-4" /> CSV
            </button>
          )}
          <Link href="/register" className="text-white px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand)' }}>
            <Plus className="size-4" /> <span className="hidden sm:inline">{t.dashboard.registerFirst.replace('+ ', '')}</span>
          </Link>
        </div>
      </div>

      {!configured && <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3"><AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}</div>}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}
      {configured && !loading && operators.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">{t.dashboard.noOperators}
          <Link href="/register" className="block mt-3 font-medium" style={{ color: 'var(--brand)' }}>{t.dashboard.registerFirst}</Link></CardContent></Card>
      )}

      {selected && (
        <>
          {/* Section cards */}
          <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Kpi description={t.dashboard.fcr} value={metrics.fcr != null ? metrics.fcr.toFixed(2) : '—'}
              action={rating && <Badge variant="outline" style={{ color: rating.color, borderColor: rating.color }}>{t.dashboard[STATUS_LABEL[rating.status]]}</Badge>}
              footerMain={<>{speciesKey} <SpeciesIcon name={speciesKey} className="size-4" /></>} footerSub={lang === 'fr' ? 'Référence FAO / SRAC' : 'FAO / SRAC baseline'} />
            <Kpi description={t.dashboard.feedKg} value={`${Math.round(metrics.feed)} kg`}
              action={<Badge variant="outline"><Wheat className="size-3.5" /></Badge>}
              footerMain={lang === 'fr' ? 'Total saisi' : 'Total logged'} footerSub={lang === 'fr' ? 'Aliments distribués' : 'Feed distributed'} />
            <Kpi description={t.dashboard.harvest} value={`${Math.round(metrics.harvested)} kg`}
              action={<Badge variant="outline"><PackageCheck className="size-3.5" /></Badge>}
              footerMain={<>{lang === 'fr' ? 'Biomasse récoltée' : 'Harvested biomass'} <TrendingUp className="size-4" /></>} footerSub={`${Math.round(metrics.gain > 0 ? metrics.gain : 0)} kg ${lang === 'fr' ? 'gain net' : 'net gain'}`} />
            <Kpi description={t.dashboard.species} value={speciesKey}
              action={<Badge variant="outline"><SpeciesIcon name={speciesKey} className="size-3.5" /></Badge>}
              footerMain={selected.region || '—'} footerSub={selected.country || ''} />
          </div>

          {/* Interactive chart */}
          <ChartAreaInteractive data={seriesData} config={seriesConfig}
            filename={`${(selected.name || 'operator').replace(/\s+/g, '_')}_production`}
            title={lang === 'fr' ? 'Production dans le temps' : 'Production over time'}
            description={lang === 'fr' ? 'Choisissez les indicateurs à afficher' : 'Choose which metrics to display'} />

          {/* Species growth curve (benchmark + actual samples) */}
          <GrowthCurveChart speciesKey={speciesKey} logs={logs} events={events} fr={fr} />

          {/* FCR insight + weather */}
          <div className="grid lg:grid-cols-2 gap-4">
            {metrics.fcr != null && (
              <Card><CardHeader><CardTitle>{t.dashboard.fcrGauge}</CardTitle></CardHeader>
                <CardContent><FCRInsight speciesKey={speciesKey} fcr={metrics.fcr} /></CardContent></Card>
            )}
            <WeatherAdvisory lat={selected.lat} lng={selected.lng} speciesKey={speciesKey} />
          </div>

          {/* Logs data table */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{selected.name}</CardTitle>
              <CardAction>
                <button onClick={() => setModalOpen(true)} className="text-white px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand)' }}>
                  <Plus className="size-4" /> {t.dashboard.addLog.replace('+ ', '')}
                </button>
              </CardAction>
            </CardHeader>
            <CardContent><LogsDataTable logs={logs} t={t} /></CardContent>
          </Card>

          {/* Events (mortality, treatment, water quality, sampling, observation) */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const rows = eventTab === 'all' ? events : events.filter((e) => e.type === eventTab);
                      if (rows.length === 0) {
                        return <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">{fr ? 'Aucun événement.' : 'No events.'}</TableCell></TableRow>;
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

      <FCRTool defaultSpecies={selected ? speciesKey : 'Tilapia'} key={lang} />
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
