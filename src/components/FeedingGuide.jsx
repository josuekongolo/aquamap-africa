'use client';

import { ExternalLink, Utensils } from 'lucide-react';
import { feedingRates, FEEDING_SOURCES } from '../data/species';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sourced FAO/SRAC feeding-rate reference for a species. Every row cites its
// source; no interpolated/invented figures (see species.js FEEDING note).
export default function FeedingGuide({ speciesKey, fr }) {
  const data = feedingRates[speciesKey];
  if (!data) return null;

  const pct = (r) => (r ? (r[0] === r[1] ? `${r[0]}%` : `${r[0]}–${r[1]}%`) : '—');
  const wt = (w) => (!w ? '—' : w[0] === 0 ? `≤ ${w[1]} g` : `${w[0]}–${w[1]} g`);
  const src = (id) => FEEDING_SOURCES[id];

  const usedSources = [...new Set([...data.rows.map((r) => r.source), data.growout?.source].filter(Boolean))];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Utensils className="size-4" style={{ color: 'var(--brand)' }} /> {fr ? 'Repères d’alimentation (FAO/SRAC)' : 'Feeding reference (FAO/SRAC)'}</CardTitle>
        <CardDescription>{fr ? 'Taux de nourrissage sourcés — les valeurs non chiffrées par la FAO sont laissées vides.' : 'Sourced feeding rates — values FAO does not quantify are left blank.'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">{fr ? 'Stade' : 'Stage'}</th>
                <th className="px-3 py-2 font-medium">{fr ? 'Poids' : 'Weight'}</th>
                <th className="px-3 py-2 font-medium text-right">{fr ? '% poids/j' : '% BW/day'}</th>
                <th className="px-3 py-2 font-medium text-right">{fr ? 'Protéines' : 'Protein'}</th>
                <th className="px-3 py-2 font-medium text-right">{fr ? 'Fois/j' : '×/day'}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2">{fr ? r.stage.fr : r.stage.en}</td>
                  <td className="px-3 py-2 text-muted-foreground">{wt(r.weightG)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{pct(r.ratePct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{pct(r.proteinPct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.freqPerDay || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.growout && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{fr ? 'Grossissement : ' : 'Grow-out: '}</span>{fr ? data.growout.fr : data.growout.en}
          </p>
        )}
        {data.note && <p className="text-xs text-amber-700">{fr ? data.note.fr : data.note.en}</p>}
        <p className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
          {fr ? 'Sources : ' : 'Sources: '}
          {usedSources.map((id) => (
            <a key={id} href={src(id).url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
              {src(id).label} <ExternalLink className="size-2.5" />
            </a>
          ))}
        </p>
      </CardContent>
    </Card>
  );
}
