'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Building2, Package, Target } from 'lucide-react';
import { countries } from '../data/institutions';

// Leaflet touches `window`, so this component is loaded via next/dynamic(ssr:false).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };

const flagIcon = (flag, color) => L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:white;border:3px solid ${color};box-shadow:0 1px 6px rgba(0,0,0,.3);font-size:18px">${flag}</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function CountryMap() {
  return (
    <MapContainer center={[9, -1]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {countries.map(c => (
        <Marker key={c.name} position={c.coords} icon={flagIcon(c.flag, COUNTRY_COLOR[c.name] || '#0D6B8A')}>
          <Popup>
            <div className="min-w-52">
              <div className="font-bold text-base mb-1" style={{ color: '#0D6B8A' }}>{c.flag} {c.name}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-start gap-1.5"><Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.authority.name}</div>
                {c.production.map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5"><Package className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span>{p.value} <span className="text-gray-400">({p.source}, {p.year})</span></span></div>
                ))}
                <div className="flex items-start gap-1.5"><Target className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.target}</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
