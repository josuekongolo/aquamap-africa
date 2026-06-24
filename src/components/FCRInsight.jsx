'use client';

import { fcrInsight } from '../lib/fcr';
import { useLang } from '../context/LangContext';

// Actionable FCR card: number + color verdict chip + plain-language next action.
export default function FCRInsight({ speciesKey = 'Tilapia', fcr }) {
  const { lang } = useLang();
  if (fcr == null || !Number.isFinite(fcr)) return null;
  const ins = fcrInsight(speciesKey, fcr, lang);
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: `${ins.color}14` }}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl font-bold leading-none" style={{ color: ins.color }}>{fcr.toFixed(2)}</span>
        <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: ins.color }}>
          {ins.verdict}
        </span>
        <span className="text-xs text-gray-400 ml-auto">FCR · {speciesKey}</span>
      </div>
      <p className="text-sm text-gray-700 mt-1">{ins.action}</p>
    </div>
  );
}
