'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wheat, PackageCheck, Plus, TrendingUp, AlertTriangle, Download } from 'lucide-react';
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
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { LogsDataTable } from '../components/dashboard/LogsDataTable';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const STATUS_LABEL = { excellent: 'fcrExcellent', correct: 'fcrCorrect', high: 'fcrHigh' };

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
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOperators(); }, [loadOperators]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(selectedId); }, [selectedId, loadLogs]);

  // Live updates: operator list + logs for the selected operator (RLS-scoped).
  useRealtimeTable('operators', setOperators, { enabled: configured });
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

  const chartData = [...logs]
    .sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)))
    .map(l => ({ date: l.log_date, feed: l.type === 'feed' ? Number(l.feed_kg) || 0 : 0, harvest: l.type === 'harvest' ? Number(l.kg_harvested) || 0 : 0 }));
  const chartConfig = {
    feed: { label: lang === 'fr' ? 'Aliments (kg)' : 'Feed (kg)', color: 'var(--brand)' },
    harvest: { label: lang === 'fr' ? 'Récolte (kg)' : 'Harvest (kg)', color: 'var(--brand-2)' },
  };

  return (
    <div className="@container/main max-w-7xl mx-auto px-4 py-8 space-y-6">
      {modalOpen && selected && (
        <LogModal operator={selected} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadLogs(selectedId); setFeedKey(k => k + 1); }} />
      )}
      {eventModalOpen && selected && (
        <EventModal operator={selected} onClose={() => setEventModalOpen(false)} onSaved={() => { setEventModalOpen(false); setFeedKey(k => k + 1); }} />
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
          <ChartAreaInteractive data={chartData} config={chartConfig}
            title={lang === 'fr' ? 'Aliments & récoltes' : 'Feed & harvests'}
            description={lang === 'fr' ? 'Saisies de production dans le temps' : 'Production logs over time'} />

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
              <CardAction className="flex gap-2">
                <button onClick={() => setEventModalOpen(true)} className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                  <Plus className="size-4" /> {lang === 'fr' ? 'Événement' : 'Event'}
                </button>
                <button onClick={() => setModalOpen(true)} className="text-white px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand)' }}>
                  <Plus className="size-4" /> {t.dashboard.addLog.replace('+ ', '')}
                </button>
              </CardAction>
            </CardHeader>
            <CardContent><LogsDataTable logs={logs} t={t} /></CardContent>
          </Card>

          {/* Activity journal (real-time) */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'fr' ? "Journal d'activité" : 'Activity journal'}</CardTitle>
              <CardDescription>{lang === 'fr' ? 'Mis à jour en temps réel' : 'Updates in real time'}</CardDescription>
            </CardHeader>
            <CardContent><ActivityFeed operatorId={selectedId} fr={lang === 'fr'} reloadKey={feedKey} /></CardContent>
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
