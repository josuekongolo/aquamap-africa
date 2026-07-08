'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, RefreshCw, Trash2, FileText, ScrollText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { INDICATOR_CATEGORIES } from '../../data/dacms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const STATUSES = [
  { id: 'draft',        fr: 'Brouillon',      en: 'Draft',        cls: 'bg-gray-100 text-gray-600' },
  { id: 'active',       fr: 'Actif',          en: 'Active',       cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'under_review', fr: 'En révision',    en: 'Under review', cls: 'bg-amber-100 text-amber-700' },
  { id: 'completed',    fr: 'Achevé',         en: 'Completed',    cls: 'bg-sky-100 text-sky-700' },
];
const CAT_COLOR = { social: '#8b5cf6', economic: '#F4A261', ecological: '#00A878', governance: '#0D6B8A' };

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Co-management PLAN (technical document) + optional signed AGREEMENT (legal
// document) per FAO guidebook Box 2, with SMART indicators carrying baseline /
// target / current values (Annex indicator I.2.C.5.2).
export default function PlanTab({ group, fr, user }) {
  const [plan, setPlan] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // editable copy of the plan

  const load = useCallback(async () => {
    const { data: plans } = await supabase.from('plans').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(1);
    const p = plans?.[0] || null;
    setPlan(p);
    setForm(p ? {
      title: p.title || '', status: p.status || 'draft', vision: p.vision || '',
      conflict_mechanism: p.conflict_mechanism || '', adopted_on: p.adopted_on || '', review_due: p.review_due || '',
      has_agreement: !!p.has_agreement, agreement_signed_on: p.agreement_signed_on || '',
      languages: (p.languages || []).join(', '),
    } : null);
    if (p) {
      const { data: inds } = await supabase.from('plan_indicators').select('*').eq('plan_id', p.id).order('created_at');
      setIndicators(inds || []);
    } else setIndicators([]);
    setLoading(false);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function createPlan() {
    setError('');
    const { error } = await supabase.from('plans').insert({
      group_id: group.id, created_by: user.id,
      title: fr ? `Plan de cogestion — ${group.name}` : `Co-management plan — ${group.name}`,
    });
    if (error) { setError(error.message); return; }
    load();
  }

  async function savePlan() {
    if (!plan || !form) return;
    setSaving(true); setError('');
    const { error } = await supabase.from('plans').update({
      title: form.title || plan.title,
      status: form.status,
      vision: form.vision || null,
      conflict_mechanism: form.conflict_mechanism || null,
      adopted_on: form.adopted_on || null,
      review_due: form.review_due || null,
      has_agreement: form.has_agreement,
      agreement_signed_on: form.has_agreement ? (form.agreement_signed_on || null) : null,
      languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
    }).eq('id', plan.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    load();
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <p className="text-sm text-muted-foreground pt-4">{fr ? 'Chargement…' : 'Loading…'}</p>;

  if (!plan) {
    return (
      <Card className="mt-2">
        <CardContent className="py-10 text-center text-muted-foreground">
          <FileText className="size-8 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">{fr ? 'Pas encore de plan de cogestion.' : 'No co-management plan yet.'}</p>
          <p className="text-sm max-w-md mx-auto">
            {fr
              ? 'Le plan est le document technique du groupe : vision, objectifs, indicateurs (avec référence et cible), mécanisme de gestion des conflits et calendrier de révision (FAO, guide DACMS §6.1).'
              : "The plan is the group's technical document: vision, objectives, indicators (with baseline and target), conflict-management mechanism and review timeline (FAO DACMS guidebook §6.1)."}
          </p>
          <button onClick={createPlan} className="mt-4 font-medium" style={{ color: 'var(--brand)' }}>
            + {fr ? 'Créer le plan' : 'Create the plan'}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  const statusMeta = STATUSES.find((s) => s.id === form.status) || STATUSES[0];

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" style={{ color: 'var(--brand)' }} />
              {fr ? 'Plan de cogestion' : 'Co-management plan'}
              <Badge variant="outline" className={`border-transparent ${statusMeta.cls}`}>{fr ? statusMeta.fr : statusMeta.en}</Badge>
            </CardTitle>
            <CardDescription>
              {fr ? 'Document technique — le cœur du système de cogestion.' : 'Technical document — the core of the co-management system.'}
            </CardDescription>
          </div>
          <button onClick={savePlan} disabled={saving}
            className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-60 shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}>
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />} {fr ? 'Enregistrer' : 'Save'}
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={fr ? 'Titre' : 'Title'}>
              <input className={input} value={form.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label={fr ? 'Statut' : 'Status'}>
              <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{fr ? s.fr : s.en}</option>)}
              </select>
            </Field>
            <Field label={fr ? 'Adopté le' : 'Adopted on'}>
              <input type="date" className={input} value={form.adopted_on} onChange={(e) => set('adopted_on', e.target.value)} />
            </Field>
            <Field label={fr ? 'Prochaine révision (FAO : tous les 3–5 ans)' : 'Next review (FAO: every 3–5 years)'}>
              <input type="date" className={input} value={form.review_due} onChange={(e) => set('review_due', e.target.value)} />
            </Field>
          </div>
          <Field label={fr ? 'Vision et objectifs collectifs' : 'Collective vision and objectives'}>
            <textarea className={input} rows={3} value={form.vision} onChange={(e) => set('vision', e.target.value)}
              placeholder={fr ? 'Enjeux gérés, buts stratégiques et opérationnels…' : 'Issues managed, strategic and operational goals…'} />
          </Field>
          <Field label={fr ? 'Mécanisme de gestion des conflits (indicateur FAO I.2.B.5.1)' : 'Conflict-management mechanism (FAO indicator I.2.B.5.1)'}>
            <textarea className={input} rows={2} value={form.conflict_mechanism} onChange={(e) => set('conflict_mechanism', e.target.value)}
              placeholder={fr ? 'Résolution interne, médiation, recours externe…' : 'Internal resolution, mediation, external adjudication…'} />
          </Field>
          <Field label={fr ? 'Langues du plan (indicateur FAO I.2.C.1.3 — séparer par des virgules)' : 'Plan languages (FAO indicator I.2.C.1.3 — comma-separated)'}>
            <input className={input} value={form.languages} onChange={(e) => set('languages', e.target.value)}
              placeholder={fr ? 'français, wolof, …' : 'French, Wolof, …'} />
          </Field>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t">
            <label className="flex items-center gap-2 text-sm text-gray-700 pt-3 sm:pt-0">
              <input type="checkbox" checked={form.has_agreement} onChange={(e) => set('has_agreement', e.target.checked)} />
              <ScrollText className="size-4 text-gray-400" />
              {fr ? 'Accord de cogestion signé (document juridique — FAO Box 2)' : 'Signed co-management agreement (legal document — FAO Box 2)'}
            </label>
            {form.has_agreement && (
              <input type="date" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                value={form.agreement_signed_on} onChange={(e) => set('agreement_signed_on', e.target.value)} />
            )}
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

      <IndicatorsCard plan={plan} indicators={indicators} fr={fr} user={user} onChanged={load} />
    </div>
  );
}

function IndicatorsCard({ plan, indicators, fr, user, onChanged }) {
  const [form, setForm] = useState({ name: '', category: 'economic', unit: '', baseline: '', target: '', current: '' });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function addIndicator() {
    setError('');
    if (!form.name.trim()) return;
    const { error } = await supabase.from('plan_indicators').insert({
      plan_id: plan.id, created_by: user.id, name: form.name.trim(), category: form.category,
      unit: form.unit || null, baseline: num(form.baseline), target: num(form.target), current: num(form.current),
    });
    if (error) { setError(error.message); return; }
    setForm({ name: '', category: 'economic', unit: '', baseline: '', target: '', current: '' });
    onChanged();
  }

  async function updateCurrent(id, value) {
    const { error } = await supabase.from('plan_indicators')
      .update({ current: value === '' ? null : Number(value), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) setError(error.message); else onChanged();
  }

  async function removeIndicator(id) {
    const { error } = await supabase.from('plan_indicators').delete().eq('id', id);
    if (error) setError(error.message); else onChanged();
  }

  const catLabel = (id) => { const c = INDICATOR_CATEGORIES.find((x) => x.id === id); return c ? (fr ? c.fr : c.en) : id; };
  const progress = (i) => {
    if (i.baseline == null || i.target == null || i.current == null || i.target === i.baseline) return null;
    return Math.max(0, Math.min(100, Math.round((100 * (i.current - i.baseline)) / (i.target - i.baseline))));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{fr ? 'Indicateurs SMART du plan' : 'SMART plan indicators'}</CardTitle>
        <CardDescription>
          {fr
            ? 'Référence (baseline), cible et valeur actuelle par indicateur — catégories sociales, économiques, écologiques et de gouvernance (FAO Annexe 2).'
            : 'Baseline, target and current value per indicator — social, economic, ecological and governance categories (FAO Annex 2).'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <input className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={fr ? 'Indicateur (ex : production annuelle)' : 'Indicator (e.g. annual production)'}
            value={form.name} onChange={(e) => set('name', e.target.value)} />
          <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {INDICATOR_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{fr ? c.fr : c.en}</option>)}
          </select>
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={fr ? 'Unité (t, %, FCFA…)' : 'Unit (t, %, FCFA…)'}
            value={form.unit} onChange={(e) => set('unit', e.target.value)} />
          <input type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={fr ? 'Référence' : 'Baseline'}
            value={form.baseline} onChange={(e) => set('baseline', e.target.value)} />
          <input type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={fr ? 'Cible' : 'Target'}
            value={form.target} onChange={(e) => set('target', e.target.value)} />
        </div>
        <button onClick={addIndicator} disabled={!form.name.trim()}
          className="inline-flex items-center gap-1 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}>
          <Plus className="size-4" /> {fr ? 'Ajouter l’indicateur' : 'Add indicator'}
        </button>

        {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{fr ? 'Indicateur' : 'Indicator'}</TableHead>
                <TableHead>{fr ? 'Catégorie' : 'Category'}</TableHead>
                <TableHead className="text-right">{fr ? 'Référence' : 'Baseline'}</TableHead>
                <TableHead className="text-right">{fr ? 'Actuel' : 'Current'}</TableHead>
                <TableHead className="text-right">{fr ? 'Cible' : 'Target'}</TableHead>
                <TableHead className="w-36">{fr ? 'Progrès' : 'Progress'}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  {fr ? 'Aucun indicateur défini.' : 'No indicators defined.'}
                </TableCell></TableRow>
              )}
              {indicators.map((i) => {
                const pct = progress(i);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}{i.unit ? <span className="text-muted-foreground font-normal"> ({i.unit})</span> : null}</TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ color: CAT_COLOR[i.category], borderColor: CAT_COLOR[i.category] }}>
                        {catLabel(i.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{i.baseline ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <input type="number" defaultValue={i.current ?? ''} key={`${i.id}-${i.current}`}
                        onBlur={(e) => { if (e.target.value !== String(i.current ?? '')) updateCurrent(i.id, e.target.value); }}
                        className="w-20 border border-gray-200 rounded-md px-2 py-1 text-sm text-right tabular-nums" />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{i.target ?? '—'}</TableCell>
                    <TableCell>
                      {pct == null ? <span className="text-xs text-muted-foreground">—</span> : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? 'var(--brand-2)' : 'var(--brand)' }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => removeIndicator(i.id)} className="text-gray-300 hover:text-red-600"><Trash2 className="size-4" /></button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
