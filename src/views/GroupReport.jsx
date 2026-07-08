'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Printer, ChevronLeft } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ACM_GROUP_TYPES, ACM_MODELS, ACM_DEGREES, INDICATOR_CATEGORIES, dacmsIndicators, DACMS_SOURCE } from '../data/dacms';

const label = (list, id, fr) => { const x = list.find((i) => i.id === id); return x ? (fr ? x.fr : x.en) : id; };

// Print-optimized co-management report → browser "Print → Save as PDF".
// Donor/FAO-facing M&E deliverable. Screen shows a Print button; @media print
// hides all chrome (globals.css) — this page is intentionally plain.
export default function GroupReport({ groupId }) {
  const { lang } = useLang();
  const { configured } = useAuth();
  const fr = lang === 'fr';

  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (!group) { setLoading(false); return; }
    const [{ data: members }, { data: plans }, { data: meetings }, { data: incidents }, { data: assessments }] = await Promise.all([
      supabase.from('group_members').select('role, operators(name, gender, age_range)').eq('group_id', groupId),
      supabase.from('plans').select('*, plan_indicators(*)').eq('group_id', groupId),
      supabase.from('meetings').select('*').eq('group_id', groupId).order('meeting_date', { ascending: false }),
      supabase.from('incidents').select('*').eq('group_id', groupId).order('incident_date', { ascending: false }),
      supabase.from('assessments').select('criterion_id, score').eq('group_id', groupId),
    ]);
    setD({ group, members: members || [], plan: plans?.[0] || null, indicators: plans?.[0]?.plan_indicators || [], meetings: meetings || [], incidents: incidents || [], assessments: assessments || [] });
    setLoading(false);
  }, [configured, groupId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-400">{fr ? 'Chargement…' : 'Loading…'}</div>;
  if (!d) return <div className="max-w-3xl mx-auto px-6 py-12 text-sm text-gray-400">{fr ? 'Groupe introuvable.' : 'Group not found.'}</div>;

  const { group, members, plan, indicators, meetings, incidents, assessments } = d;
  const women = members.filter((m) => ['Femme', 'Female'].includes(m.operators?.gender)).length;
  const scored = assessments.length;
  const yes = assessments.filter((a) => a.score === 'yes').length;
  const partly = assessments.filter((a) => a.score === 'partly').length;
  const na = assessments.filter((a) => a.score === 'na').length;
  const applicable = scored - na;
  const compliance = applicable ? Math.round((100 * (yes + 0.5 * partly)) / applicable) : null;

  const catLabel = (id) => label(INDICATOR_CATEGORIES, id, fr);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-[15px] text-gray-800 print:py-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft className="size-4" /> {fr ? 'Retour au groupe' : 'Back to group'}</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--brand)' }}>
          <Printer className="size-4" /> {fr ? 'Imprimer / PDF' : 'Print / PDF'}
        </button>
      </div>

      <header className="border-b-2 pb-3 mb-2" style={{ borderColor: 'var(--brand)' }}>
        <p className="text-xs uppercase tracking-widest text-gray-400">AQAFRIKA · {fr ? 'Rapport de cogestion' : 'Co-management report'}</p>
        <h1 className="text-2xl font-bold text-black mt-1">{group.name}</h1>
        <p className="text-sm text-gray-500">
          {[group.region, group.country].filter(Boolean).join(', ')}
          {' · '}{[label(ACM_GROUP_TYPES, group.group_type, fr), label(ACM_MODELS, group.acm_model, fr), label(ACM_DEGREES, group.degree, fr)].filter(Boolean).join(' · ')}
        </p>
      </header>

      <H>{fr ? 'Synthèse' : 'Summary'}</H>
      <div className="grid grid-cols-3 gap-4">
        <Fact label={fr ? 'Membres liés' : 'Linked members'} value={members.length} />
        <Fact label={fr ? 'Dont femmes' : 'Of which women'} value={members.length ? `${Math.round((100 * women) / members.length)}%` : '—'} />
        <Fact label={fr ? 'Conformité DACMS' : 'DACMS compliance'} value={compliance != null ? `${compliance}%` : '—'} />
      </div>

      <H>{fr ? 'Plan de cogestion' : 'Co-management plan'}</H>
      {plan ? (
        <div className="space-y-1 text-sm">
          <p><strong>{plan.title}</strong> — {plan.status}</p>
          {plan.vision && <p className="text-gray-600">{plan.vision}</p>}
          {plan.has_agreement && <p className="text-gray-500">{fr ? 'Accord signé le' : 'Agreement signed on'} {plan.agreement_signed_on || '—'}</p>}
        </div>
      ) : <p className="text-gray-400 text-sm">{fr ? 'Aucun plan.' : 'No plan.'}</p>}

      {indicators.length > 0 && (
        <>
          <H>{fr ? 'Indicateurs' : 'Indicators'}</H>
          <table className="w-full text-sm border-collapse">
            <thead><tr className="text-left border-b"><th className="py-1">{fr ? 'Indicateur' : 'Indicator'}</th><th>{fr ? 'Catégorie' : 'Category'}</th><th className="text-right">{fr ? 'Réf.' : 'Base'}</th><th className="text-right">{fr ? 'Actuel' : 'Current'}</th><th className="text-right">{fr ? 'Cible' : 'Target'}</th></tr></thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.id} className="border-b"><td className="py-1">{i.name}</td><td>{catLabel(i.category)}</td><td className="text-right tabular-nums">{i.baseline ?? '—'}</td><td className="text-right tabular-nums">{i.current ?? '—'}</td><td className="text-right tabular-nums">{i.target ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <H>{fr ? 'Réunions' : 'Meetings'} ({meetings.length})</H>
      {meetings.length ? (
        <ul className="text-sm space-y-0.5">
          {meetings.slice(0, 12).map((m) => (
            <li key={m.id} className="flex justify-between border-b py-0.5"><span>{m.meeting_date} — {m.title || (fr ? 'Réunion' : 'Meeting')}</span><span className="text-gray-500">{m.attendees_count != null ? `${m.attendees_count} ${fr ? 'part.' : 'att.'}` : ''}</span></li>
          ))}
        </ul>
      ) : <p className="text-gray-400 text-sm">—</p>}

      <H>{fr ? 'Conflits & conformité' : 'Conflicts & compliance'} ({incidents.length})</H>
      {incidents.length ? (
        <ul className="text-sm space-y-0.5">
          {incidents.slice(0, 12).map((i) => (
            <li key={i.id} className="flex justify-between border-b py-0.5"><span>{i.incident_date} — {i.kind}{i.conflict_type ? ` (${i.conflict_type})` : ''}</span><span className="text-gray-500">{i.status}</span></li>
          ))}
        </ul>
      ) : <p className="text-gray-400 text-sm">—</p>}

      <H>{fr ? 'Auto-évaluation FAO DACMS' : 'FAO DACMS self-assessment'}</H>
      <p className="text-sm">{fr ? 'Indicateurs évalués' : 'Indicators scored'}: <strong>{scored}/{dacmsIndicators.length}</strong> · {fr ? 'Conformité' : 'Compliance'}: <strong>{compliance != null ? `${compliance}%` : '—'}</strong> <span className="text-gray-500">({fr ? 'Oui' : 'Yes'} {yes} · {fr ? 'En partie' : 'Partly'} {partly} · N/A {na})</span></p>

      <footer className="mt-10 pt-3 border-t text-xs text-gray-400">
        AQAFRIKA · aqafrica.com · {DACMS_SOURCE.citation} — {DACMS_SOURCE.url}
      </footer>
    </div>
  );
}

function H({ children }) {
  return <h2 className="text-lg font-bold text-black mt-8 mb-2 border-b pb-1">{children}</h2>;
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
