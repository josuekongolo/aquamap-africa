'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sprout, Wheat, PackageCheck, Skull, Pill, Droplets, Ruler, Eye, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useRealtimeTable } from '../../lib/useRealtimeTable';
import { Timeline, TimelineItem } from './Timeline';

const META = {
  stocking: { icon: Sprout, color: '#0D6B8A', fr: 'Ensemencement', en: 'Stocking' },
  feed: { icon: Wheat, color: '#00A878', fr: 'Alimentation', en: 'Feeding' },
  harvest: { icon: PackageCheck, color: '#F4A261', fr: 'Récolte', en: 'Harvest' },
  mortality: { icon: Skull, color: '#ef4444', fr: 'Mortalité', en: 'Mortality' },
  treatment: { icon: Pill, color: '#8b5cf6', fr: 'Traitement', en: 'Treatment' },
  water: { icon: Droplets, color: '#06b6d4', fr: "Qualité de l'eau", en: 'Water quality' },
  sampling: { icon: Ruler, color: '#0ea5e9', fr: 'Échantillon biomasse', en: 'Biomass sample' },
  observation: { icon: Eye, color: '#64748b', fr: 'Observation', en: 'Observation' },
  incident: { icon: AlertTriangle, color: '#ef4444', fr: 'Incident', en: 'Incident' },
};
const metaFor = (type) => META[type] || META.incident;

function logDesc(l, fr) {
  if (l.type === 'stocking') return `${l.fingerlings_count ?? '—'} ${fr ? 'alevins' : 'fingerlings'}${l.species ? ` · ${l.species}` : ''}`;
  if (l.type === 'feed') return `${l.feed_kg ?? '—'} kg ${fr ? "d'aliment" : 'feed'}`;
  if (l.type === 'harvest') return `${l.kg_harvested ?? '—'} kg ${fr ? 'récoltés' : 'harvested'}${l.kg_sold ? ` · ${l.kg_sold} kg ${fr ? 'vendus' : 'sold'}` : ''}`;
  return l.note || '';
}

export default function ActivityFeed({ operatorId, fr, reloadKey = 0 }) {
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !operatorId) { setLogs([]); setEvents([]); return; }
    const [lr, er] = await Promise.all([
      supabase.from('logs').select('*').eq('operator_id', operatorId).order('log_date', { ascending: false }).limit(40),
      supabase.from('events').select('*').eq('operator_id', operatorId).order('event_date', { ascending: false }).limit(40),
    ]);
    setLogs(lr.data || []);
    setEvents(er.data || []);
  }, [operatorId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/operator-change/save
  useEffect(() => { load(); }, [load, reloadKey]);

  const rt = { enabled: isSupabaseConfigured && !!operatorId, filter: operatorId ? `operator_id=eq.${operatorId}` : undefined };
  useRealtimeTable('logs', setLogs, rt);
  useRealtimeTable('events', setEvents, rt);

  const entries = [
    ...logs.map((l) => ({ id: `l${l.id}`, type: l.type, date: l.log_date, created_at: l.created_at, desc: logDesc(l, fr) })),
    ...events.map((e) => ({ id: `e${e.id}`, type: e.type || 'incident', date: e.event_date, created_at: e.created_at, desc: e.description || '' })),
  ].sort((a, b) => String(b.created_at || b.date).localeCompare(String(a.created_at || a.date))).slice(0, 30);

  if (!entries.length) {
    return <p className="text-sm text-gray-400 py-2">{fr ? 'Aucune activité enregistrée.' : 'No activity logged yet.'}</p>;
  }

  const fmt = (d) => { try { return new Date(d).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' }); } catch { return d; } };

  return (
    <Timeline>
      {entries.map((e, i) => {
        const m = metaFor(e.type);
        const Icon = m.icon;
        return (
          <TimelineItem key={e.id} icon={<Icon />} color={m.color} title={fr ? m.fr : m.en} time={fmt(e.date)} last={i === entries.length - 1}>
            {e.desc}
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
