'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import * as WeatherLayers from 'weatherlayers-gl';
import { scalarTexture, vectorTexture, forecastBounds, SST_PALETTE, WAVE_PALETTE } from '../../lib/weatherTextures';

const COUNTRY_COLOR = { 'Sénégal': '#0D6B8A', "Côte d'Ivoire": '#00A878', 'Cameroun': '#F4A261' };
const BRAND = '#0D6B8A';

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

// Particle colours for the animated fields.
const CURRENT_COLOR = [86, 204, 224];   // cyan
const WIND_COLOR = [255, 255, 255];     // white

// Only these native MapLibre layers are toggled via visibility; the marine
// fields (sst/waves/currents/wind) are deck.gl/WeatherLayers layers, rebuilt
// from the enabled set + forecast in updateDeckLayers().
const LAYER_MAP = {
  operators: ['op-clusters', 'op-cluster-count', 'op-point'],
  zones: ['zone-fill', 'zone-line'],
  sites: ['site-clusters', 'site-cluster-count', 'site-point'],
};

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
function zonesGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.filter((z) => z.geojson?.type === 'Polygon')
      .map((z) => ({ type: 'Feature', geometry: z.geojson, properties: { id: z.id, color: z.color || BRAND } })),
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

// Build the WeatherLayers layer stack from the enabled set + forecast grid.
// Rasters (heatmaps) sit under the particle fields.
function buildDeckLayers(fc, set) {
  if (!fc || !fc.lats || !fc.cells?.length || !set) return [];
  const bounds = forecastBounds(fc);
  const layers = [];

  if (set.has('waves')) {
    layers.push(new WeatherLayers.RasterLayer({
      id: 'wl-waves', image: scalarTexture(fc, (c) => c.wave), imageType: WeatherLayers.ImageType.SCALAR,
      bounds, palette: WAVE_PALETTE, opacity: 0.6, imageInterpolation: WeatherLayers.ImageInterpolation.CUBIC,
    }));
  }
  if (set.has('sst')) {
    layers.push(new WeatherLayers.RasterLayer({
      id: 'wl-sst', image: scalarTexture(fc, (c) => c.sst), imageType: WeatherLayers.ImageType.SCALAR,
      bounds, palette: SST_PALETTE, opacity: 0.72, imageInterpolation: WeatherLayers.ImageInterpolation.CUBIC,
    }));
  }
  if (set.has('currents')) {
    layers.push(new WeatherLayers.ParticleLayer({
      id: 'wl-currents', image: vectorTexture(fc, (c) => c.curVel, (c) => c.curDir, false),
      imageType: WeatherLayers.ImageType.VECTOR, bounds,
      numParticles: 1400, maxAge: 40, speedFactor: 40, width: 2.2,
      color: CURRENT_COLOR, opacity: 0.9, animate: true,
    }));
  }
  if (set.has('wind')) {
    layers.push(new WeatherLayers.ParticleLayer({
      id: 'wl-wind', image: vectorTexture(fc, (c) => c.windSpd, (c) => c.windDir, true),
      imageType: WeatherLayers.ImageType.VECTOR, bounds,
      numParticles: 2000, maxAge: 28, speedFactor: 9, width: 1.6,
      color: WIND_COLOR, opacity: 0.85, animate: true,
    }));
  }
  return layers;
}

function Legend({ layers, fr }) {
  const items = [];
  const grad = (pal) => {
    const min = pal[0][0], max = pal[pal.length - 1][0];
    const stops = pal.map(([v, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round(((v - min) / (max - min)) * 100)}%`);
    return { css: `linear-gradient(90deg, ${stops.join(', ')})`, min, max };
  };
  if (layers?.has('sst')) items.push({ kind: 'ramp', title: fr ? 'Temp. mer (°C)' : 'Sea temp (°C)', ...grad(SST_PALETTE) });
  if (layers?.has('waves')) items.push({ kind: 'ramp', title: fr ? 'Vagues (m)' : 'Waves (m)', ...grad(WAVE_PALETTE) });
  if (layers?.has('currents')) items.push({ kind: 'flow', title: fr ? 'Courants' : 'Currents', color: CURRENT_COLOR });
  if (layers?.has('wind')) items.push({ kind: 'flow', title: fr ? 'Vent' : 'Wind', color: WIND_COLOR });
  if (!items.length) return null;
  return (
    <div className="absolute bottom-6 right-3 z-[500] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-[11px] text-gray-600 w-[180px] space-y-2">
      {items.map((f) => (
        <div key={f.title}>
          <div className="font-semibold text-gray-700 mb-1">{f.title}</div>
          {f.kind === 'ramp' ? (
            <>
              <div className="h-2.5 rounded" style={{ background: f.css }} />
              <div className="flex justify-between mt-0.5 text-[10px] text-gray-400"><span>{f.min}</span><span>{f.max}</span></div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="inline-block h-0.5 w-8 rounded-full" style={{ backgroundColor: `rgb(${f.color[0]},${f.color[1]},${f.color[2]})`, boxShadow: '0 0 0 1px rgba(0,0,0,.12)' }} />
              {fr ? 'flux animé' : 'animated flow'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ExploreMap({ operators = [], sites = [], countries = [], zones = [], layers, basemap = 'osm', forecast = null, focus = null, onSelect, onBounds }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const countryMarkersRef = useRef([]);
  const opIndexRef = useRef(new Map());
  const siteIndexRef = useRef(new Map());
  const zoneIndexRef = useRef(new Map());
  const cb = useRef({ onSelect, onBounds });

  useEffect(() => {
    cb.current = { onSelect, onBounds };
    opIndexRef.current = new Map(operators.map((o) => [o.id, o]));
    siteIndexRef.current = new Map(sites.map((s) => [s.id, s]));
    zoneIndexRef.current = new Map(zones.map((z) => [z.id, z]));
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

    // deck.gl overlay (non-interleaved → its own canvas, no WebGL-context clash
    // with MapLibre) that hosts the animated WeatherLayers marine fields.
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
    map.addControl(overlay);
    map._deckOverlay = overlay;

    const updateDeckLayers = () => {
      overlay.setProps({ layers: buildDeckLayers(mapRef.current?._forecast, mapRef.current?._layers) });
    };
    map._updateDeckLayers = updateDeckLayers;

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

    function addDataLayers() {
      if (!map.isStyleLoaded()) return;

      // ── co-management zones (polygons, under the point layers) ──
      if (!map.getSource('zones')) {
        map.addSource('zones', { type: 'geojson', data: zonesGeoJSON([...zoneIndexRef.current.values()]) });
        map.addLayer({
          id: 'zone-fill', type: 'fill', source: 'zones',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2 },
        });
        map.addLayer({
          id: 'zone-line', type: 'line', source: 'zones',
          paint: { 'line-color': ['get', 'color'], 'line-width': 2 },
        });
        map.on('click', 'zone-fill', (e) => {
          const hit = map.queryRenderedFeatures(e.point, { layers: ['op-point', 'op-clusters', 'site-point', 'site-clusters'].filter((id) => map.getLayer(id)) });
          if (hit.length) return;
          const z = zoneIndexRef.current.get(e.features[0].properties.id);
          if (z) cb.current.onSelect?.({ kind: 'zone', data: z });
        });
        map.on('mouseenter', 'zone-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'zone-fill', () => { map.getCanvas().style.cursor = ''; });
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

      // ── aquaculture sites (Places, clustered, orange) ──
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

      applyVisibility();
    }

    map._applyVisibility = applyVisibility;
    map.on('load', () => { addDataLayers(); reportBounds(); updateDeckLayers(); });
    map.on('styledata', () => addDataLayers());

    return () => { map._deckOverlay = null; map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (mapRef.current) mapRef.current.setStyle(styleFor(basemap)); }, [basemap]);

  useEffect(() => { mapRef.current?.getSource('operators')?.setData(operatorsGeoJSON(operators)); }, [operators]);

  useEffect(() => { mapRef.current?.getSource('sites')?.setData(sitesGeoJSON(sites)); }, [sites]);

  useEffect(() => { mapRef.current?.getSource('zones')?.setData(zonesGeoJSON(zones)); }, [zones]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({ center: focus, zoom: Math.max(map.getZoom(), 9), essential: true });
  }, [focus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map._forecast = forecast;
    map._updateDeckLayers?.();
  }, [forecast]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map._layers = layers;
    map._applyVisibility?.();
    map._updateDeckLayers?.();
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
