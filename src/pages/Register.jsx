import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const systems = [
  { id: 'etang', label: 'Étang', icon: '🌊' },
  { id: 'cage', label: 'Cage', icon: '🐟' },
  { id: 'bassin', label: 'Bassin', icon: '🏊' },
  { id: 'ras', label: 'RAS', icon: '♻️' },
  { id: 'rizipi', label: 'Rizipisciculture', icon: '🌾' },
];

const species = [
  { id: 'tilapia', label: 'Tilapia', icon: '🐟' },
  { id: 'silure', label: 'Silure', icon: '🐡' },
  { id: 'crevette', label: 'Crevette', icon: '🦐' },
  { id: 'carpe', label: 'Carpe', icon: '🐠' },
  { id: 'autre', label: 'Autre', icon: '🌊' },
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

export default function Register() {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', country: '', region: '', gps: '', gender: '', ageRange: '', legalStatus: '',
    units: '', area: '', systems: [], species: [], waterSource: '', electricity: '', road: '',
    production: '', revenue: '', sales: '', financing: '', challenges: [], training: '',
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
    setGpsCapturing(true);
    setTimeout(() => {
      setField('gps', '14.6937°N, 17.4441°W');
      setGpsCapturing(false);
    }, 1500);
  };

  const handleSubmit = () => {
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#00A878' }}>{t.register.success}</h2>
          <p className="text-gray-600 mb-8">{t.register.successSub}</p>
          <Link
            to="/dashboard"
            className="inline-block text-white font-bold px-8 py-3 rounded-xl"
            style={{ backgroundColor: '#0D6B8A' }}
          >
            {t.register.dashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8" style={{ color: '#0D6B8A' }}>
          🐠 {t.register.title}
        </h1>

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
              <h2 className="font-bold text-lg mb-4" style={{ color: '#0D6B8A' }}>
                👤 {t.register.step1}
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.country}</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  value={form.country}
                  onChange={e => setField('country', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>Sénégal</option>
                  <option>Côte d'Ivoire</option>
                  <option>Cameroun</option>
                  <option>Autre</option>
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
                    onClick={captureGps}
                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: '#0D6B8A' }}
                    disabled={gpsCapturing}
                  >
                    {gpsCapturing ? '⏳' : t.register.gpsBtn}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.gender}</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={form.gender}
                    onChange={e => setField('gender', e.target.value)}
                  >
                    <option value="">...</option>
                    <option>{t.register.male}</option>
                    <option>{t.register.female}</option>
                    <option>{t.register.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.ageRange}</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
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
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-lg mb-4" style={{ color: '#0D6B8A' }}>
                🏊 {t.register.step2}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.units}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={form.units}
                    onChange={e => setField('units', e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.area}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                      <span className="text-2xl mb-1">{s.icon}</span>
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
                      <span className="text-2xl mb-1">{s.icon}</span>
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.waterSource}</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
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
              <h2 className="font-bold text-lg mb-4" style={{ color: '#0D6B8A' }}>
                📈 {t.register.step3}
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.production}</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.revenue}
                  onChange={e => setField('revenue', e.target.value)}
                >
                  <option value="">Sélectionner...</option>
                  <option>{'< 500 000 FCFA'}</option>
                  <option>500 000 - 2M FCFA</option>
                  <option>2M - 10M FCFA</option>
                  <option>{'> 10M FCFA'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.register.sales}</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
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
                className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                style={{ backgroundColor: '#00A878' }}
              >
                ✓ {t.register.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
