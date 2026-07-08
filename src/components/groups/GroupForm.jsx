'use client';

import { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { enqueue, notifyQueued } from '../../lib/offlineQueue';
import { ACM_GROUP_TYPES, ACM_MODELS, ACM_DEGREES } from '../../data/dacms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COUNTRIES = ['Sénégal', "Côte d'Ivoire", 'Cameroun'];
const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Create or edit a co-management group. Insert works offline (queue); editing
// (initialGroup set) is online-only. onSaved(queued) fires on success.
export default function GroupForm({ fr, user, initialGroup = null, onClose, onSaved }) {
  const editing = !!initialGroup;
  const [form, setForm] = useState(() => ({
    name: initialGroup?.name || '',
    group_type: initialGroup?.group_type || 'committee',
    acm_model: initialGroup?.acm_model || '',
    degree: initialGroup?.degree || '',
    country: initialGroup?.country || '',
    region: initialGroup?.region || '',
    description: initialGroup?.description || '',
    established_on: initialGroup?.established_on || '',
    registered: initialGroup?.registered ?? false,
    members_declared: initialGroup?.members_declared != null ? String(initialGroup.members_declared) : '',
    women_declared: initialGroup?.women_declared != null ? String(initialGroup.women_declared) : '',
    youth_declared: initialGroup?.youth_declared != null ? String(initialGroup.youth_declared) : '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function handleSave() {
    setError('');
    if (!form.name.trim()) { setError(fr ? 'Le nom est requis.' : 'Name is required.'); return; }
    setSaving(true);
    const payload = {
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

    if (editing) {
      const { error: updateError } = await supabase.from('groups').update(payload).eq('id', initialGroup.id);
      setSaving(false);
      if (updateError) { setError(updateError.message); return; }
      onSaved(false);
      return;
    }

    const insertPayload = { ...payload, created_by: user.id };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'groups', payload: insertPayload });
        notifyQueued();
        setSaving(false);
        onSaved(true);
        return;
      } catch { /* fall through to attempt online */ }
    }
    const { error: insertError } = await supabase.from('groups').insert(insertPayload);
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    onSaved(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{editing ? (fr ? 'Modifier le groupe' : 'Edit group') : (fr ? 'Enregistrer un groupe de cogestion' : 'Register a co-management group')}</CardTitle>
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
