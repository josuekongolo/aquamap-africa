'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Waves, Fish, Droplets, Recycle, Wheat, Shrimp, CircleCheck, MapPin, RefreshCw, Map as MapIcon } from 'lucide-react';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false, loading: () => <div className="h-56 rounded-lg border bg-gray-100 animate-pulse" /> });
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { enqueue, notifyQueued } from '../lib/offlineQueue';
import { africaCountries } from '../data/africaCountries';

// All African countries (alphabetical) for the operator country selector.
const COUNTRY_OPTIONS = africaCountries.map((c) => c.name).sort((a, b) => a.localeCompare(b, 'fr'));

// Gender is stored as a stable id; normalize any legacy label on read.
export const genderId = (v) => {
  const s = String(v || '').toLowerCase();
  if (['homme', 'male'].includes(s)) return 'male';
  if (['femme', 'female'].includes(s)) return 'female';
  if (['autre', 'other'].includes(s)) return 'other';
  return '';
};

const systems = [
  { id: 'etang', label: 'Étang', Icon: Waves },
  { id: 'cage', label: 'Cage', Icon: Fish },
  { id: 'bassin', label: 'Bassin', Icon: Droplets },
  { id: 'ras', label: 'RAS', Icon: Recycle },
  { id: 'rizipi', label: 'Rizipisciculture', Icon: Wheat },
];

const species = [
  { id: 'tilapia', label: 'Tilapia', Icon: Fish },
  { id: 'silure', label: 'Silure', Icon: Fish },
  { id: 'crevette', label: 'Crevette', Icon: Shrimp },
  { id: 'carpe', label: 'Carpe', Icon: Fish },
  { id: 'autre', label: 'Autre', Icon: Fish },
];

const challenges = [
  'Accès au financement',
  'Qualité des aliments',
  'Maladies et mortalité',
  'Accès au marché',
  'Manque de formation',
  'Coût de l\'énergie',
  'Accès à l\'eau',
  'Main d\'oeuvre',
];

// The 3-step operator form, shared between registration (insert; works offline
// via the write queue) and editing (update; online-only). Consent (privacy
// blocker): registration requires the agent to attest informed consent.
export default function OperatorForm({ initialOperator = null, onSaved }) {
  const { t, lang } = useLang();
  const { user, configured } = useAuth();
  const editing = !!initialOperator;

  const fromBool = (v) => (v === true ? t.register.yes : v === false ? t.register.no : '');

  const [step, setStep] = useState(1);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dupWarning, setDupWarning] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState(() => initialOperator ? {
    name: initialOperator.name || '',
    phone: initialOperator.phone || '',
    country: initialOperator.country || '',
    region: initialOperator.region || '',
    gps: initialOperator.lat != null && initialOperator.lng != null
      ? `${Number(initialOperator.lat).toFixed(4)}, ${Number(initialOperator.lng).toFixed(4)}` : '',
    lat: initialOperator.lat ?? null,
    lng: initialOperator.lng ?? null,
    gender: genderId(initialOperator.gender),
    ageRange: initialOperator.age_range || '',
    legalStatus: initialOperator.legal_status || '',
    units: initialOperator.units != null ? String(initialOperator.units) : '',
    area: initialOperator.area_m2 != null ? String(initialOperator.area_m2) : '',
    systems: initialOperator.systems || [],
    species: initialOperator.species || [],
    waterSource: initialOperator.water_source || '',
    electricity: fromBool(initialOperator.electricity),
    road: fromBool(initialOperator.road_access),
    production: initialOperator.production_range || '',
    revenue: initialOperator.revenue_range || '',
    sales: initialOperator.sales_channel || '',
    financing: fromBool(initialOperator.financing),
    challenges: initialOperator.challenges || [],
    training: fromBool(initialOperator.training_wanted),
    consent: !!initialOperator.consent_given,
  } : {
    name: '', phone: '', country: '', region: '', gps: '', lat: null, lng: null,
    gender: '', ageRange: '', legalStatus: '',
    units: '', area: '', systems: [], species: [], waterSource: '', electricity: '', road: '',
    production: '', revenue: '', sales: '', financing: '', challenges: [], training: '',
    consent: false,
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (field, val) => {
    setForm(f => {
      const arr = f[field];
      if (arr.includes(val)) return { ...f, [field]: arr.filter(x => x !== val) };
      if (field === 'challenges' && arr.length >= 3) return f;
      return { ...f, [field]: [...arr, val] };
    });
  };

  const captureGps = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible sur cet appareil.');
      return;
    }
    setGpsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({
          ...f,
          lat: latitude,
          lng: longitude,
          gps: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        setGpsCapturing(false);
      },
      () => {
        setError('Impossible de capturer la position. Autorisez la localisation.');
        setGpsCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toBool = (v) =>
    ['Oui', 'Yes'].includes(v) ? true : ['Non', 'No'].includes(v) ? false : null;

  // Soft duplicate check on the phone number (normalized to digits). RLS scopes
  // the query to the agent's org, so this catches same-org duplicate farmers.
  const checkDuplicatePhone = async () => {
    setDupWarning('');
    const digits = (form.phone || '').replace(/\D/g, '');
    if (digits.length < 6 || !supabase) return;
    const { data } = await supabase.from('operators').select('id, name, phone').not('phone', 'is', null);
    const match = (data || []).find((o) => o.id !== initialOperator?.id && (o.phone || '').replace(/\D/g, '') === digits);
    if (match) {
      setDupWarning(fr
        ? `Un opérateur avec ce numéro existe déjà : « ${match.name} ». Vérifiez avant d'enregistrer un doublon.`
        : `An operator with this phone already exists: "${match.name}". Check before registering a duplicate.`);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!configured || !supabase) { setError(t.auth.notConfigured); return; }
    if (!form.name.trim()) { setError(t.register.name); setStep(1); return; }
    if (!form.consent) { setError(t.register.consentRequired); setStep(1); return; }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      country: form.country || null,
      region: form.region || null,
      lat: form.lat,
      lng: form.lng,
      gender: form.gender || null,
      age_range: form.ageRange || null,
      legal_status: form.legalStatus || null,
      units: form.units ? parseInt(form.units, 10) : null,
      area_m2: form.area ? parseFloat(form.area) : null,
      systems: form.systems,
      species: form.species,
      water_source: form.waterSource || null,
      electricity: toBool(form.electricity),
      road_access: toBool(form.road),
      production_range: form.production || null,
      revenue_range: form.revenue || null,
      sales_channel: form.sales || null,
      financing: toBool(form.financing),
      training_wanted: toBool(form.training),
      challenges: form.challenges,
      consent_given: true,
      consent_date: initialOperator?.consent_date || new Date().toISOString().slice(0, 10),
    };

    if (editing) {
      const { error: updateError } = await supabase.from('operators').update(payload).eq('id', initialOperator.id);
      setSubmitting(false);
      if (updateError) { setError(updateError.message); return; }
      onSaved?.({ queued: false, edited: true });
      return;
    }

    const insertPayload = { ...payload, created_by: user.id };
    // Offline-first: the flagship field flow must survive dead connectivity.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await enqueue({ table: 'operators', payload: insertPayload });
        notifyQueued();
        setSubmitting(false);
        onSaved?.({ queued: true });
        return;
      } catch { /* fall through to attempt online */ }
    }
    const { error: insertError } = await supabase.from('operators').insert(insertPayload);
    setSubmitting(false);
    if (insertError) { setError(insertError.message); return; }
    onSaved?.({ queued: false });
  };

  return (
    <>
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[t.register.step1, t.register.step2, t.register.step3].map((s, i) => (
              <div key={i} className={`text-xs font-medium ${step > i ? 'text-teal-600' : 'text-gray-400'}`}>
                {i + 1}. {s}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%`, backgroundColor: '#00A878' }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-bold text-lg mb-4 text-black">
{t.register.step1}
              </h2>
              {[
                { label: t.register.name, key: 'name', type: 'text', placeholder: 'Ex: Mamadou Diallo' },
                { label: t.register.phone, key: 'phone', type: 'tel', placeholder: '+221 77 123 4567' },
                { label: t.register.region, key: 'region', type: 'text', placeholder: 'Ex: Dakar' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    className="block w-full rounded-md border border-[#c7c7c7] bg-[#fbfbfb] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none placeholder:text-[#b2b2b2] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    onBlur={f.key === 'phone' ? checkDuplicatePhone : undefined}
                  />
                  {f.key === 'phone' && dupWarning && (
                    <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{dupWarning}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.country}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.country}
                  onChange={e => setField('country', e.target.value)}
                >
                  <option value="">{lang === 'fr' ? 'Sélectionner…' : 'Select…'}</option>
                  {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.gps}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50"
                    placeholder="14.6937°N, 17.4441°W"
                    value={form.gps}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={captureGps}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#0D6B8A' }}
                    disabled={gpsCapturing}
                  >
                    {gpsCapturing
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t.register.gpsBtn}</span>}
                  </button>
                </div>
                <button type="button" onClick={() => setShowMap((s) => !s)}
                  className="mt-2 text-xs font-medium inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--brand)' }}>
                  <MapIcon className="w-3.5 h-3.5" /> {showMap ? (lang === 'fr' ? 'Masquer la carte' : 'Hide map') : (lang === 'fr' ? 'Placer sur la carte' : 'Place on map')}
                </button>
                {showMap && (
                  <div className="mt-2">
                    <LocationPicker lat={form.lat} lng={form.lng} onPick={([lo, la]) => setForm((f) => ({ ...f, lat: la, lng: lo, gps: `${la.toFixed(4)}, ${lo.toFixed(4)}` }))} />
                    <p className="mt-1 text-[11px] text-gray-400">{lang === 'fr' ? 'Touchez la carte pour placer le repère (ou glissez-le).' : 'Tap the map to drop the pin (or drag it).'}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.gender}</label>
                  <select
                    className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                    value={form.gender}
                    onChange={e => setField('gender', e.target.value)}
                  >
                    <option value="">...</option>
                    <option value="male">{t.register.male}</option>
                    <option value="female">{t.register.female}</option>
                    <option value="other">{t.register.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.ageRange}</label>
                  <select
                    className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                    value={form.ageRange}
                    onChange={e => setField('ageRange', e.target.value)}
                  >
                    <option value="">...</option>
                    <option>18-25</option>
                    <option>26-35</option>
                    <option>36-45</option>
                    <option>46-55</option>
                    <option>55+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.legalStatus}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.legalStatus}
                  onChange={e => setField('legalStatus', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>Individuel / Informel</option>
                  <option>Association / Coopérative</option>
                  <option>SARL / SAS</option>
                  <option>ONG / Projet</option>
                </select>
              </div>

              {/* Informed consent (privacy) — required before any registration */}
              <label className={`flex items-start gap-2.5 rounded-lg border-2 p-3 text-sm cursor-pointer transition ${form.consent ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}>
                <input type="checkbox" className="mt-0.5" checked={form.consent}
                  onChange={e => setField('consent', e.target.checked)} />
                <span className="text-gray-700">
                  {t.register.consent}{' '}
                  <Link href="/privacy" target="_blank" className="underline" style={{ color: 'var(--brand)' }}>
                    {t.auth.privacyLink}
                  </Link>
                </span>
              </label>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-lg mb-4 text-black">
{t.register.step2}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.units}</label>
                  <input
                    type="number"
                    className="block w-full rounded-md border border-[#c7c7c7] bg-[#fbfbfb] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none placeholder:text-[#b2b2b2] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                    value={form.units}
                    onChange={e => setField('units', e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.area}</label>
                  <input
                    type="number"
                    className="block w-full rounded-md border border-[#c7c7c7] bg-[#fbfbfb] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none placeholder:text-[#b2b2b2] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                    value={form.area}
                    onChange={e => setField('area', e.target.value)}
                    placeholder="Ex: 2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t.register.system}</label>
                <div className="grid grid-cols-3 gap-3">
                  {systems.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleArr('systems', s.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition ${
                        form.systems.includes(s.id)
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <s.Icon className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t.register.species}</label>
                <div className="grid grid-cols-3 gap-3">
                  {species.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleArr('species', s.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition ${
                        form.species.includes(s.id)
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <s.Icon className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.waterSource}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.waterSource}
                  onChange={e => setField('waterSource', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>Fleuve / Rivière</option>
                  <option>Lac / Barrage</option>
                  <option>Forage / Puits</option>
                  <option>Eau de pluie</option>
                  <option>Réseau municipal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.register.electricity, key: 'electricity' },
                  { label: t.register.road, key: 'road' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                    <div className="flex gap-2">
                      {[t.register.yes, t.register.no].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField(f.key, v)}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                            form[f.key] === v
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-lg mb-4 text-black">
{t.register.step3}
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.production}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.production}
                  onChange={e => setField('production', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>{'< 1 tonne'}</option>
                  <option>1-5 tonnes</option>
                  <option>5-20 tonnes</option>
                  <option>20-50 tonnes</option>
                  <option>{'> 50 tonnes'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.revenue}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.revenue}
                  onChange={e => setField('revenue', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option value="< 500 000 FCFA">{'< 500 000 FCFA  (≈ < $830)'}</option>
                  <option value="500 000 - 2M FCFA">500 000 - 2M FCFA  (≈ $830 – $3,300)</option>
                  <option value="2M - 10M FCFA">2M - 10M FCFA  (≈ $3,300 – $16,700)</option>
                  <option value="> 10M FCFA">{'> 10M FCFA  (≈ > $16,700)'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.sales}</label>
                <select
                  className="block w-full rounded-md border border-[#d4d4d4] bg-[#fdfdfd] px-3 py-2.5 text-sm text-[#06303d] shadow-xs transition-all outline-none hover:border-[#8f8f8f] focus-visible:border-[#0D6B8A] focus-visible:ring-2 focus-visible:ring-[#0D6B8A]/20"
                  value={form.sales}
                  onChange={e => setField('sales', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>Marché local / détail</option>
                  <option>Restaurateurs / hôtels</option>
                  <option>Grossistes</option>
                  <option>Exportation</option>
                  <option>Transformation locale</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.register.financing, key: 'financing' },
                  { label: t.register.training, key: 'training' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                    <div className="flex gap-2">
                      {[t.register.yes, t.register.no].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setField(f.key, v)}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition ${
                            form[f.key] === v
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t.register.challenges} ({form.challenges.length}/3)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {challenges.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArr('challenges', c)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm text-left transition ${
                        form.challenges.includes(c)
                          ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                {t.register.prev}
              </button>
            ) : <div />}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                style={{ backgroundColor: '#0D6B8A' }}
              >
                {t.register.next}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition disabled:opacity-60"
                style={{ backgroundColor: '#0D6B8A' }}
              >
                {submitting
                  ? <RefreshCw className="w-4 h-4 animate-spin inline" />
                  : <span className="inline-flex items-center gap-1.5"><CircleCheck className="w-4 h-4" /> {editing ? t.register.saveChanges : t.register.submit}</span>}
              </button>
            )}
          </div>
        </div>
    </>
  );
}
