'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe2, Users, CalendarDays, Scale, Gauge } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

// Sector-wide transparency (FAO DACMS good practice I.2.A.4 "establish
// transparent information"): anonymized aggregates shared across ALL agents via
// the community_overview() RPC — counts and sums only, never row-level data.
export default function CommunityPanel({ fr }) {
  const [data, setData] = useState(null);
  const [bench, setBench] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      const [overview, benchmark] = await Promise.all([
        supabase.rpc('community_overview'),
        supabase.rpc('species_fcr_benchmark'),
      ]);
      if (!active) return;
      if (overview.error || !overview.data) setFailed(true);
      else setData(overview.data);
      if (!benchmark.error && benchmark.data && Object.keys(benchmark.data).length) setBench(benchmark.data);
    })();
    return () => { active = false; };
  }, []);

  if (!isSupabaseConfigured || failed || !data) return null;

  const fmt = (n) => Number(n || 0).toLocaleString(fr ? 'fr-FR' : 'en-US');

  const stats = [
    { Icon: Users, label: fr ? 'Opérateurs (tous agents)' : 'Operators (all agents)', value: fmt(data.operators_total) },
    { Icon: Globe2, label: fr ? 'Groupes de cogestion' : 'Co-management groups', value: fmt(data.groups_total) },
    { Icon: CalendarDays, label: fr ? 'Réunions (12 mois)' : 'Meetings (12 mo)', value: fmt(data.meetings_12m) },
    { Icon: Scale, label: fr ? 'Conflits en cours / résolus' : 'Conflicts open / resolved', value: `${fmt(data.incidents_open)} / ${fmt(data.incidents_resolved_12m)}` },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe2 className="size-5" style={{ color: 'var(--brand)' }} />
          {fr ? 'Vue communautaire du secteur' : 'Community sector view'}
        </CardTitle>
        <CardDescription>
          {fr
            ? 'Agrégats anonymisés partagés entre tous les agents — l’information transparente est une bonne pratique FAO de cogestion (I.2.A.4). Aucune donnée individuelle n’est exposée.'
            : 'Anonymized aggregates shared across all agents — transparent information is an FAO co-management good practice (I.2.A.4). No individual data is exposed.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5"><s.Icon className="size-3.5" /> {s.label}</p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-muted-foreground">{fr ? 'Part de femmes (opératrices)' : 'Women share (operators)'}</p>
            <p className="font-semibold tabular-nums">{data.women_share != null ? `${data.women_share}%` : '—'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-muted-foreground">{fr ? 'Part de jeunes (18–35)' : 'Youth share (18–35)'}</p>
            <p className="font-semibold tabular-nums">{data.youth_share != null ? `${data.youth_share}%` : '—'}</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-muted-foreground">{fr ? 'Récolte cumulée (12 mois)' : 'Total harvest (12 mo)'}</p>
            <p className="font-semibold tabular-nums">{fmt(Math.round(data.harvest_12m_kg))} kg</p>
          </div>
        </div>

        {Array.isArray(data.countries) && data.countries.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{fr ? 'Pays' : 'Country'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Opérateurs' : 'Operators'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Femmes' : 'Women'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Groupes' : 'Groups'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.countries.map((c) => (
                  <TableRow key={c.country}>
                    <TableCell className="font-medium">{c.country}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(c.operators)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(c.women)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(c.groups)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {bench && (
          <div className="rounded-lg border">
            <div className="px-4 py-2.5 border-b flex items-center gap-2">
              <Gauge className="size-4" style={{ color: 'var(--brand)' }} />
              <span className="text-sm font-medium">{fr ? 'FCR médian du réseau par espèce' : 'Network median FCR by species'}</span>
              <span className="text-xs text-muted-foreground">{fr ? '(≥ 5 opérateurs)' : '(≥ 5 operators)'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x">
              {Object.entries(bench).map(([sp, v]) => (
                <div key={sp} className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">{sp}</p>
                  <p className="text-lg font-semibold tabular-nums">{v.median_fcr}</p>
                  <p className="text-[11px] text-muted-foreground">n={v.n}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/groups" className="inline-block text-sm font-semibold" style={{ color: 'var(--brand)' }}>
          {fr ? 'Gérer mes groupes de cogestion →' : 'Manage my co-management groups →'}
        </Link>
      </CardContent>
    </Card>
  );
}
