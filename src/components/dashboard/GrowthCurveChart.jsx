'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { speciesBenchmarks } from '../../data/species';

const DAY_MS = 86400000;
const SAMPLE_EVERY_DAYS = 14; // weigh a sample every ~2 weeks (standard practice)

// Growth curve: the species FAO/SRAC reference (expected weight by day) with the
// operator's ACTUAL sampled weights for a chosen STOCKING CYCLE overlaid.
// A cycle = the period from one stocking log to the next; day 0 is the stocking
// date and its average weight. Sampling events in that window map to days-since-stocking.
export default function GrowthCurveChart({ speciesKey, logs = [], events = [], fr }) {
  const bench = speciesBenchmarks[speciesKey];

  // Build cycles from stocking logs (oldest → newest).
  const stockings = logs
    .filter((l) => l.type === 'stocking' && l.log_date)
    .sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
  const cycles = stockings.map((s, i) => ({
    id: s.id,
    start: s.log_date,
    end: stockings[i + 1]?.log_date || null, // exclusive upper bound
    w0: Number(s.avg_weight_g) || null,
  }));

  const [cycleId, setCycleId] = useState(null);
  const [now] = useState(() => Date.now()); // captured at mount for the "next weigh-in" estimate
  const cycle = cycles.find((c) => c.id === cycleId) || cycles[cycles.length - 1] || null;

  if (!bench) return null;

  // Merge reference + actual onto a shared day axis.
  const byDay = {};
  let maxDay = bench.growthCurve.reduce((m, p) => Math.max(m, p.day), 0);
  for (const p of bench.growthCurve) (byDay[p.day] ||= { day: p.day }).expected = p.weightG;

  const samples = [];
  if (cycle) {
    const startTs = new Date(cycle.start).getTime();
    const endTs = cycle.end ? new Date(cycle.end).getTime() : Infinity;
    if (cycle.w0 > 0) { (byDay[0] ||= { day: 0 }).actual = cycle.w0; samples.push({ day: 0, ts: startTs }); }
    for (const e of events) {
      if (e.type !== 'sampling') continue;
      const w = Number(e.details?.avg_weight_g);
      if (!w) continue;
      const ts = new Date(e.event_date).getTime();
      if (ts < startTs || ts >= endTs) continue; // only this cycle's samples
      const day = Math.round((ts - startTs) / DAY_MS);
      if (day < 0) continue;
      (byDay[day] ||= { day }).actual = w;
      samples.push({ day, ts });
      if (day > maxDay) maxDay = day;
    }
  }
  const hasActual = samples.length > 0;
  const data = Object.values(byDay).filter((d) => d.day <= maxDay).sort((a, b) => a.day - b.day);

  // Sampling cadence guidance for this cycle.
  const lastSample = samples.length ? samples.reduce((a, b) => (b.ts > a.ts ? b : a)) : null;
  const nextDueInDays = lastSample ? Math.round((lastSample.ts + SAMPLE_EVERY_DAYS * DAY_MS - now) / DAY_MS) : null;

  const config = {
    expected: { label: fr ? 'Référence (FAO/SRAC)' : 'Reference (FAO/SRAC)', color: 'var(--brand)' },
    actual: { label: fr ? 'Mes mesures' : 'My samples', color: 'var(--brand-accent)' },
  };

  const fmtDay = (v) => `${v}${fr ? 'j' : 'd'}`;
  const fmtWt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}kg` : `${v}g`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fr ? 'Courbe de croissance' : 'Growth curve'} — {speciesKey}</CardTitle>
        <CardDescription>{fr ? `Poids attendu (g) par jour · ${bench.scientificName}` : `Expected weight (g) by day · ${bench.scientificName}`}</CardDescription>
        {cycles.length > 1 && (
          <CardAction>
            <Select value={cycle?.id || ''} onValueChange={setCycleId}>
              <SelectTrigger size="sm" className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cycles.map((c, i) => (
                  <SelectItem key={c.id} value={c.id}>
                    {fr ? 'Cycle' : 'Cycle'} {i + 1} · {c.start}{c.w0 ? ` · ${c.w0}g` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" type="number" tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'dataMax']} tickFormatter={fmtDay} />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={fmtWt} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={fmtDay} />} />
            <Line dataKey="expected" type="monotone" stroke="var(--color-expected)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            {hasActual && <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />}
          </LineChart>
        </ChartContainer>

        {/* Sampling guidance + status */}
        <div className="text-xs text-muted-foreground rounded-lg bg-muted/60 px-3 py-2 leading-relaxed">
          {fr
            ? 'Conseil : pesez un échantillon (~20–30 poissons) toutes les 2 semaines, et enregistrez-le via « Événement → Échantillon » — le jour 0 et son poids viennent du log d’empoissonnement.'
            : 'Tip: weigh a sample (~20–30 fish) every 2 weeks and log it via “Event → Sampling” — day 0 and its weight come from the stocking log.'}
          {!cycle && <> {fr ? "Enregistrez un empoissonnement pour ancrer vos données." : 'Log a stocking to anchor your data.'}</>}
          {cycle && !hasActual && <> {fr ? "Aucune mesure pour ce cycle encore." : 'No samples for this cycle yet.'}</>}
          {nextDueInDays != null && (
            <> {nextDueInDays > 0
              ? (fr ? `Prochaine pesée dans ~${nextDueInDays} j.` : `Next weigh-in in ~${nextDueInDays} d.`)
              : (fr ? `Pesée recommandée maintenant (dernière il y a ${-nextDueInDays + SAMPLE_EVERY_DAYS} j).` : `Weigh-in due now (last was ${-nextDueInDays + SAMPLE_EVERY_DAYS} d ago).`)}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
