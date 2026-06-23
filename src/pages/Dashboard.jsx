import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadialBarChart, RadialBar, ResponsiveContainer, Cell
} from 'recharts';
import { mockProductionData } from '../data/mockData';
import { useLang } from '../context/LangContext';

const FCR_VALUE = 1.85;

function FCRGauge({ value }) {
  const color = value < 1.8 ? '#00A878' : value < 2.5 ? '#F4A261' : '#ef4444';
  const data = [{ value: Math.min(value / 4 * 100, 100), fill: color }];
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%" cy="80%"
          innerRadius="60%"
          outerRadius="90%"
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <RadialBar dataKey="value" fill={color} cornerRadius={10} background={{ fill: '#e5e7eb' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-12">
        <div className="text-3xl font-bold" style={{ color }}>{value.toFixed(2)}</div>
        <div className="text-xs text-gray-500">FCR</div>
      </div>
      <div className="flex gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Excellent ({'<'}1.8)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>Correct</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>À améliorer</span>
      </div>
    </div>
  );
}

function HarvestModal({ onClose, t }) {
  const [form, setForm] = useState({ date: '', species: 'Tilapia', kg: '', sold: '', price: '', buyer: '' });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h3 className="font-bold text-lg mb-5" style={{ color: '#0D6B8A' }}>🎣 {t.dashboard.logHarvest}</h3>
        <div className="space-y-4">
          {[
            { label: t.dashboard.date, key: 'date', type: 'date' },
            { label: t.dashboard.kgHarvested, key: 'kg', type: 'number', placeholder: '0' },
            { label: t.dashboard.kgSold, key: 'sold', type: 'number', placeholder: '0' },
            { label: t.dashboard.pricePerKg, key: 'price', type: 'number', placeholder: '1500' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.speciesLabel}</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={form.species}
              onChange={e => setForm(x => ({ ...x, species: e.target.value }))}
            >
              <option>Tilapia</option>
              <option>Silure</option>
              <option>Crevette</option>
              <option>Carpe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.buyerType}</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={form.buyer}
              onChange={e => setForm(x => ({ ...x, buyer: e.target.value }))}
            >
              <option value="">Sélectionner...</option>
              <option>Marché local</option>
              <option>Restaurateur</option>
              <option>Grossiste</option>
              <option>Consommateur direct</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {t.dashboard.cancel}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#00A878' }}
          >
            ✓ {t.dashboard.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [feed, setFeed] = useState('');
  const [weight, setWeight] = useState('');
  const [calcFCR, setCalcFCR] = useState(null);

  const kpis = [
    { label: t.dashboard.fcr, value: FCR_VALUE.toFixed(2), icon: '📊', color: '#00A878' },
    { label: t.dashboard.production, value: '2 400 kg', icon: '🐟', color: '#0D6B8A' },
    { label: t.dashboard.revenue, value: '3 600 000 FCFA', icon: '💰', color: '#F4A261' },
    { label: t.dashboard.harvest, value: '15 juil. 2024', icon: '🗓️', color: '#8b5cf6' },
  ];

  const handleCalcFCR = () => {
    if (feed && weight) {
      setCalcFCR((parseFloat(feed) / parseFloat(weight)).toFixed(2));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {showModal && <HarvestModal onClose={() => setShowModal(false)} t={t} />}

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0D6B8A' }}>
            🌊 {t.dashboard.welcome} Mamadou Diallo
          </h1>
          <p className="text-gray-500 text-sm mt-1">Exploitation Tilapia — Dakar, Sénégal 🇸🇳</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowModal(true)}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            style={{ backgroundColor: '#0D6B8A' }}
          >
            {t.dashboard.addHarvest}
          </button>
          <button
            className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            style={{ backgroundColor: '#00A878' }}
          >
            {t.dashboard.addSeed}
          </button>
          <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50">
            ⚠️ {t.dashboard.incident}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-5">
            <div className="text-3xl mb-2">{k.icon}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-sm text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Production chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>📈 {t.dashboard.trend}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockProductionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="production" name="Production (kg)" fill="#0D6B8A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Objectif (kg)" fill="#00A878" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* FCR gauge */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-2" style={{ color: '#0D6B8A' }}>⚖️ {t.dashboard.fcrGauge}</h3>
          <FCRGauge value={FCR_VALUE} />
        </div>
      </div>

      {/* FCR Calculator */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>🧮 {t.dashboard.fcrCalc}</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.feed}</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={feed}
              onChange={e => setFeed(e.target.value)}
              placeholder="Ex: 1000"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.dashboard.weight}</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="Ex: 500"
            />
          </div>
          <button
            onClick={handleCalcFCR}
            className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: '#0D6B8A' }}
          >
            {t.dashboard.calculate}
          </button>
          {calcFCR && (
            <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
              <div className="text-xs text-gray-500">FCR calculé</div>
              <div
                className="text-2xl font-bold"
                style={{ color: parseFloat(calcFCR) < 2 ? '#00A878' : parseFloat(calcFCR) < 2.5 ? '#F4A261' : '#ef4444' }}
              >
                {calcFCR}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">FCR = Aliments distribués ÷ Gain de poids. Objectif : FCR &lt; 2.0 pour le tilapia.</p>
      </div>
    </div>
  );
}
