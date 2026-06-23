import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { mockOperators, mockChallenges, mockFCRDistribution } from '../data/mockData';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLang } from '../context/LangContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS = ['#0D6B8A', '#00A878', '#F4A261', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

const countryStats = [
  { name: 'Sénégal', operators: 187, production: 342, fcr: 2.1 },
  { name: 'Côte d\'Ivoire', operators: 156, production: 289, fcr: 2.0 },
  { name: 'Cameroun', operators: 143, production: 268, fcr: 2.3 },
];

export default function Admin() {
  const { t } = useLang();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterScale, setFilterScale] = useState('all');

  const login = () => {
    if (password === 'aquaadmin2024') {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const filteredOps = mockOperators.filter(op => {
    if (filterCountry !== 'all' && op.country !== filterCountry) return false;
    if (filterSpecies !== 'all' && op.species !== filterSpecies) return false;
    if (filterScale !== 'all' && op.scale !== filterScale) return false;
    return true;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-6" style={{ color: '#0D6B8A' }}>
            {t.admin.title}
          </h2>
          <div className="space-y-4">
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-400 text-center"
              placeholder={t.admin.password}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            {error && (
              <p className="text-red-500 text-sm">{t.admin.wrongPass}</p>
            )}
            <button
              onClick={login}
              className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 transition"
              style={{ backgroundColor: '#0D6B8A' }}
            >
              {t.admin.login}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0D6B8A' }}>
            🛡️ {t.admin.title}
          </h1>
          <p className="text-gray-500 text-sm">Vue d'ensemble du secteur aquacole</p>
        </div>
        <button
          className="text-white px-5 py-2 rounded-lg font-medium hover:opacity-90"
          style={{ backgroundColor: '#00A878' }}
          onClick={() => alert('Export CSV généré (simulation)')}
        >
          {t.admin.export}
        </button>
      </div>

      {/* Country KPIs */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {countryStats.map(c => (
          <div key={c.name} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-lg mb-3" style={{ color: '#0D6B8A' }}>{c.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Opérateurs</span>
                <span className="font-bold">{c.operators}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Production (t)</span>
                <span className="font-bold">{c.production}t</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">FCR moyen</span>
                <span className="font-bold" style={{ color: c.fcr < 2.2 ? '#00A878' : '#F4A261' }}>
                  {c.fcr}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* FCR Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>📊 {t.admin.fcrDist}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockFCRDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fcr" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Opérateurs" radius={[4, 4, 0, 0]}>
                {mockFCRDistribution.map((_, i) => (
                  <Cell key={i} fill={['#00A878', '#00A878', '#F4A261', '#F4A261', '#ef4444'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Challenges */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>⚠️ {t.admin.challenges}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockChallenges} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="challenge" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" name="Nb opérateurs" fill="#0D6B8A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Species pie */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-4" style={{ color: '#0D6B8A' }}>🐟 Répartition par espèce</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Tilapia', value: 312 },
                  { name: 'Silure', value: 98 },
                  { name: 'Carpe', value: 67 },
                  { name: 'Crevette', value: 23 },
                ]}
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Admin map */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold mb-3" style={{ color: '#0D6B8A' }}>🗺️ Carte des opérateurs</h3>
          <div style={{ height: '200px' }}>
            <MapContainer center={[8, 0]} zoom={4} style={{ height: '100%', borderRadius: '0.5rem' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mockOperators.map(op => (
                <Marker key={op.id} position={[op.lat, op.lng]}>
                  <Popup>{op.name} — {op.species}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Operators table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="font-semibold" style={{ color: '#0D6B8A' }}>👥 {t.admin.operators} ({filteredOps.length})</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'filterCountry', val: filterCountry, set: setFilterCountry, opts: ['all', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun'], label: t.admin.filterCountry },
              { key: 'filterSpecies', val: filterSpecies, set: setFilterSpecies, opts: ['all', 'Tilapia', 'Silure', 'Crevette', 'Carpe'], label: t.admin.filterSpecies },
              { key: 'filterScale', val: filterScale, set: setFilterScale, opts: ['all', 'Petite', 'Moyenne', 'Grande'], label: t.admin.filterScale },
            ].map(f => (
              <select
                key={f.key}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={f.val}
                onChange={e => f.set(e.target.value)}
              >
                <option value="all">{f.label}</option>
                {f.opts.filter(o => o !== 'all').map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b">
                <th className="text-left py-2 px-3">Nom</th>
                <th className="text-left py-2 px-3">Pays</th>
                <th className="text-left py-2 px-3">Région</th>
                <th className="text-left py-2 px-3">Espèce</th>
                <th className="text-left py-2 px-3">Système</th>
                <th className="text-left py-2 px-3">Échelle</th>
                <th className="text-right py-2 px-3">Production</th>
              </tr>
            </thead>
            <tbody>
              {filteredOps.slice(0, 20).map((op, i) => (
                <tr key={op.id} className={`border-b last:border-0 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="py-2 px-3 font-medium text-gray-800">{op.name}</td>
                  <td className="py-2 px-3 text-gray-600">{op.country}</td>
                  <td className="py-2 px-3 text-gray-600">{op.region}</td>
                  <td className="py-2 px-3">{op.species}</td>
                  <td className="py-2 px-3">{op.system}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      op.scale === 'Grande' ? 'bg-blue-100 text-blue-700' :
                      op.scale === 'Moyenne' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {op.scale}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{op.production}t</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
