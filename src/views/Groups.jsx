'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Plus, MapPin, BadgeCheck, RefreshCw, Check, X, AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { enqueue, notifyQueued } from '../lib/offlineQueue';
import { ACM_GROUP_TYPES, ACM_MODELS, ACM_DEGREES, DACMS_SOURCE } from '../data/dacms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COUNTRIES = ['Sénégal', "Côte d'Ivoire", 'Cameroun'];

const label = (list, id, fr) => {
  const item = list.find((x) => x.id === id);
  return item ? (fr ? item.fr : item.en) : null;
};

// Co-management groups (FAO DACMS): committees, cooperatives, associations,
// networks the agent facilitates. List + registration; detail lives at /groups/[id].
export default function Groups() {
  const { t, lang } = useLang();
  const { user, configured } = useAuth();
  const fr = lang === 'fr';

  const [groups, setGroups] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [loading, setLoading] = useState(configured);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [queuedMsg, setQueuedMsg] = useState(false);

  const load = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setGroups(data || []);
    const { data: members } = await supabase.from('group_members').select('group_id');
    const counts = {};
    for (const m of members || []) counts[m.group_id] = (counts[m.group_id] || 0) + 1;
    setMemberCounts(counts);
    setLoading(false);
  }, [configured]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-black flex items-center gap-2.5">
            <Users className="size-7" style={{ color: 'var(--brand)' }} />
            {fr ? 'Cogestion aquacole' : 'Aquaculture co-management'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fr
              ? 'Comités, coopératives et associations de producteurs — selon le guide FAO de cogestion aquacole (DACMS).'
              : 'Committees, cooperatives and producer associations — per the FAO aquaculture co-management guidebook (DACMS).'}
          </p>
        </div>
        <button onClick={() => setFormOpen(true)}
          className="text-white px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1 self-start"
          style={{ backgroundColor: 'var(--brand)' }}>
          <Plus className="size-4" /> {fr ? 'Nouveau groupe' : 'New group'}
        </button>
      </div>

      {!configured && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      )}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}
      {queuedMsg && (
        <div className="text-sm bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-4 py-3">
          {fr ? 'Hors ligne — le groupe sera synchronisé à la reconnexion.' : 'Offline — the group will sync when you reconnect.'}
        </div>
      )}

      {formOpen && (
        <GroupForm fr={fr} user={user} onClose={() => setFormOpen(false)}
          onSaved={(queued) => { setFormOpen(false); if (queued) setQueuedMsg(true); else load(); }} />
      )}

      {configured && !loading && groups.length === 0 && !formOpen && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-1 font-medium text-gray-700">
              {fr ? 'Aucun groupe de cogestion pour le moment.' : 'No co-management groups yet.'}
            </p>
            <p className="text-sm max-w-md mx-auto">
              {fr
                ? 'Enregistrez un comité de cogestion, une coopérative ou une association, puis reliez-y vos opérateurs, votre plan de cogestion et vos zones.'
                : 'Register a co-management committee, cooperative or association, then link your operators, co-management plan and zones to it.'}
            </p>
            <button onClick={() => setFormOpen(true)} className="mt-4 font-medium" style={{ color: 'var(--brand)' }}>
              + {fr ? 'Enregistrer un groupe' : 'Register a group'}
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <Link key={g.id} href={`/groups/${g.id}`} className="block group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="group-hover:underline decoration-2" style={{ textDecorationColor: 'var(--brand)' }}>{g.name}</span>
                  {g.registered && (
                    <span title={fr ? 'Organisation enregistrée' : 'Registered organization'}>
                      <BadgeCheck className="size-5 shrink-0" style={{ color: 'var(--brand-2)' }} />
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {[g.region, g.country].filter(Boolean).join(', ') || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {g.group_type && <Badge variant="outline">{label(ACM_GROUP_TYPES, g.group_type, fr)}</Badge>}
                  {g.acm_model && <Badge variant="outline" style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}>{label(ACM_MODELS, g.acm_model, fr)}</Badge>}
                  {g.degree && <Badge variant="outline" style={{ color: 'var(--brand-2)', borderColor: 'var(--brand-2)' }}>{label(ACM_DEGREES, g.degree, fr)}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    {g.members_declared ?? memberCounts[g.id] ?? 0} {fr ? 'membres' : 'members'}
                  </span>
                  {g.women_declared != null && g.members_declared > 0 && (
                    <span>{Math.round((100 * g.women_declared) / g.members_declared)}% {fr ? 'femmes' : 'women'}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        {fr ? 'Cadre : ' : 'Framework: '}
        <a href={DACMS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          {DACMS_SOURCE.citation}
        </a>
      </p>
    </div>
  );
}

function GroupForm({ fr, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', group_type: 'committee', acm_model: '', degree: '', country: '', region: '',
    description: '', established_on: '', registered: false,
    members_declared: '', women_declared: '', youth_declared: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function handleSave() {
    setError('');
    if (!form.name.trim()) { setError(fr ? 'Le nom est requis.' : 'Name is required.'); return; }
    setSaving(true);
    const payload = {
      created_by: user.id,
      name: form.name.trim(),
      group_type: form.group_type || null,
      acm_model: form.acm_model || null,
      degree: form.degree || null,
      country: form.country || null,
      region: form.region || null,
      description: form.description || null,
      established_on: form.established_on || null,
      registered: form.registered,
      members_declared: num(form.members_declared),
      women_declared: num(form.women_declared),
      youth_declared: num(form.youth_declared),
    };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'groups', payload });
        notifyQueued();
        setSaving(false);
        onSaved(true);
        return;
      } catch { /* fall through to attempt online */ }
    }
    const { error: insertError } = await supabase.from('groups').insert(payload);
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    onSaved(false);
  }

  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{fr ? 'Enregistrer un groupe de cogestion' : 'Register a co-management group'}</CardTitle>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="size-5" /></button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={fr ? 'Nom du groupe *' : 'Group name *'}>
            <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder={fr ? 'Ex : Comité de cogestion du lac de Guiers' : 'e.g. Lake Guiers co-management committee'} />
          </Field>
          <Field label={fr ? 'Type' : 'Type'}>
            <select className={input} value={form.group_type} onChange={(e) => set('group_type', e.target.value)}>
              {ACM_GROUP_TYPES.map((o) => <option key={o.id} value={o.id}>{fr ? o.fr : o.en}</option>)}
            </select>
          </Field>
          <Field label={fr ? 'Modèle de cogestion (FAO §3.3)' : 'Co-management model (FAO §3.3)'}>
            <select className={input} value={form.acm_model} onChange={(e) => set('acm_model', e.target.value)}>
              <option value="">…</option>
              {ACM_MODELS.map((o) => <option key={o.id} value={o.id}>{fr ? o.fr : o.en}</option>)}
            </select>
          </Field>
          <Field label={fr ? 'Degré de partage du pouvoir (FAO §3.2)' : 'Degree of power sharing (FAO §3.2)'}>
            <select className={input} value={form.degree} onChange={(e) => set('degree', e.target.value)}>
              <option value="">…</option>
              {ACM_DEGREES.map((o) => <option key={o.id} value={o.id}>{fr ? o.fr : o.en}</option>)}
            </select>
          </Field>
          <Field label={fr ? 'Pays' : 'Country'}>
            <select className={input} value={form.country} onChange={(e) => set('country', e.target.value)}>
              <option value="">…</option>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={fr ? 'Région / localité' : 'Region / locality'}>
            <input className={input} value={form.region} onChange={(e) => set('region', e.target.value)} />
          </Field>
          <Field label={fr ? 'Date de création' : 'Established on'}>
            <input type="date" className={input} value={form.established_on} onChange={(e) => set('established_on', e.target.value)} />
          </Field>
          <Field label={fr ? 'Membres déclarés (total)' : 'Declared members (total)'}>
            <input type="number" min="0" className={input} value={form.members_declared} onChange={(e) => set('members_declared', e.target.value)} />
          </Field>
          <Field label={fr ? 'Dont femmes' : 'Of which women'}>
            <input type="number" min="0" className={input} value={form.women_declared} onChange={(e) => set('women_declared', e.target.value)} />
          </Field>
          <Field label={fr ? 'Dont jeunes (18–35)' : 'Of which youth (18–35)'}>
            <input type="number" min="0" className={input} value={form.youth_declared} onChange={(e) => set('youth_declared', e.target.value)} />
          </Field>
        </div>
        <Field label={fr ? 'Description / mission' : 'Description / mission'}>
          <textarea className={input} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.registered} onChange={(e) => set('registered', e.target.checked)} />
          {fr ? 'Organisation formellement enregistrée (indicateur FAO I.1.3.1)' : 'Formally registered organization (FAO indicator I.1.3.1)'}
        </label>

        {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
            {fr ? 'Annuler' : 'Cancel'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-60 text-sm"
            style={{ backgroundColor: 'var(--brand)' }}>
            {saving
              ? <RefreshCw className="w-4 h-4 animate-spin inline" />
              : <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> {fr ? 'Enregistrer' : 'Save'}</span>}
          </button>
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
