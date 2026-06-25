'use client';

import { useState } from 'react';
import { Fish, Wheat, PackageCheck, Check, RefreshCw } from 'lucide-react';
import { speciesList } from '../data/species';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { enqueue, notifyQueued } from '../lib/offlineQueue';

const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };

export default function LogModal({ operator, onClose, onSaved }) {
  const { t } = useLang();
  const { user } = useAuth();

  // Default species = operator's primary, else first benchmark species.
  const defaultSpecies = SPECIES_KEY[operator?.species?.[0]] || speciesList[0];

  const [type, setType] = useState('feed');
  const [form, setForm] = useState({
    log_date: '',
    species: defaultSpecies,
    feed_kg: '',
    fingerlings_count: '',
    avg_weight_g: '',
    kg_harvested: '',
    kg_sold: '',
    price_per_kg: '',
    buyer_type: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (v) => (v === '' || v == null ? null : Number(v));

  async function handleSave() {
    setError('');
    if (!form.log_date) { setError(t.dashboard.date); return; }
    setSaving(true);
    const payload = {
      operator_id: operator.id,
      created_by: user.id,
      type,
      log_date: form.log_date,
      species: form.species || null,
      feed_kg: type === 'feed' ? num(form.feed_kg) : null,
      fingerlings_count: type === 'stocking' ? num(form.fingerlings_count) : null,
      avg_weight_g: type === 'stocking' ? num(form.avg_weight_g) : null,
      kg_harvested: type === 'harvest' ? num(form.kg_harvested) : null,
      kg_sold: type === 'harvest' ? num(form.kg_sold) : null,
      price_per_kg: type === 'harvest' ? num(form.price_per_kg) : null,
      buyer_type: type === 'harvest' ? (form.buyer_type || null) : null,
      note: form.note || null,
    };

    // Offline: save locally and let the queue sync it on reconnect.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'logs', payload });
        notifyQueued();
        setSaving(false);
        onSaved();
        return;
      } catch { /* fall through to attempt online */ }
    }

    const { error: insertError } = await supabase.from('logs').insert(payload);
    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    onSaved();
  }

  const types = [
    { id: 'stocking', label: t.dashboard.stocking, Icon: Fish },
    { id: 'feed', label: t.dashboard.feeding, Icon: Wheat },
    { id: 'harvest', label: t.dashboard.harvest, Icon: PackageCheck },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h3 className="font-bold text-lg mb-1" style={{ color: '#0D6B8A' }}>{t.dashboard.addLog}</h3>
        <p className="text-sm text-gray-400 mb-5">{operator.name}</p>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {types.map(ty => (
            <button
              key={ty.id}
              onClick={() => setType(ty.id)}
              className={`flex flex-col items-center py-2 rounded-xl border-2 text-xs font-medium transition ${
                type === ty.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              <ty.Icon className="w-5 h-5 mb-1" />{ty.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Field label={t.dashboard.date} type="date" value={form.log_date} onChange={v => set('log_date', v)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.species}</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={form.species}
              onChange={e => set('species', e.target.value)}
            >
              {speciesList.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {type === 'feed' && (
            <Field label={t.dashboard.feedKg} type="number" value={form.feed_kg} onChange={v => set('feed_kg', v)} placeholder="Ex: 50" />
          )}
          {type === 'stocking' && (
            <>
              <Field label={t.dashboard.fingerlings} type="number" value={form.fingerlings_count} onChange={v => set('fingerlings_count', v)} placeholder="Ex: 2000" />
              <Field label={t.dashboard.avgWeightG} type="number" value={form.avg_weight_g} onChange={v => set('avg_weight_g', v)} placeholder="Ex: 5" />
            </>
          )}
          {type === 'harvest' && (
            <>
              <Field label={t.dashboard.kgHarvested} type="number" value={form.kg_harvested} onChange={v => set('kg_harvested', v)} placeholder="Ex: 800" />
              <Field label={t.dashboard.kgSold} type="number" value={form.kg_sold} onChange={v => set('kg_sold', v)} placeholder="Ex: 750" />
              <Field label={t.dashboard.pricePerKg} type="number" value={form.price_per_kg} onChange={v => set('price_per_kg', v)} placeholder="Ex: 1500" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.buyerType}</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.buyer_type}
                  onChange={e => set('buyer_type', e.target.value)}
                >
                  <option value="">…</option>
                  <option>Marché local</option>
                  <option>Restaurateur</option>
                  <option>Grossiste</option>
                  <option>Consommateur direct</option>
                </select>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            {t.dashboard.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#0D6B8A' }}
          >
            {saving
              ? <RefreshCw className="w-4 h-4 animate-spin inline" />
              : <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> {t.dashboard.save}</span>}
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
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
    </div>
  );
}
