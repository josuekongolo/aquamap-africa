'use client';

import { useState } from 'react';
import { Skull, Pill, Droplets, Ruler, Eye, Check, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { enqueue, notifyQueued } from '../lib/offlineQueue';

// Expanded operational logging → public.events (type + severity + details JSONB).
export default function EventModal({ operator, onClose, onSaved }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const fr = lang === 'fr';

  const [type, setType] = useState('mortality');
  const [form, setForm] = useState({
    event_date: '', severity: 'low', description: '',
    count: '', cause: '', product: '', dose: '',
    temp_c: '', ph: '', do_mgl: '', avg_weight_g: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  const types = [
    { id: 'mortality', label: fr ? 'Mortalité' : 'Mortality', Icon: Skull },
    { id: 'treatment', label: fr ? 'Traitement' : 'Treatment', Icon: Pill },
    { id: 'water', label: fr ? "Qualité eau" : 'Water', Icon: Droplets },
    { id: 'sampling', label: fr ? 'Échantillon' : 'Sample', Icon: Ruler },
    { id: 'observation', label: fr ? 'Observation' : 'Observation', Icon: Eye },
  ];

  function detailsFor() {
    if (type === 'mortality') return { count: num(form.count), cause: form.cause || null };
    if (type === 'treatment') return { product: form.product || null, dose: form.dose || null };
    if (type === 'water') return { temp_c: num(form.temp_c), ph: num(form.ph), do_mgl: num(form.do_mgl) };
    if (type === 'sampling') return { count: num(form.count), avg_weight_g: num(form.avg_weight_g) };
    return {};
  }
  function autoSummary() {
    if (form.description) return form.description;
    if (type === 'mortality') return `${form.count || '?'} ${fr ? 'morts' : 'dead'}${form.cause ? ` — ${form.cause}` : ''}`;
    if (type === 'treatment') return [form.product, form.dose && `(${form.dose})`].filter(Boolean).join(' ') || (fr ? 'Traitement' : 'Treatment');
    if (type === 'water') return [form.temp_c && `${form.temp_c}°C`, form.ph && `pH ${form.ph}`, form.do_mgl && `O₂ ${form.do_mgl} mg/L`].filter(Boolean).join(' · ') || (fr ? "Qualité de l'eau" : 'Water quality');
    if (type === 'sampling') return `${form.count || '?'} ${fr ? 'éch.' : 'sample'} · ${form.avg_weight_g || '?'} g ${fr ? 'moy.' : 'avg'}`;
    return form.description || (fr ? 'Observation' : 'Observation');
  }

  async function handleSave() {
    setError('');
    if (!form.event_date) { setError(fr ? 'Date requise' : 'Date required'); return; }
    setSaving(true);
    const payload = {
      operator_id: operator.id,
      created_by: user.id,
      event_date: form.event_date,
      type,
      severity: form.severity || null,
      description: autoSummary(),
      details: detailsFor(),
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try { await enqueue({ table: 'events', payload }); notifyQueued(); setSaving(false); onSaved(); return; } catch { /* try online */ }
    }
    const { error: insertError } = await supabase.from('events').insert(payload);
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h3 className="font-bold text-lg mb-1" style={{ color: '#0D6B8A' }}>{fr ? 'Nouvel événement' : 'New event'}</h3>
        <p className="text-sm text-gray-400 mb-5">{operator.name}</p>

        <div className="grid grid-cols-5 gap-2 mb-5">
          {types.map((ty) => (
            <button key={ty.id} onClick={() => setType(ty.id)}
              className={`flex flex-col items-center py-2 rounded-xl border-2 text-[10px] font-medium transition ${type === ty.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'}`}>
              <ty.Icon className="w-4 h-4 mb-1" />{ty.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Field label={t.dashboard.date} type="date" value={form.event_date} onChange={(v) => set('event_date', v)} />

          {type === 'mortality' && (
            <>
              <Field label={fr ? 'Nombre' : 'Count'} type="number" value={form.count} onChange={(v) => set('count', v)} placeholder="Ex: 120" />
              <Field label={fr ? 'Cause (présumée)' : 'Cause (suspected)'} value={form.cause} onChange={(v) => set('cause', v)} />
            </>
          )}
          {type === 'treatment' && (
            <>
              <Field label={fr ? 'Produit / médicament' : 'Product / medication'} value={form.product} onChange={(v) => set('product', v)} />
              <Field label={fr ? 'Dose' : 'Dose'} value={form.dose} onChange={(v) => set('dose', v)} placeholder="Ex: 5 g/m³" />
            </>
          )}
          {type === 'water' && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="T °C" type="number" value={form.temp_c} onChange={(v) => set('temp_c', v)} />
              <Field label="pH" type="number" value={form.ph} onChange={(v) => set('ph', v)} />
              <Field label="O₂ mg/L" type="number" value={form.do_mgl} onChange={(v) => set('do_mgl', v)} />
            </div>
          )}
          {type === 'sampling' && (
            <>
              <Field label={fr ? "Taille de l'échantillon" : 'Sample size'} type="number" value={form.count} onChange={(v) => set('count', v)} placeholder="Ex: 30" />
              <Field label={fr ? 'Poids moyen (g)' : 'Avg weight (g)'} type="number" value={form.avg_weight_g} onChange={(v) => set('avg_weight_g', v)} placeholder="Ex: 180" />
            </>
          )}

          {type !== 'observation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{fr ? 'Gravité' : 'Severity'}</label>
              <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                <option value="low">{fr ? 'Faible' : 'Low'}</option>
                <option value="medium">{fr ? 'Moyenne' : 'Medium'}</option>
                <option value="high">{fr ? 'Élevée' : 'High'}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{fr ? 'Note (facultatif)' : 'Note (optional)'}</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>

        {error && <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{t.dashboard.cancel}</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#0D6B8A' }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin inline" /> : <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> {t.dashboard.save}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400" />
    </div>
  );
}
