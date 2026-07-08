'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ClipboardCheck, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dacmsSections, dacmsIndicators, DACMS_SCORES, DACMS_SOURCE } from '../../data/dacms';
import { Card, CardContent } from '@/components/ui/card';

const SCORE_LABELS = {
  yes:    { fr: 'Oui',            en: 'Yes' },
  partly: { fr: 'En partie',      en: 'Partly' },
  no:     { fr: 'Non',            en: 'No' },
  na:     { fr: 'Non applicable', en: 'N/A' },
};

// DACMS self-assessment — the FAO Annex 1 sheet as an interactive checklist.
// One score (yes / partly / no / n.a.) per indicator, stored per group.
export default function AssessmentTab({ group, fr, user }) {
  const [scores, setScores] = useState({}); // criterion_id -> { score, comment }
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('assessments').select('criterion_id, score, comment').eq('group_id', group.id);
    const map = {};
    for (const a of data || []) map[a.criterion_id] = { score: a.score, comment: a.comment };
    setScores(map);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function setScore(criterionId, score) {
    const prev = scores[criterionId];
    // Toggle off when re-clicking the same score.
    if (prev?.score === score) {
      setScores((s) => { const n = { ...s }; delete n[criterionId]; return n; });
      const { error } = await supabase.from('assessments').delete().eq('group_id', group.id).eq('criterion_id', criterionId);
      if (error) { setError(error.message); load(); }
      return;
    }
    setScores((s) => ({ ...s, [criterionId]: { ...prev, score } }));
    const { error } = await supabase.from('assessments').upsert({
      group_id: group.id, created_by: user.id, criterion_id: criterionId, score,
      assessed_on: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'group_id,criterion_id' });
    if (error) { setError(error.message); load(); }
  }

  const total = dacmsIndicators.length;
  const scored = Object.keys(scores).length;
  const applicable = Object.values(scores).filter((s) => s.score !== 'na');
  const yes = applicable.filter((s) => s.score === 'yes').length;
  const partly = applicable.filter((s) => s.score === 'partly').length;
  // Half credit for "partly", per common use of the Yes/Partly/No scale.
  const compliance = applicable.length ? Math.round((100 * (yes + 0.5 * partly)) / applicable.length) : null;

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <ClipboardCheck className="size-8 shrink-0" style={{ color: 'var(--brand)' }} />
            <div>
              <p className="font-semibold text-sm">
                {fr ? 'Auto-évaluation FAO du système de cogestion' : 'FAO self-assessment of the co-management system'}
              </p>
              <p className="text-xs text-muted-foreground">
                {fr
                  ? 'Fiche officielle d’évaluation (Annexe 1 du guide DACMS) — notez chaque indicateur : Oui / En partie / Non / N.A.'
                  : 'Official assessment sheet (DACMS guidebook Annex 1) — score each indicator: Yes / Partly / No / N.A.'}
                {' '}
                <a href={DACMS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
                  {fr ? 'Source' : 'Source'} <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums">{scored}<span className="text-sm text-muted-foreground font-normal">/{total}</span></p>
              <p className="text-[11px] text-muted-foreground">{fr ? 'évalués' : 'scored'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums" style={{ color: compliance != null && compliance >= 60 ? 'var(--brand-2)' : undefined }}>
                {compliance != null ? `${compliance}%` : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">{fr ? 'conformité' : 'compliance'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

      {dacmsSections.map((section) => (
        <SectionBlock key={section.id} section={section} fr={fr} scores={scores} onScore={setScore} />
      ))}

      <p className="text-xs text-muted-foreground">
        {DACMS_SOURCE.citation} — <a href={DACMS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline">{DACMS_SOURCE.url}</a>
      </p>
    </div>
  );
}

function SectionBlock({ section, fr, scores, onScore }) {
  const [open, setOpen] = useState(false);
  const ids = section.practices.flatMap((p) => p.indicators.map((i) => i.id));
  const scored = ids.filter((id) => scores[id]).length;
  return (
    <Card>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-3 text-left">
        <div>
          <p className="font-semibold text-sm">
            <span className="font-mono2 text-xs text-gray-400 mr-2">{section.id}</span>
            {fr ? section.title.fr : section.title.en}
          </p>
        </div>
        <span className="flex items-center gap-3 shrink-0">
          <span className="text-xs tabular-nums text-muted-foreground">{scored}/{ids.length}</span>
          <ChevronDown className={`size-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <CardContent className="pt-0 space-y-4">
          {section.practices.map((p) => (
            <div key={p.id} className="border-t pt-3">
              <p className="text-sm font-medium text-gray-800 mb-2">
                <span className="font-mono2 text-xs text-gray-400 mr-2">{p.id}</span>
                {fr ? p.title.fr : p.title.en}
              </p>
              <div className="space-y-2.5">
                {p.indicators.map((ind) => {
                  const current = scores[ind.id]?.score;
                  return (
                    <div key={ind.id} className="flex flex-col sm:flex-row sm:items-center gap-2 pl-2 border-l-2" style={{ borderColor: current ? (DACMS_SCORES.find((s) => s.id === current)?.color || '#e5e7eb') : '#e5e7eb' }}>
                      <p className="flex-1 text-sm text-gray-600">{fr ? ind.text.fr : ind.text.en}</p>
                      <div className="flex gap-1 shrink-0">
                        {DACMS_SCORES.map((s) => {
                          const active = current === s.id;
                          return (
                            <button key={s.id} onClick={() => onScore(ind.id, s.id)}
                              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${active ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                              style={active ? { backgroundColor: s.color } : undefined}>
                              {fr ? SCORE_LABELS[s.id].fr : SCORE_LABELS[s.id].en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
