'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wheat, PackageCheck, Fish, AlertTriangle, Plus } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { rateFCR } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import FCRTool from '../components/FCRTool';
import LogModal from '../components/LogModal';
import WeatherAdvisory from '../components/WeatherAdvisory';
import FCRInsight from '../components/FCRInsight';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
  const [error, setError] = useState('');

  const selected = operators.find(o => o.id === selectedId) || null;

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

  const metrics = computeMetrics(logs);
  const speciesKey = primarySpeciesKey(selected);
  const rating = metrics.fcr != null ? rateFCR(speciesKey, metrics.fcr) : null;
  const agentName = agent?.full_name || user?.email || '';

  const chartData = [...logs]
    .sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)))
    .map(l => ({
      date: l.log_date,
      feed: l.type === 'feed' ? Number(l.feed_kg) || 0 : 0,
      harvest: l.type === 'harvest' ? Number(l.kg_harvested) || 0 : 0,
    }));
  const chartConfig = {
    feed: { label: lang === 'fr' ? 'Aliments (kg)' : 'Feed (kg)', color: 'var(--brand)' },
    harvest: { label: lang === 'fr' ? 'Récolte (kg)' : 'Harvest (kg)', color: 'var(--brand-2)' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {modalOpen && selected && (
        <LogModal operator={selected} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadLogs(selectedId); }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--brand)' }}>{t.dashboard.welcome} {agentName}</h1>
          {agent?.organization && <p className="text-muted-foreground text-sm">{agent.organization}</p>}
        </div>
        <div className="flex items-center gap-3">
          {operators.length > 0 && (
            <Select value={selectedId || ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[240px]"><SelectValue placeholder={t.dashboard.myOperators} /></SelectTrigger>
              <SelectContent>
                {operators.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Link href="/register" className="text-white px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90" style={{ backgroundColor: 'var(--brand-accent)' }}>
            {t.dashboard.registerFirst}
          </Link>
        </div>
      </div>

      {!configured && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      )}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      {configured && !loading && operators.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {t.dashboard.noOperators}
          <Link href="/register" className="block mt-3 font-medium" style={{ color: 'var(--brand)' }}>{t.dashboard.registerFirst}</Link>
        </CardContent></Card>
      )}

      {selected && (
        <>
          {/* Section cards (shadcn dashboard-01 style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label={t.dashboard.fcr} value={metrics.fcr != null ? metrics.fcr.toFixed(2) : '—'}
              action={rating && <Badge variant="outline" style={{ color: rating.color, borderColor: rating.color }}>{t.dashboard[STATUS_LABEL[rating.status]]}</Badge>}
              footer={`${speciesKey} · ${lang === 'fr' ? 'réf. FAO/SRAC' : 'FAO/SRAC ref.'}`} />
            <Kpi label={t.dashboard.feedKg} value={`${Math.round(metrics.feed)} kg`} icon={<Wheat className="w-4 h-4" />} footer={lang === 'fr' ? 'Total saisi' : 'Total logged'} />
            <Kpi label={t.dashboard.harvest} value={`${Math.round(metrics.harvested)} kg`} icon={<PackageCheck className="w-4 h-4" />} footer={lang === 'fr' ? 'Biomasse récoltée' : 'Harvested biomass'} />
            <Kpi label={t.dashboard.species} value={speciesKey} icon={<SpeciesIcon name={speciesKey} className="w-4 h-4" />}
              footer={`${selected.region || ''}${selected.region && selected.country ? ', ' : ''}${selected.country || ''}`} />
          </div>

          {/* Interactive chart */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === 'fr' ? 'Aliments & récoltes' : 'Feed & harvests'}</CardTitle>
              <CardDescription>{lang === 'fr' ? "Saisies de production dans le temps" : 'Production logs over time'}</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">{t.dashboard.noLogs}</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                    <defs>
                      <linearGradient id="fillFeed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-feed)" stopOpacity={0.6} /><stop offset="95%" stopColor="var(--color-feed)" stopOpacity={0.05} /></linearGradient>
                      <linearGradient id="fillHarvest" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-harvest)" stopOpacity={0.6} /><stop offset="95%" stopColor="var(--color-harvest)" stopOpacity={0.05} /></linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area dataKey="feed" type="natural" fill="url(#fillFeed)" stroke="var(--color-feed)" />
                    <Area dataKey="harvest" type="natural" fill="url(#fillHarvest)" stroke="var(--color-harvest)" />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

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
                <button onClick={() => setModalOpen(true)} className="text-white px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 inline-flex items-center gap-1" style={{ backgroundColor: 'var(--brand-2)' }}>
                  <Plus className="w-4 h-4" /> {t.dashboard.addLog.replace('+ ', '')}
                </button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">{t.map.all}</TabsTrigger>
                  <TabsTrigger value="stocking">{t.dashboard.stocking}</TabsTrigger>
                  <TabsTrigger value="feed">{t.dashboard.feeding}</TabsTrigger>
                  <TabsTrigger value="harvest">{t.dashboard.harvest}</TabsTrigger>
                </TabsList>
                {['all', 'stocking', 'feed', 'harvest'].map(tab => (
                  <TabsContent key={tab} value={tab}>
                    <LogsTable logs={tab === 'all' ? logs : logs.filter(l => l.type === tab)} t={t} emptyLabel={t.dashboard.noLogs} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <FCRTool defaultSpecies={selected ? speciesKey : 'Tilapia'} key={lang} />
    </div>
  );
}

function Kpi({ label, value, action, icon, footer }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">{icon}{label}</CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">{value}</CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {footer && <CardFooter className="text-xs text-muted-foreground">{footer}</CardFooter>}
    </Card>
  );
}

function LogsTable({ logs, t, emptyLabel }) {
  const typeLabel = { feed: t.dashboard.feeding, harvest: t.dashboard.harvest, stocking: t.dashboard.stocking };
  if (!logs.length) return <p className="text-muted-foreground text-sm py-6 text-center">{emptyLabel}</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.dashboard.date}</TableHead>
          <TableHead>{t.dashboard.logType}</TableHead>
          <TableHead>{t.dashboard.species}</TableHead>
          <TableHead className="text-right">kg / qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map(l => (
          <TableRow key={l.id}>
            <TableCell className="text-muted-foreground">{l.log_date}</TableCell>
            <TableCell><Badge variant="secondary">{typeLabel[l.type]}</Badge></TableCell>
            <TableCell>{l.species || '—'}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {l.type === 'feed' && `${l.feed_kg} kg`}
              {l.type === 'harvest' && `${l.kg_harvested} kg`}
              {l.type === 'stocking' && `${l.fingerlings_count ?? '—'} × ${l.avg_weight_g ?? '—'} g`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
