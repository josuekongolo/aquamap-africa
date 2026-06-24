'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
// CSS is safe to import statically; the JS plugins (which expect a global L) are
// imported dynamically after window.L is set — see the ready effect below.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'leaflet-geosearch/dist/geosearch.css';

const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };

function operatorIcon(color) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    className: '', iconSize: [14, 14], iconAnchor: [7, 7],
  });
}
function flagIcon(flag, color) {
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 1px 6px rgba(0,0,0,.3);font-size:16px">${flag}</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16],
  });
}
function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const size = n < 10 ? 34 : n < 50 ? 42 : 52;
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:rgba(13,107,138,.85);color:#fff;font-weight:700;border:3px solid rgba(255,255,255,.85)">${n}</div>`,
    className: '', iconSize: [size, size],
  });
}

// All imperative Leaflet plumbing lives here (controls added once; data layers
// rebuilt when props change). Reports bounds + selection up to the shell.
function Engine({ operators, countries, layers, onSelect, onBounds }) {
  const map = useMap();
  const [plugins, setPlugins] = useState(null);
  const ready = !!plugins;

  // Load the Leaflet plugins once. markercluster attaches to the global L;
  // fullscreen/locate (ESM) export control classes we instantiate directly.
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (typeof window !== 'undefined') window.L = L;
      const [, fs, loc] = await Promise.all([
        import('leaflet.markercluster'),
        import('leaflet.fullscreen'),
        import('leaflet.locatecontrol'),
      ]);
      if (!cancel) setPlugins({ FullScreen: fs.default || fs.FullScreen, LocateControl: loc.LocateControl });
    })();
    return () => { cancel = true; };
  }, []);

  // One-time controls: search, fullscreen, locate, scale, live coordinates.
  useEffect(() => {
    if (!plugins) return;
    const search = new GeoSearchControl({
      provider: new OpenStreetMapProvider(), style: 'bar', showMarker: false, autoClose: true, keepResult: false,
    });
    map.addControl(search);
    map.addControl(new plugins.FullScreen({ position: 'topright', title: 'Plein écran' }));
    map.addControl(new plugins.LocateControl({ position: 'topright', flyTo: true, showPopup: false }));
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    const coords = L.control({ position: 'bottomleft' });
    coords.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.style.cssText = 'background:rgba(255,255,255,.9);padding:2px 8px;border-radius:6px;font:11px/1.4 monospace;color:#334155;box-shadow:0 1px 3px rgba(0,0,0,.2)';
      div.innerHTML = '—';
      coords._div = div;
      return div;
    };
    coords.addTo(map);
    const onMove = (e) => { if (coords._div) coords._div.innerHTML = `${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`; };
    map.on('mousemove', onMove);

    const report = () => onBounds && onBounds(map.getBounds());
    map.on('moveend', report);
    report();

    return () => {
      map.off('mousemove', onMove);
      map.off('moveend', report);
      map.removeControl(search);
    };
  }, [map, plugins, onBounds]);

  // Operator cluster layer
  useEffect(() => {
    if (!ready || !layers.has('operators')) return;
    const group = L.markerClusterGroup({ iconCreateFunction: clusterIcon, showCoverageOnHover: false, maxClusterRadius: 50 });
    for (const o of operators) {
      if (o.lat == null || o.lng == null) continue;
      const m = L.marker([o.lat, o.lng], { icon: operatorIcon('#0D6B8A') });
      m.on('click', () => onSelect({ kind: 'operator', data: o }));
      group.addLayer(m);
    }
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map, ready, operators, layers, onSelect]);

  // Country institutional layer
  useEffect(() => {
    if (!ready || !layers.has('countries')) return;
    const group = L.layerGroup();
    for (const c of countries) {
      const m = L.marker(c.coords, { icon: flagIcon(c.flag, COUNTRY_COLOR[c.name] || '#0D6B8A') });
      m.on('click', () => onSelect({ kind: 'country', data: c }));
      group.addLayer(m);
    }
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [map, ready, countries, layers, onSelect]);

  return null;
}

const BASEMAPS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
};

export default function ExploreMap({ operators = [], countries = [], layers, basemap = 'osm', onSelect, onBounds }) {
  const tiles = BASEMAPS[basemap] || BASEMAPS.osm;
  return (
    <MapContainer center={[9, -3]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={true}>
      <TileLayer key={basemap} url={tiles.url} attribution={tiles.attribution} />
      <Engine operators={operators} countries={countries} layers={layers} onSelect={onSelect} onBounds={onBounds} />
    </MapContainer>
  );
}
