'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };
const BRAND = '#0D6B8A';
const TRANSPARENT_PNG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const DEFAULT_COORDS = [[-19.5, 19], [13.5, 19], [13.5, -1], [-19.5, -1]];

const STREET_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const SATELLITE_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    esri: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
};
const styleFor = (b) => (b === 'satellite' ? SATELLITE_STYLE : STREET_STYLE);

// color ramps [value, [r,g,b]]
const WAVE_STOPS = [[0, [44, 127, 184]], [1, [161, 218, 180]], [2, [254, 224, 139]], [3, [252, 141, 89]], [4, [215, 48, 39]]];
const SST_STOPS = [[18, [44, 127, 184]], [22, [77, 175, 74]], [26, [254, 224, 139]], [30, [252, 141, 89]], [33, [215, 48, 39]]];
const CUR_STOPS = [[0, [224, 243, 248]], [0.4, [123, 204, 196]], [0.9, [44, 127, 184]], [1.8, [8, 64, 129]]];
const WIND_STOPS = [[0, [237, 248, 251]], [4, [179, 205, 227]], [9, [140, 150, 198]], [16, [136, 65, 157]]];

const FIELDS = [
  { key: 'waves', src: 'fld-waves', acc: (c) => c.wave, stops: WAVE_STOPS },
  { key: 'sst', src: 'fld-sst', acc: (c) => c.sst, stops: SST_STOPS },
  { key: 'currents', src: 'fld-cur', acc: (c) => c.curVel, stops: CUR_STOPS },
  { key: 'wind', src: 'fld-wind', acc: (c) => c.windSpd, stops: WIND_STOPS },
];

const LAYER_MAP = {
  operators: ['op-clusters', 'op-cluster-count', 'op-point'],
  sites: ['site-clusters', 'site-cluster-count', 'site-point'],
  waves: ['fld-waves'],
  sst: ['fld-sst'],
  currents: ['fld-cur', 'fc-currents'],
  wind: ['fld-wind', 'fc-wind'],
};

const lerp = (a, b, t) => a + (b - a) * t;
function rampColor(stops, v) {
  if (v <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [v0, c0] = stops[i - 1], [v1, c1] = stops[i];
      const t = (v - v0) / (v1 - v0);
      return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
    }
  }
  return stops[stops.length - 1][1];
}

// Build a small grid-resolution canvas; MapLibre's linear raster resampling scales it
// into a smooth interpolated field over the bbox.
function fieldDataURL(fc, accessor, stops, alpha = 200) {
  const nLat = fc.lats.length, nLng = fc.lngs.length;
  const cv = document.createElement('canvas');
  cv.width = nLng; cv.height = nLat;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(nLng, nLat);
  for (let r = 0; r < nLat; r++) {
    const latIdx = nLat - 1 - r; // row 0 = north
    for (let c = 0; c < nLng; c++) {
      const cell = fc.cells[latIdx * nLng + c];
      const o = (r * nLng + c) * 4;
      const val = cell ? accessor(cell) : null;
      if (val == null || Number.isNaN(val)) { img.data[o + 3] = 0; continue; }
      const [rr, gg, bb] = rampColor(stops, val);
      img.data[o] = rr | 0; img.data[o + 1] = gg | 0; img.data[o + 2] = bb | 0; img.data[o + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL();
}
function fieldCoords(fc) {
  const { west, east, south, north, latStep, lngStep } = fc.bbox;
  const W = west - lngStep / 2, E = east + lngStep / 2, N = north + latStep / 2, S = south - latStep / 2;
  return [[W, N], [E, N], [E, S], [W, S]];
}
function pointsGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { curVel: p.curVel, curDir: p.curDir, windSpd: p.windSpd, windDir: p.windDir },
    })),
  };
}
function operatorsGeoJSON(operators) {
  return {
    type: 'FeatureCollection',
    features: operators.filter((o) => o.lat != null && o.lng != null)
      .map((o) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [o.lng, o.lat] }, properties: { id: o.id } })),
  };
}
function sitesGeoJSON(sites) {
  return {
    type: 'FeatureCollection',
    features: sites.filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lng, s.lat] }, properties: { id: s.id } })),
  };
}
function countryEl(flag, color) {
  const el = document.createElement('div');
  el.style.cssText =
    `display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;` +
    `background:#fff;border:3px solid ${color};box-shadow:0 1px 6px rgba(0,0,0,.3);font-size:16px;cursor:pointer`;
  el.textContent = flag;
  return el;
}
function arrowImage(fill) {
  const s = 28;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.translate(s / 2, s / 2);
  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(6, 8); ctx.lineTo(0, 3.5); ctx.lineTo(-6, 8); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
  return ctx.getImageData(0, 0, s, s);
}

function Legend({ layers, fr }) {
  const fields = [];
  if (layers?.has('waves')) fields.push({ title: fr ? 'Vagues (m)' : 'Waves (m)', stops: WAVE_STOPS });
  if (layers?.has('sst')) fields.push({ title: fr ? 'Temp. mer (°C)' : 'Sea temp (°C)', stops: SST_STOPS });
  if (layers?.has('currents')) fields.push({ title: fr ? 'Courants (m/s)' : 'Currents (m/s)', stops: CUR_STOPS, arrow: true });
  if (layers?.has('wind')) fields.push({ title: fr ? 'Vent (m/s)' : 'Wind (m/s)', stops: WIND_STOPS, arrow: true });
  if (!fields.length) return null;
  const css = (s) => `linear-gradient(90deg, ${s.map(([v, c], i) => `rgb(${c[0]},${c[1]},${c[2]}) ${(i / (s.length - 1)) * 100}%`).join(', ')})`;
  return (
    <div className="absolute bottom-6 right-3 z-[500] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-[11px] text-gray-600 w-[180px] space-y-2">
      {fields.map((f) => (
        <div key={f.title}>
          <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">{f.arrow && <span>➤</span>}{f.title}</div>
          <div className="h-2.5 rounded" style={{ background: css(f.stops) }} />
          <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
            <span>{f.stops[0][0]}</span><span>{f.stops[f.stops.length - 1][0]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExploreMap({ operators = [], sites = [], countries = [], layers, basemap = 'osm', forecast = null, focus = null, onSelect, onBounds }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const countryMarkersRef = useRef([]);
  const opIndexRef = useRef(new Map());
  const siteIndexRef = useRef(new Map());
  const cb = useRef({ onSelect, onBounds });

  useEffect(() => {
    cb.current = { onSelect, onBounds };
    opIndexRef.current = new Map(operators.map((o) => [o.id, o]));
    siteIndexRef.current = new Map(sites.map((s) => [s.id, s]));
  });

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleFor(basemap),
      center: [20, 3],
      zoom: 2.7,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true, showAccuracyCircle: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    const reportBounds = () => {
      const b = map.getBounds();
      const w = b.getWest(), e = b.getEast(), s = b.getSouth(), n = b.getNorth();
      cb.current.onBounds?.({ contains: ([lat, lng]) => lat >= s && lat <= n && lng >= w && lng <= e });
    };
    map.on('moveend', reportBounds);

    function applyVisibility() {
      const set = mapRef.current?._layers;
      for (const [key, ids] of Object.entries(LAYER_MAP)) {
        const vis = set?.has(key) ? 'visible' : 'none';
        for (const id of ids) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
      }
    }

    function applyForecastData() {
      const fc = mapRef.current?._forecast;
      if (!fc || !fc.lats || !fc.cells?.length) return;
      const coords = fieldCoords(fc);
      for (const f of FIELDS) {
        const src = map.getSource(f.src);
        if (src) src.updateImage({ url: fieldDataURL(fc, f.acc, f.stops), coordinates: coords });
      }
      map.getSource('forecast-points')?.setData(pointsGeoJSON(fc.points || []));
    }

    function addDataLayers() {
      if (!map.isStyleLoaded()) return;
      if (!map.hasImage('arrow-cur')) map.addImage('arrow-cur', arrowImage('#0a3a4a'), { pixelRatio: 2 });
      if (!map.hasImage('arrow-wind')) map.addImage('arrow-wind', arrowImage('#3b2a5a'), { pixelRatio: 2 });

      // ── smooth field rasters (added first, under everything else) ──
      for (const f of FIELDS) {
        if (!map.getSource(f.src)) {
          map.addSource(f.src, { type: 'image', url: TRANSPARENT_PNG, coordinates: DEFAULT_COORDS });
          map.addLayer({ id: f.src, type: 'raster', source: f.src, layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.72, 'raster-resampling': 'linear' } });
        }
      }

      // ── operators (clustered) ──
      if (!map.getSource('operators')) {
        map.addSource('operators', { type: 'geojson', data: operatorsGeoJSON([...opIndexRef.current.values()]), cluster: true, clusterRadius: 50, clusterMaxZoom: 12 });
        map.addLayer({
          id: 'op-clusters', type: 'circle', source: 'operators', filter: ['has', 'point_count'],
          paint: { 'circle-color': 'rgba(13,107,138,0.85)', 'circle-stroke-color': 'rgba(255,255,255,0.85)', 'circle-stroke-width': 3, 'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 50, 26] },
        });
        map.addLayer({
          id: 'op-cluster-count', type: 'symbol', source: 'operators', filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 }, paint: { 'text-color': '#fff' },
        });
        map.addLayer({
          id: 'op-point', type: 'circle', source: 'operators', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': BRAND, 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
        });
        map.on('click', 'op-clusters', (e) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ['op-clusters'] })[0];
          if (!f) return;
          map.getSource('operators').getClusterExpansionZoom(f.properties.cluster_id).then((z) => map.easeTo({ center: f.geometry.coordinates, zoom: z }));
        });
        map.on('click', 'op-point', (e) => {
          const o = opIndexRef.current.get(e.features[0].properties.id);
          if (o) cb.current.onSelect?.({ kind: 'operator', data: o });
        });
        for (const id of ['op-clusters', 'op-point']) {
          map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
        }
      }

      // ── aquaculture sites (Places, clustered, green) ──
      if (!map.getSource('sites')) {
        map.addSource('sites', { type: 'geojson', data: sitesGeoJSON([...siteIndexRef.current.values()]), cluster: true, clusterRadius: 50, clusterMaxZoom: 12 });
        map.addLayer({
          id: 'site-clusters', type: 'circle', source: 'sites', filter: ['has', 'point_count'],
          paint: { 'circle-color': 'rgba(244,162,97,0.9)', 'circle-stroke-color': 'rgba(255,255,255,0.85)', 'circle-stroke-width': 3, 'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 50, 26] },
        });
        map.addLayer({
          id: 'site-cluster-count', type: 'symbol', source: 'sites', filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 }, paint: { 'text-color': '#fff' },
        });
        map.addLayer({
          id: 'site-point', type: 'circle', source: 'sites', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': '#F4A261', 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
        });
        map.on('click', 'site-clusters', (e) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ['site-clusters'] })[0];
          if (!f) return;
          map.getSource('sites').getClusterExpansionZoom(f.properties.cluster_id).then((z) => map.easeTo({ center: f.geometry.coordinates, zoom: z }));
        });
        map.on('click', 'site-point', (e) => {
          const s = siteIndexRef.current.get(e.features[0].properties.id);
          if (s) cb.current.onSelect?.({ kind: 'site', data: s });
        });
        for (const id of ['site-clusters', 'site-point']) {
          map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
        }
      }

      // ── direction arrows for currents / wind (on top) ──
      if (!map.getSource('forecast-points')) {
        map.addSource('forecast-points', { type: 'geojson', data: pointsGeoJSON(mapRef.current?._forecast?.points || []) });
        map.addLayer({
          id: 'fc-currents', type: 'symbol', source: 'forecast-points',
          layout: { 'icon-image': 'arrow-cur', 'icon-allow-overlap': true, 'icon-rotation-alignment': 'map', 'icon-rotate': ['get', 'curDir'], 'icon-size': ['interpolate', ['linear'], ['get', 'curVel'], 0, 0.45, 1, 0.9, 2, 1.3] },
        });
        map.addLayer({
          id: 'fc-wind', type: 'symbol', source: 'forecast-points',
          layout: { 'icon-image': 'arrow-wind', 'icon-allow-overlap': true, 'icon-rotation-alignment': 'map', 'icon-rotate': ['+', ['get', 'windDir'], 180], 'icon-size': ['interpolate', ['linear'], ['get', 'windSpd'], 0, 0.45, 8, 0.85, 16, 1.25] },
        });
      }

      applyVisibility();
      applyForecastData();
    }

    map._applyVisibility = applyVisibility;
    map._applyForecastData = applyForecastData;
    map.on('load', () => { addDataLayers(); reportBounds(); });
    map.on('styledata', () => addDataLayers());

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (mapRef.current) mapRef.current.setStyle(styleFor(basemap)); }, [basemap]);

  useEffect(() => { mapRef.current?.getSource('operators')?.setData(operatorsGeoJSON(operators)); }, [operators]);

  useEffect(() => { mapRef.current?.getSource('sites')?.setData(sitesGeoJSON(sites)); }, [sites]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: focus, zoom: Math.max(map.getZoom(), 9), essential: true });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map._forecast = forecast;
    map._applyForecastData?.();
  }, [forecast]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map._layers = layers;
    map._applyVisibility?.();
  }, [layers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    countryMarkersRef.current.forEach((m) => m.remove());
    countryMarkersRef.current = [];
    if (!layers?.has('countries')) return;
    for (const c of countries) {
      const el = countryEl(c.flag, COUNTRY_COLOR[c.name] || BRAND);
      el.addEventListener('click', () => cb.current.onSelect?.({ kind: 'country', data: c }));
      const m = new maplibregl.Marker({ element: el }).setLngLat([c.coords[1], c.coords[0]]).addTo(map);
      countryMarkersRef.current.push(m);
    }
  }, [countries, layers]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <Legend layers={layers} fr={typeof document !== 'undefined' && document.documentElement.lang === 'fr'} />
    </div>
  );
}
