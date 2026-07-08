'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, RefreshCw, Trash2, CalendarDays, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { enqueue, notifyQueued } from '../../lib/offlineQueue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Regular participatory meetings + minutes (FAO Annex I.2.C.3 / I.2.A.4;
// minutes available to all participants per I.2.B.6.1; women attendance
// tracked for indicator I.2.C.3.2).
export default function MeetingsTab({ group, fr, user }) {
  const [meetings, setMeetings] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ meeting_date: '', title: '', attendees_count: '', women_count: '', minutes: '', decisions: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [queued, setQueued] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('meetings').select('*').eq('group_id', group.id).order('meeting_date', { ascending: false });
    setMeetings(data || []);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function save() {
    setError('');
    if (!form.meeting_date) { setError(fr ? 'La date est requise.' : 'Date is required.'); return; }
    setSaving(true);
    const payload = {
      group_id: group.id, created_by: user.id, meeting_date: form.meeting_date,
      title: form.title || null, attendees_count: num(form.attendees_count), women_count: num(form.women_count),
      minutes: form.minutes || null, decisions: form.decisions || null,
    };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'meetings', payload });
        notifyQueued();
        setSaving(false); setFormOpen(false); setQueued(true);
        return;
      } catch { /* fall through to attempt online */ }
    }
    const { error } = await supabase.from('meetings').insert(payload);
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ meeting_date: '', title: '', attendees_count: '', women_count: '', minutes: '', decisions: '' });
    setFormOpen(false);
    load();
  }

  async function remove(id) {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) setError(error.message); else load();
  }

  const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const last12m = meetings.filter((m) => new Date(m.meeting_date) >= oneYearAgo);
  const totAtt = meetings.reduce((s, m) => s + (m.attendees_count || 0), 0);
  const totWomen = meetings.reduce((s, m) => s + (m.women_count || 0), 0);
  const womenPct = totAtt > 0 ? Math.round((100 * totWomen) / totAtt) : null;

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-3 gap-3">
        <Stat label={fr ? 'Réunions (total)' : 'Meetings (total)'} value={meetings.length} />
        <Stat label={fr ? '12 derniers mois' : 'Last 12 months'} value={last12m.length} />
        <Stat label={fr ? 'Participation féminine' : 'Women attendance'} value={womenPct != null ? `${womenPct}%` : '—'} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-lg">
          {fr
            ? 'Des réunions régulières et participatives, avec procès-verbaux accessibles à tous, sont une bonne pratique centrale du cadre FAO (I.2.C.3, I.2.B.6.1).'
            : 'Regular participatory meetings, with minutes available to all, are a core good practice of the FAO framework (I.2.C.3, I.2.B.6.1).'}
        </p>
        <button onClick={() => setFormOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 shrink-0"
          style={{ backgroundColor: 'var(--brand)' }}>
          <Plus className="size-4" /> {fr ? 'Réunion' : 'Meeting'}
        </button>
      </div>

      {queued && (
        <div className="text-sm bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-4 py-2">
          {fr ? 'Hors ligne — la réunion sera synchronisée à la reconnexion.' : 'Offline — the meeting will sync on reconnect.'}
        </div>
      )}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

      {formOpen && (
        <Card>
          <CardHeader><CardTitle className="text-base">{fr ? 'Consigner une réunion' : 'Record a meeting'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label={fr ? 'Date *' : 'Date *'}>
                <input type="date" className={input} value={form.meeting_date} onChange={(e) => set('meeting_date', e.target.value)} />
              </Field>
              <Field label={fr ? 'Objet' : 'Title'}>
                <input className={input} value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder={fr ? 'Assemblée générale, comité…' : 'General assembly, committee…'} />
              </Field>
              <Field label={fr ? 'Participants' : 'Attendees'}>
                <input type="number" min="0" className={input} value={form.attendees_count} onChange={(e) => set('attendees_count', e.target.value)} />
              </Field>
              <Field label={fr ? 'Dont femmes' : 'Of which women'}>
                <input type="number" min="0" className={input} value={form.women_count} onChange={(e) => set('women_count', e.target.value)} />
              </Field>
            </div>
            <Field label={fr ? 'Procès-verbal (compte rendu)' : 'Minutes'}>
              <textarea className={input} rows={3} value={form.minutes} onChange={(e) => set('minutes', e.target.value)} />
            </Field>
            <Field label={fr ? 'Décisions prises' : 'Decisions taken'}>
              <textarea className={input} rows={2} value={form.decisions} onChange={(e) => set('decisions', e.target.value)} />
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

      <div className="space-y-2">
        {meetings.length === 0 && !formOpen && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <CalendarDays className="size-8 mx-auto mb-2 text-gray-300" />
            {fr ? 'Aucune réunion consignée.' : 'No meetings recorded.'}
          </CardContent></Card>
        )}
        {meetings.map((m) => <MeetingRow key={m.id} m={m} fr={fr} onDelete={() => remove(m.id)} />)}
      </div>
    </div>
  );
}

function MeetingRow({ m, fr, onDelete }) {
  const [open, setOpen] = useState(false);
  const hasBody = m.minutes || m.decisions;
  return (
    <Card>
      <CardContent className="py-3">
      <div className="flex items-center gap-3">
        <CalendarDays className="size-4 shrink-0" style={{ color: 'var(--brand)' }} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{m.title || (fr ? 'Réunion' : 'Meeting')}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {m.meeting_date}
            {m.attendees_count != null && <> · {m.attendees_count} {fr ? 'participants' : 'attendees'}</>}
            {m.women_count != null && m.attendees_count > 0 && <> · {Math.round((100 * m.women_count) / m.attendees_count)}% {fr ? 'femmes' : 'women'}</>}
          </p>
        </div>
        {hasBody && (
          <button onClick={() => setOpen((o) => !o)} className="text-gray-400 hover:text-gray-700">
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
        <button onClick={onDelete} className="text-gray-300 hover:text-red-600"><Trash2 className="size-4" /></button>
      </div>
      {open && hasBody && (
        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
          {m.minutes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{fr ? 'Procès-verbal' : 'Minutes'}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{m.minutes}</p>
            </div>
          )}
          {m.decisions && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{fr ? 'Décisions' : 'Decisions'}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{m.decisions}</p>
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
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
