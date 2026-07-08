'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, RefreshCw, Trash2, Scale, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { enqueue, notifyQueued } from '../../lib/offlineQueue';
import { CONFLICT_TYPES } from '../../data/dacms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const KINDS = [
  { id: 'conflict',  fr: 'Conflit',              en: 'Conflict',       Icon: Scale },
  { id: 'violation', fr: 'Infraction aux règles', en: 'Rule violation', Icon: ShieldAlert },
];
const STATUSES = [
  { id: 'open',      fr: 'Ouvert',    en: 'Open',      cls: 'bg-red-100 text-red-700' },
  { id: 'mediation', fr: 'Médiation', en: 'Mediation', cls: 'bg-amber-100 text-amber-700' },
  { id: 'resolved',  fr: 'Résolu',    en: 'Resolved',  cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'escalated', fr: 'Escaladé',  en: 'Escalated', cls: 'bg-purple-100 text-purple-700' },
];

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Conflict & compliance register (FAO Annex I.2.B.5 conflict mechanism;
// I.1.7/I.1.8 enforcement & graduated sanctions). Effectiveness is measured by
// incident counts and resolution — hence a structured register.
export default function IncidentsTab({ group, fr, user }) {
  const [incidents, setIncidents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    incident_date: '', kind: 'conflict', conflict_type: '', parties: '', description: '',
    status: 'open', sanction: '', resolution: '', resolved_on: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [queued, setQueued] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('incidents').select('*').eq('group_id', group.id).order('incident_date', { ascending: false });
    setIncidents(data || []);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setError('');
    if (!form.incident_date) { setError(fr ? 'La date est requise.' : 'Date is required.'); return; }
    setSaving(true);
    const payload = {
      group_id: group.id, created_by: user.id, incident_date: form.incident_date, kind: form.kind,
      conflict_type: form.kind === 'conflict' ? (form.conflict_type || null) : null,
      parties: form.parties || null, description: form.description || null, status: form.status,
      sanction: form.kind === 'violation' ? (form.sanction || null) : null,
      resolution: form.resolution || null,
      resolved_on: form.status === 'resolved' ? (form.resolved_on || new Date().toISOString().slice(0, 10)) : null,
    };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'incidents', payload });
        notifyQueued();
        setSaving(false); setFormOpen(false); setQueued(true);
        return;
      } catch { /* fall through to attempt online */ }
    }
    const { error } = await supabase.from('incidents').insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ incident_date: '', kind: 'conflict', conflict_type: '', parties: '', description: '', status: 'open', sanction: '', resolution: '', resolved_on: '' });
    setFormOpen(false);
    load();
  }

  async function updateStatus(inc, status) {
    const patch = { status };
    if (status === 'resolved' && !inc.resolved_on) patch.resolved_on = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('incidents').update(patch).eq('id', inc.id);
    if (error) setError(error.message); else load();
  }

  async function remove(id) {
    const { error } = await supabase.from('incidents').delete().eq('id', id);
    if (error) setError(error.message); else load();
  }

  const open = incidents.filter((i) => i.status !== 'resolved').length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;
  const kindLabel = (id) => { const k = KINDS.find((x) => x.id === id); return k ? (fr ? k.fr : k.en) : id; };
  const typeLabel = (id) => { const c = CONFLICT_TYPES.find((x) => x.id === id); return c ? (fr ? c.fr : c.en) : null; };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-3 gap-3">
        <Stat label={fr ? 'Total consigné' : 'Total recorded'} value={incidents.length} />
        <Stat label={fr ? 'En cours' : 'Open'} value={open} accent={open > 0 ? '#dc2626' : undefined} />
        <Stat label={fr ? 'Résolus' : 'Resolved'} value={resolved} accent="#00A878" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-lg">
          {fr
            ? 'Registre des conflits et infractions — un mécanisme documenté et fonctionnel (FAO I.2.B.5) avec sanctions graduées et proportionnelles (I.1.8).'
            : 'Register of conflicts and rule violations — a documented, functional mechanism (FAO I.2.B.5) with graduated, proportional sanctions (I.1.8).'}
        </p>
        <button onClick={() => setFormOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 shrink-0"
          style={{ backgroundColor: 'var(--brand)' }}>
          <Plus className="size-4" /> {fr ? 'Consigner' : 'Record'}
        </button>
      </div>

      {queued && (
        <div className="text-sm bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-4 py-2">
          {fr ? 'Hors ligne — l’entrée sera synchronisée à la reconnexion.' : 'Offline — the entry will sync on reconnect.'}
        </div>
      )}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

      {formOpen && (
        <Card>
          <CardHeader><CardTitle className="text-base">{fr ? 'Consigner un conflit ou une infraction' : 'Record a conflict or violation'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => set('kind', k.id)}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-sm font-medium transition ${
                    form.kind === k.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'}`}>
                  <k.Icon className="size-4" /> {fr ? k.fr : k.en}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label={fr ? 'Date *' : 'Date *'}>
                <input type="date" className={input} value={form.incident_date} onChange={(e) => set('incident_date', e.target.value)} />
              </Field>
              {form.kind === 'conflict' && (
                <Field label={fr ? 'Type de conflit' : 'Conflict type'}>
                  <select className={input} value={form.conflict_type} onChange={(e) => set('conflict_type', e.target.value)}>
                    <option value="">…</option>
                    {CONFLICT_TYPES.map((c) => <option key={c.id} value={c.id}>{fr ? c.fr : c.en}</option>)}
                  </select>
                </Field>
              )}
              <Field label={fr ? 'Parties concernées' : 'Parties involved'}>
                <input className={input} value={form.parties} onChange={(e) => set('parties', e.target.value)} />
              </Field>
              <Field label={fr ? 'Statut' : 'Status'}>
                <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s.id} value={s.id}>{fr ? s.fr : s.en}</option>)}
                </select>
              </Field>
              {form.kind === 'violation' && (
                <Field label={fr ? 'Sanction graduée appliquée' : 'Graduated sanction applied'}>
                  <input className={input} value={form.sanction} onChange={(e) => set('sanction', e.target.value)}
                    placeholder={fr ? 'Avertissement, amende…' : 'Warning, fine…'} />
                </Field>
              )}
              {form.status === 'resolved' && (
                <Field label={fr ? 'Résolu le' : 'Resolved on'}>
                  <input type="date" className={input} value={form.resolved_on} onChange={(e) => set('resolved_on', e.target.value)} />
                </Field>
              )}
            </div>
            <Field label={fr ? 'Description' : 'Description'}>
              <textarea className={input} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label={fr ? 'Résolution / suite donnée' : 'Resolution / follow-up'}>
              <textarea className={input} rows={2} value={form.resolution} onChange={(e) => set('resolution', e.target.value)} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setFormOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-60 text-sm"
                style={{ backgroundColor: 'var(--brand)' }}>
                {saving ? <RefreshCw className="size-4 animate-spin inline" /> : <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> {fr ? 'Enregistrer' : 'Save'}</span>}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{fr ? 'Type' : 'Type'}</TableHead>
              <TableHead>{fr ? 'Date' : 'Date'}</TableHead>
              <TableHead>{fr ? 'Détails' : 'Details'}</TableHead>
              <TableHead>{fr ? 'Statut' : 'Status'}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.length === 0 && (
              <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                {fr ? 'Registre vide — aucun conflit ni infraction consigné.' : 'Register empty — no conflicts or violations recorded.'}
              </TableCell></TableRow>
            )}
            {incidents.map((i) => {
              const K = KINDS.find((k) => k.id === i.kind) || KINDS[0];
              const details = [
                typeLabel(i.conflict_type),
                i.parties, i.description,
                i.sanction ? `${fr ? 'Sanction' : 'Sanction'}: ${i.sanction}` : null,
                i.resolution ? `${fr ? 'Résolution' : 'Resolution'}: ${i.resolution}` : null,
              ].filter(Boolean).join(' · ');
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <K.Icon className="size-3.5" style={{ color: 'var(--brand)' }} /> {kindLabel(i.kind)}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground whitespace-nowrap">{i.incident_date}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[320px]"><span className="line-clamp-2">{details || '—'}</span></TableCell>
                  <TableCell>
                    <select value={i.status} onChange={(e) => updateStatus(i, e.target.value)}
                      className={`text-xs rounded-full border-0 px-2 py-1 font-medium ${(STATUSES.find((s) => s.id === i.status) || STATUSES[0]).cls}`}>
                      {STATUSES.map((s) => <option key={s.id} value={s.id}>{fr ? s.fr : s.en}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => remove(i.id)} className="text-gray-300 hover:text-red-600"><Trash2 className="size-4" /></button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</p>
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
