import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { mockOperators } from '../data/mockData';
import { useLang } from '../context/LangContext';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getColor = (country) => {
  const colors = { 'Sénégal': '#0D6B8A', 'Côte d\'Ivoire': '#00A878', 'Cameroun': '#F4A261' };
  return colors[country] || '#666';
};

const createIcon = (country) => {
  const color = getColor(country);
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export default function MapPage() {
  const { t } = useLang();
  const [filters, setFilters] = useState({ country: 'all', species: 'all', system: 'all', scale: 'all' });

  const filtered = mockOperators.filter(op => {
    if (filters.country !== 'all' && op.country !== filters.country) return false;
    if (filters.species !== 'all' && op.species !== filters.species) return false;
    if (filters.system !== 'all' && op.system !== filters.system) return false;
    if (filters.scale !== 'all' && op.scale !== filters.scale) return false;
    return true;
  });

  const countByCountry = filtered.reduce((acc, op) => {
    acc[op.country] = (acc[op.country] || 0) + 1;
    return acc;
  }, {});

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const selClass = (active) =>
    `w-full text-left px-3 py-1.5 rounded text-sm transition ${active ? 'text-white' : 'text-gray-700 hover:bg-gray-100'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0D6B8A' }}>🗺️ {t.map.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} opérateurs affichés</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-5">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-3" style={{ color: '#0D6B8A' }}>🔍 {t.map.filters}</h3>

            {/* Country */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t.map.country}</p>
              {['all', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun'].map(c => (
                <button
                  key={c}
                  onClick={() => setFilter('country', c)}
                  className={selClass(filters.country === c)}
                  style={filters.country === c ? { backgroundColor: '#0D6B8A' } : {}}
                >
                  {c === 'all' ? t.map.all : c}
                </button>
              ))}
            </div>

            {/* Species */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t.map.species}</p>
              {['all', 'Tilapia', 'Silure', 'Crevette', 'Carpe'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter('species', s)}
                  className={selClass(filters.species === s)}
                  style={filters.species === s ? { backgroundColor: '#00A878' } : {}}
                >
                  {s === 'all' ? t.map.all : s}
                </button>
              ))}
            </div>

            {/* System */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t.map.system}</p>
              {['all', 'Étang', 'Cage', 'Bassin', 'RAS', 'Rizipisciculture'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter('system', s)}
                  className={selClass(filters.system === s)}
                  style={filters.system === s ? { backgroundColor: '#0D6B8A' } : {}}
                >
                  {s === 'all' ? t.map.all : s}
                </button>
              ))}
            </div>

            {/* Scale */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t.map.scale}</p>
              {['all', 'Petite', 'Moyenne', 'Grande'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter('scale', s)}
                  className={selClass(filters.scale === s)}
                  style={filters.scale === s ? { backgroundColor: '#F4A261' } : {}}
                >
                  {s === 'all' ? t.map.all : s}
                </button>
              ))}
            </div>
          </div>

          {/* Country stats */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-3" style={{ color: '#0D6B8A' }}>📊 {t.map.stats}</h3>
            {Object.entries(countByCountry).map(([country, count]) => (
              <div key={country} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-gray-700">{country}</span>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getColor(country) }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold mb-3 text-gray-700">Légende</h3>
            {[
              { country: 'Sénégal', color: '#0D6B8A' },
              { country: 'Côte d\'Ivoire', color: '#00A878' },
              { country: 'Cameroun', color: '#F4A261' },
            ].map(l => (
              <div key={l.country} className="flex items-center gap-2 py-1">
                <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: l.color }} />
                <span className="text-sm text-gray-700">{l.country}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 h-[500px] lg:h-[600px]">
          <MapContainer
            center={[10, -5]}
            zoom={5}
            style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filtered.map(op => (
              <Marker key={op.id} position={[op.lat, op.lng]} icon={createIcon(op.country)}>
                <Popup>
                  <div className="min-w-48">
                    <div className="font-bold text-base mb-1" style={{ color: '#0D6B8A' }}>{op.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📍 {op.region}, {op.country}</div>
                      <div>🐟 {op.species}</div>
                      <div>🏊 {op.system}</div>
                      <div>📦 {op.production}t/an — {op.scale} échelle</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
