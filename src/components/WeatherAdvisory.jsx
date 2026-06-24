'use client';

import { useState, useEffect } from 'react';
import { CloudSun, Droplets, Thermometer, Fish } from 'lucide-react';
import { speciesBenchmarks } from '../data/species';
import { useLang } from '../context/LangContext';

// Live weather for an operator's GPS (Open-Meteo, free, no key), cross-referenced
// with the species' optimal water-temperature band to surface a heat/cold risk.
export default function WeatherAdvisory({ lat, lng, speciesKey = 'Tilapia' }) {
  const { lang } = useLang();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    if (lat == null || lng == null) return;
    let active = true;
    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,relative_humidity_2m,precipitation` +
          `&daily=temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('weather');
        const json = await res.json();
        if (active) { setData(json); setStatus('ok'); }
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => { active = false; };
  }, [lat, lng]);

  if (lat == null || lng == null) return null;

  const T = {
    fr: { title: 'Météo & risque thermique', now: 'Maintenant', humidity: 'Humidité', max3: 'Max 3 j',
      heat: 'Chaleur prévue — risque de faible O₂ en étang. Aérez tôt le matin, réduisez l\'alimentation.',
      cold: 'Températures basses — croissance ralentie. Réduisez les rations.',
      ok: 'Conditions dans la plage optimale de l\'espèce.', err: 'Météo indisponible.', band: 'Plage optimale' },
    en: { title: 'Weather & thermal risk', now: 'Now', humidity: 'Humidity', max3: '3-day max',
      heat: 'High heat forecast — pond low-O₂ risk. Aerate early morning, reduce feeding.',
      cold: 'Low temperatures — slower growth. Reduce rations.',
      ok: 'Conditions within the species optimal range.', err: 'Weather unavailable.', band: 'Optimal range' },
  }[lang];

  if (status === 'loading') {
    return <div className="bg-white rounded-xl shadow-md p-6 h-28 animate-pulse" />;
  }
  if (status === 'error' || !data?.current) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 text-sm text-gray-400 flex items-center gap-2"><CloudSun className="w-4 h-4" /> {T.err}</div>
    );
  }

  const band = speciesBenchmarks[speciesKey]?.water?.tempC || [25, 32];
  const cur = data.current.temperature_2m;
  const max3 = Math.max(...(data.daily?.temperature_2m_max || [cur]));
  const min3 = Math.min(...(data.daily?.temperature_2m_min || [cur]));

  let risk = 'ok';
  if (max3 > band[1] + 3) risk = 'heat';
  else if (min3 < band[0] - 3) risk = 'cold';

  const riskStyle = {
    ok: { bg: '#00A87814', color: '#00A878', msg: T.ok },
    heat: { bg: '#ef444414', color: '#ef4444', msg: T.heat },
    cold: { bg: '#0D6B8A14', color: '#0D6B8A', msg: T.cold },
  }[risk];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#0D6B8A' }}><CloudSun className="w-5 h-5" /> {T.title}</h3>
      <div className="flex items-center gap-6 mb-3">
        <div>
          <div className="text-3xl font-bold" style={{ color: '#0D6B8A' }}>{Math.round(cur)}°C</div>
          <div className="text-xs text-gray-400">{T.now}</div>
        </div>
        <div className="text-sm text-gray-500 space-y-0.5">
          <div className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> {T.humidity}: {data.current.relative_humidity_2m}%</div>
          <div className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" /> {T.max3}: {Math.round(max3)}°C</div>
          <div className="flex items-center gap-1.5"><Fish className="w-3.5 h-3.5" /> {T.band} {speciesKey}: {band[0]}–{band[1]}°C</div>
        </div>
      </div>
      <div className="rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: riskStyle.bg, color: riskStyle.color }}>
        {riskStyle.msg}
      </div>
    </div>
  );
}
