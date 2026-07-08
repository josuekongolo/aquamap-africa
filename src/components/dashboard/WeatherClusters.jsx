'use client';

import { useState, useEffect } from 'react';
import { Thermometer, CloudSun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Region-level heat advisory: one Open-Meteo call per region cluster (not per
// operator), flagging regions where the current temperature stresses fish
// (>33°C → tilapia/most warm-water species). Keeps the portfolio actionable
// without N weather calls.
const HEAT_C = 33;

export default function WeatherClusters({ operators, fr }) {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    // Group operators with coords by region; take one representative point each.
    const byRegion = {};
    for (const o of operators) {
      if (o.lat == null || o.lng == null) continue;
      const key = o.region || o.country || '—';
      (byRegion[key] ||= { region: key, lat: o.lat, lng: o.lng, count: 0 }).count += 1;
    }
    const regions = Object.values(byRegion);
    if (!regions.length) return undefined;

    let active = true;
    (async () => {
      const results = await Promise.all(regions.map(async (r) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lng}&current=temperature_2m`);
          const json = await res.json();
          return { ...r, temp: json?.current?.temperature_2m ?? null };
        } catch { return { ...r, temp: null }; }
      }));
      if (active) setClusters(results.filter((r) => r.temp != null && r.temp >= HEAT_C).sort((a, b) => b.temp - a.temp));
    })();
    return () => { active = false; };
  }, [operators]);

  if (!clusters.length) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-800"><Thermometer className="size-4" /> {fr ? 'Alerte chaleur par région' : 'Regional heat alert'}</CardTitle>
        <CardDescription>{fr ? `Température ≥ ${HEAT_C}°C — surveillez l’oxygène dissous et réduisez le nourrissage.` : `Temperature ≥ ${HEAT_C}°C — watch dissolved oxygen and reduce feeding.`}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {clusters.map((c) => (
            <div key={c.region} className="inline-flex items-center gap-2 rounded-full bg-white border border-amber-200 px-3 py-1.5 text-sm">
              <CloudSun className="size-4 text-amber-500" />
              <span className="font-medium">{c.region}</span>
              <span className="tabular-nums text-amber-700">{Math.round(c.temp)}°C</span>
              <span className="text-xs text-muted-foreground">· {c.count} {fr ? 'opér.' : 'ops'}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
