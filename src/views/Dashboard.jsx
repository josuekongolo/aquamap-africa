'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Waves, BarChart3, Wheat, PackageCheck, Fish, Scale, AlertTriangle } from 'lucide-react';
import { rateFCR } from '../data/species';
import { SpeciesIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import FCRTool from '../components/FCRTool';
import LogModal from '../components/LogModal';
import WeatherAdvisory from '../components/WeatherAdvisory';
import FCRInsight from '../components/FCRInsight';

// Operator species are stored as form ids; map to species.js benchmark keys.
const SPECIES_KEY = { tilapia: 'Tilapia', silure: 'Silure', crevette: 'Crevette', carpe: 'Carpe' };
const STATUS_LABEL = { excellent: 'fcrExcellent', correct: 'fcrCorrect', high: 'fcrHigh' };

function primarySpeciesKey(operator) {
  const id = operator?.species?.[0];
  return SPECIES_KEY[id] || 'Tilapia';
}

// Approximate FCR from an operator's logs: feed ÷ (harvested − stocked biomass).
function computeMetrics(logs) {
  let feed = 0, harvested = 0, stocked = 0;
  for (const l of logs) {
    if (l.type === 'feed') feed += Number(l.feed_kg) || 0;
    else if (l.type === 'harvest') harvested += Number(l.kg_harvested) || 0;
    else if (l.type === 'stocking') {
      stocked += ((Number(l.fingerlings_count) || 0) * (Number(l.avg_weight_g) || 0)) / 1000;
    }
  }
  const gain = harvested - stocked;
  const fcr = feed > 0 && gain > 0 ? feed / gain : null;
  return { feed, harvested, stocked, gain, fcr };
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user, agent, configured } = useAuth();

  const [operators, setOperators] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(configured);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const selected = operators.find(o => o.id === selectedId) || null;

  const loadOperators = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else {
      setOperators(data || []);
      setSelectedId(prev => prev || data?.[0]?.id || null);
    }
    setLoading(false);
  }, [configured]);

  const loadLogs = useCallback(async (operatorId) => {
    if (!configured || !operatorId) return;
    const { data } = await supabase
      .from('logs')
      .select('*')
      .eq('operator_id', operatorId)
      .order('log_date', { ascending: false });
    setLogs(data || []);
  }, [configured]);

  // Fetch-on-mount / on-select: legitimate effect use; state updates land after await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOperators(); }, [loadOperators]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadLogs(selectedId); }, [selectedId, loadLogs]);

  const metrics = computeMetrics(logs);
  const speciesKey = primarySpeciesKey(selected);
  const rating = metrics.fcr != null ? rateFCR(speciesKey, metrics.fcr) : null;

  const agentName = agent?.full_name || user?.email || '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {modalOpen && selected && (
        <LogModal
          operator={selected}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadLogs(selectedId); }}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0D6B8A' }}><Waves className="w-6 h-6" /> {t.dashboard.welcome} {agentName}</h1>
          {agent?.organization && <p className="text-gray-500 text-sm mt-1">{agent.organization}</p>}
        </div>
        <Link
          href="/register"
          className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
          style={{ backgroundColor: '#F4A261' }}
        >
          {t.dashboard.registerFirst}
        </Link>
      </div>

      {!configured && (
        <div className="mb-6 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
<AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      )}
      {error && (
        <div className="mb-6 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Operators + detail */}
      {configured && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-8">
          {/* Operator list */}
          <div className="bg-white rounded-xl shadow-md p-4 h-fit">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
              {t.dashboard.myOperators} {operators.length > 0 && `(${operators.length})`}
            </h3>
            {loading ? (
              <div className="text-gray-400 text-sm py-6 text-center animate-pulse">…</div>
            ) : operators.length === 0 ? (
              <div className="text-gray-400 text-sm py-4">
                {t.dashboard.noOperators}
                <Link href="/register" className="block mt-3 font-medium" style={{ color: '#0D6B8A' }}>
                  {t.dashboard.registerFirst}
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {operators.map(o => (
                  <li key={o.id}>
                    <button
                      onClick={() => setSelectedId(o.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        o.id === selectedId ? 'bg-teal-50 text-teal-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <SpeciesIcon name={primarySpeciesKey(o)} className="w-4 h-4 shrink-0 text-[#0D6B8A]" />
                        <span className="truncate">{o.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{o.region}{o.region && o.country ? ', ' : ''}{o.country}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected operator detail */}
          <div>
            {!selected ? (
              <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400">
                {t.dashboard.selectOperator}
              </div>
            ) : (
              <div className="space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Kpi Icon={BarChart3} label={t.dashboard.fcr}
                    value={metrics.fcr != null ? metrics.fcr.toFixed(2) : '—'}
                    color={rating?.color || '#94a3b8'}
                    sub={rating ? t.dashboard[STATUS_LABEL[rating.status]] : null} />
                  <Kpi Icon={Wheat} label={t.dashboard.feedKg} value={`${Math.round(metrics.feed)} kg`} color="#0D6B8A" />
                  <Kpi Icon={PackageCheck} label={t.dashboard.harvest} value={`${Math.round(metrics.harvested)} kg`} color="#00A878" />
                  <Kpi Icon={Fish} label={t.dashboard.species} value={speciesKey} color="#8b5cf6" />
                </div>

                {/* Actionable FCR insight */}
                {metrics.fcr != null && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#0D6B8A' }}><Scale className="w-5 h-5" /> {t.dashboard.fcrGauge}</h3>
                    <FCRInsight speciesKey={speciesKey} fcr={metrics.fcr} />
                  </div>
                )}

                {/* Weather advisory (if operator has GPS) */}
                <WeatherAdvisory lat={selected.lat} lng={selected.lng} speciesKey={speciesKey} />

                {/* Add log + logs list */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ color: '#0D6B8A' }}>{selected.name}</h3>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                      style={{ backgroundColor: '#00A878' }}
                    >
                      {t.dashboard.addLog}
                    </button>
                  </div>

                  {logs.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4">{t.dashboard.noLogs}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400 border-b">
                            <th className="py-2 pr-4 font-medium">{t.dashboard.date}</th>
                            <th className="py-2 pr-4 font-medium">{t.dashboard.logType}</th>
                            <th className="py-2 pr-4 font-medium">{t.dashboard.species}</th>
                            <th className="py-2 font-medium text-right">kg / qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(l => (
                            <tr key={l.id} className="border-b border-gray-50">
                              <td className="py-2 pr-4 text-gray-600">{l.log_date}</td>
                              <td className="py-2 pr-4">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {l.type === 'feed' ? t.dashboard.feeding : l.type === 'harvest' ? t.dashboard.harvest : t.dashboard.stocking}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-gray-600">{l.species || '—'}</td>
                              <td className="py-2 text-right text-gray-700 font-medium">
                                {l.type === 'feed' && `${l.feed_kg} kg`}
                                {l.type === 'harvest' && `${l.kg_harvested} kg`}
                                {l.type === 'stocking' && `${l.fingerlings_count ?? '—'} × ${l.avg_weight_g ?? '—'} g`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Species-aware FCR tool — always available */}
      <FCRTool defaultSpecies={selected ? speciesKey : 'Tilapia'} key={lang} />
    </div>
  );
}

function Kpi({ Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <Icon className="w-7 h-7 mb-2" style={{ color }} />
      <div className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs font-semibold mt-1" style={{ color }}>{sub}</div>}
    </div>
  );
}
