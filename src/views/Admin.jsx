'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, FileText, BarChart3, Fish, Map as MapIcon, Users, Landmark, Download } from 'lucide-react';
import { countries as institutions, dataSources } from '../data/institutions';
import { useLang } from '../context/LangContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { OperatorsDataTable } from '../components/dashboard/OperatorsDataTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const OperatorMap = dynamic(() => import('../components/OperatorMap'), {
  ssr: false, loading: () => <div className="h-full w-full bg-muted rounded animate-pulse" />,
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
  const cols = ['name', 'country', 'region', 'lat', 'lng', 'gender', 'age_range',
    'legal_status', 'species', 'systems', 'units', 'area_m2', 'water_source',
    'electricity', 'road_access', 'production_range', 'revenue_range', 'sales_channel',
    'financing', 'training_wanted', 'challenges', 'created_at'];
  const esc = (v) => `"${String(Array.isArray(v) ? v.join('|') : (v ?? '')).replace(/"/g, '""')}"`;
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

  const byCountry = {};
  for (const op of operators) byCountry[op.country] = (byCountry[op.country] || 0) + 1;

  const speciesDist = SPECIES_IDS.map(id => ({ name: SPECIES_KEY[id], value: operators.filter(o => (o.species || []).includes(id)).length })).filter(d => d.value > 0);

  const challengeTally = {};
  for (const op of operators) for (const c of op.challenges || []) challengeTally[c] = (challengeTally[c] || 0) + 1;
  const challengeDist = Object.entries(challengeTally).map(([challenge, count]) => ({ challenge, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const logsByOp = {};
  for (const l of logs) (logsByOp[l.operator_id] ||= []).push(l);
  const buckets = [{ fcr: '< 1.5', count: 0 }, { fcr: '1.5–2', count: 0 }, { fcr: '2–2.5', count: 0 }, { fcr: '2.5–3', count: 0 }, { fcr: '> 3', count: 0 }];
  for (const op of operators) {
    const f = operatorFCR(logsByOp[op.id] || []);
    if (f == null) continue;
    buckets[f < 1.5 ? 0 : f < 2 ? 1 : f < 2.5 ? 2 : f < 3 ? 3 : 4].count += 1;
  }
  const bucketColor = ['#00A878', '#00A878', '#F4A261', '#F4A261', '#ef4444'];

  function exportCSV() {
    const blob = new Blob([toCSV(filtered)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aquamap-operators-${filtered.length}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const mapMarkers = filtered.filter(o => o.lat != null && o.lng != null)
    .map(o => ({ id: o.id, lat: o.lat, lng: o.lng, label: `${o.name} — ${(o.species || []).map(s => SPECIES_KEY[s] || s).join(', ')}` }));

  const total = filtered.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const women = filtered.filter(o => ['Femme', 'Female'].includes(o.gender)).length;
  const youth = filtered.filter(o => ['18-25', '26-35'].includes(o.age_range)).length;
  const geo = filtered.filter(o => o.lat != null && o.lng != null).length;
  const totalAreaHa = filtered.reduce((s, o) => s + (Number(o.area_m2) || 0), 0) / 10000;
  const trainingWanted = filtered.filter(o => o.training_wanted === true).length;

  const fcrConfig = { count: { label: t.admin.operators, color: 'var(--brand)' } };
  const challengeConfig = { count: { label: t.admin.operators, color: 'var(--brand)' } };
  const pieConfig = Object.fromEntries(speciesDist.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]));

  const indicators = [
    { value: total, label: lang === 'fr' ? 'Opérateurs' : 'Operators' },
    { value: `${pct(women)}%`, sub: women, label: lang === 'fr' ? 'Femmes' : 'Women' },
    { value: `${pct(youth)}%`, sub: youth, label: lang === 'fr' ? 'Jeunes (18–35)' : 'Youth (18–35)' },
    { value: `${pct(geo)}%`, sub: geo, label: lang === 'fr' ? 'Géolocalisés' : 'Geo-verified' },
    { value: totalAreaHa.toFixed(1), label: lang === 'fr' ? 'Surface (ha)' : 'Area (ha)' },
    { value: `${pct(trainingWanted)}%`, sub: trainingWanted, label: lang === 'fr' ? 'Demande formation' : 'Want training' },
  ];

  return (
    <div className="@container/main max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--brand)' }}><ShieldCheck className="w-7 h-7" /> {t.admin.title}</h1>
          <p className="text-muted-foreground text-sm">{lang === 'fr' ? "Vue d'ensemble du secteur — opérateurs enregistrés" : 'Sector overview — registered operators'}</p>
        </div>
        <Button onClick={exportCSV} disabled={filtered.length === 0} className="text-white" style={{ backgroundColor: 'var(--brand-2)' }}>
          <Download className="size-4" /> {t.admin.export}
        </Button>
      </div>

      {!isSupabaseConfigured && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3"><AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}</div>
      )}

      {/* M&E indicator section cards */}
      <div className="grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-6">
        {indicators.map((m, i) => (
          <Card key={i} className="@container/card gap-1">
            <CardHeader>
              <CardDescription className="text-xs">{m.label}</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {m.value}{m.sub != null && <span className="text-sm font-normal text-muted-foreground"> ({m.sub})</span>}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        <FileText className="inline w-3.5 h-3.5 -mt-0.5" /> {lang === 'fr' ? 'Indicateurs S&E désagrégés genre / jeunesse — alignés FAO / BAD' : 'M&E indicators, gender/youth-disaggregated — FAO/AfDB-aligned'}
      </p>

      {/* Country cards: live registered + sourced figures */}
      <div className="grid md:grid-cols-3 gap-4">
        {institutions.map(c => (
          <Card key={c.name}>
            <CardHeader>
              <CardTitle className="text-lg">{c.flag} {c.name}</CardTitle>
              <CardDescription><a href={c.authority.website} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600">{c.authority.name}</a></CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{lang === 'fr' ? 'Enregistrés (AquaMap)' : 'Registered (AquaMap)'}</span><span className="font-bold" style={{ color: 'var(--brand-2)' }}>{byCountry[c.name] || 0}</span></div>
              {c.production.map((p, i) => (
                <div key={i} className="flex justify-between"><span className="text-muted-foreground text-xs">{p.source} · {p.year}</span><span className="font-semibold">{p.value}</span></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {t.admin.fcrDist}</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={fcrConfig} className="h-[220px] w-full">
              <BarChart data={buckets}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="fcr" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>{buckets.map((_, i) => <Cell key={i} fill={bucketColor[i]} />)}</Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {t.admin.challenges}</CardTitle></CardHeader>
          <CardContent>
            {challengeDist.length === 0 ? <Empty loading={loading} lang={lang} /> : (
              <ChartContainer config={challengeConfig} className="h-[220px] w-full">
                <BarChart data={challengeDist} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis dataKey="challenge" type="category" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--brand)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Species pie + map */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Fish className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {lang === 'fr' ? 'Répartition par espèce' : 'Species breakdown'}</CardTitle></CardHeader>
          <CardContent>
            {speciesDist.length === 0 ? <Empty loading={loading} lang={lang} /> : (
              <ChartContainer config={pieConfig} className="h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={speciesDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {speciesDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapIcon className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {lang === 'fr' ? 'Carte des opérateurs' : 'Operator map'} ({mapMarkers.length})</CardTitle></CardHeader>
          <CardContent><div style={{ height: '220px' }}><OperatorMap markers={mapMarkers} /></div></CardContent>
        </Card>
      </div>

      {/* Operators table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {t.admin.operators} ({filtered.length})</CardTitle>
          <CardAction className="flex gap-2 self-center">
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger size="sm" className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.filterCountry}</SelectItem>
                {institutions.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger size="sm" className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.admin.filterSpecies}</SelectItem>
                {SPECIES_IDS.map(id => <SelectItem key={id} value={id}>{SPECIES_KEY[id]}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? <Empty loading lang={lang} /> : <OperatorsDataTable operators={filtered} t={t} lang={lang} />}
        </CardContent>
      </Card>

      {/* Institutional data sources */}
      <Card style={{ backgroundColor: '#eff6ff' }} className="border-blue-100">
        <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5" style={{ color: 'var(--brand)' }} /> {lang === 'fr' ? 'Sources de données institutionnelles' : 'Institutional data sources'}</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {dataSources.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-lg px-4 py-3 hover:shadow-sm transition">
              <div className="font-medium text-sm" style={{ color: 'var(--brand)' }}>{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.desc[lang]}</div>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty({ loading, lang }) {
  return <div className="text-muted-foreground text-sm py-10 text-center">{loading ? '…' : (lang === 'fr' ? 'Aucune donnée pour le moment.' : 'No data yet.')}</div>;
}
