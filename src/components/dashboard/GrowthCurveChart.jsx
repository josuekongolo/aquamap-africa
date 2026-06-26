'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { speciesBenchmarks } from '../../data/species';

// Expected growth curve for the operator's species (FAO/SRAC benchmark), with the
// operator's ACTUAL sampled weights overlaid when sampling events exist.
// day 0 = earliest stocking log; actual points come from `sampling` events.
export default function GrowthCurveChart({ speciesKey, logs = [], events = [], fr }) {
  const bench = speciesBenchmarks[speciesKey];
  if (!bench) return null;

  const byDay = {};
  for (const p of bench.growthCurve) (byDay[p.day] ||= { day: p.day }).expected = p.weightG;

  const stockings = logs
    .filter((l) => l.type === 'stocking' && l.log_date)
    .sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
  const base = stockings[0];
  let hasActual = false;
  if (base) {
    const baseDate = new Date(base.log_date);
    const w0 = Number(base.avg_weight_g);
    if (w0 > 0) { (byDay[0] ||= { day: 0 }).actual = w0; hasActual = true; }
    for (const e of events) {
      if (e.type !== 'sampling') continue;
      const w = Number(e.details?.avg_weight_g);
      if (!w) continue;
      const day = Math.round((new Date(e.event_date) - baseDate) / 86400000);
      if (day < 0) continue;
      (byDay[day] ||= { day }).actual = w;
      hasActual = true;
    }
  }
  const data = Object.values(byDay).sort((a, b) => a.day - b.day);

  const config = {
    expected: { label: fr ? 'Référence (FAO/SRAC)' : 'Reference (FAO/SRAC)', color: 'var(--brand)' },
    actual: { label: fr ? 'Mesures réelles' : 'Actual samples', color: 'var(--brand-accent)' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fr ? 'Courbe de croissance' : 'Growth curve'} — {speciesKey}</CardTitle>
        <CardDescription>
          {fr ? `Poids attendu (g) par jour · ${bench.scientificName}` : `Expected weight (g) by day · ${bench.scientificName}`}
          {!hasActual && (fr ? ' · enregistrez des échantillons pour comparer' : ' · log sampling events to compare')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[250px] w-full">
          <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" type="number" tickLine={false} axisLine={false} tickMargin={8}
              domain={[0, 'dataMax']} tickFormatter={(v) => `${v}${fr ? 'j' : 'd'}`} />
            <YAxis tickLine={false} axisLine={false} width={44}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}kg` : `${v}g`)} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line dataKey="expected" type="monotone" stroke="var(--color-expected)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            {hasActual && <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
