'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Undo2, Eraser } from 'lucide-react';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

const emptyFC = { type: 'FeatureCollection', features: [] };

function zonesFC(zones) {
  return {
    type: 'FeatureCollection',
    features: (zones || [])
      .filter((z) => z.geojson?.type === 'Polygon')
      .map((z) => ({ type: 'Feature', geometry: z.geojson, properties: { color: z.color || '#0D6B8A', name: z.name } })),
  };
}

function draftFC(ring) {
  const features = ring.map(([lng, lat]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }));
  if (ring.length >= 2) {
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: ring }, properties: {} });
  }
  if (ring.length >= 3) {
    features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] }, properties: { fill: true } });
  }
  return { type: 'FeatureCollection', features };
}

// Click-to-draw polygon editor (MapLibre). Existing zones are shown as context;
// each click adds a vertex to the draft ring, reported up via onChange.
export default function ZoneMapEditor({ existingZones = [], center = null, color = '#0D6B8A', onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ring, setRing] = useState([]);
  const cb = useRef(onChange);
  const colorRef = useRef(color);

  useEffect(() => { cb.current = onChange; colorRef.current = color; });

  useEffect(() => {
    const fc = zonesFC(existingZones);
    let mapCenter = center || [10, 5];
    let zoom = center ? 9 : 3.6;
    if (!center && fc.features.length) {
      const first = fc.features[0].geometry.coordinates[0][0];
      mapCenter = first; zoom = 9;
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: mapCenter,
      zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('existing', { type: 'geojson', data: zonesFC(existingZones) });
      map.addLayer({ id: 'existing-fill', type: 'fill', source: 'existing', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.18 } });
      map.addLayer({ id: 'existing-line', type: 'line', source: 'existing', paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [2, 1.5] } });
      map.addSource('draft', { type: 'geojson', data: emptyFC });
      map.addLayer({ id: 'draft-fill', type: 'fill', source: 'draft', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': colorRef.current, 'fill-opacity': 0.25 } });
      map.addLayer({ id: 'draft-line', type: 'line', source: 'draft', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': colorRef.current, 'line-width': 2 } });
      map.addLayer({ id: 'draft-points', type: 'circle', source: 'draft', filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': '#fff', 'circle-radius': 4, 'circle-stroke-color': colorRef.current, 'circle-stroke-width': 2 } });
      map.getCanvas().style.cursor = 'crosshair';
    });

    map.on('click', (e) => {
      setRing((r) => [...r, [e.lngLat.lng, e.lngLat.lat]]);
    });

    return () => { map.remove(); mapRef.current = null; };
    // The editor is remounted (via key) to reset; props are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push draft + notify parent whenever the ring changes.
  useEffect(() => {
    const map = mapRef.current;
    const apply = () => map?.getSource('draft')?.setData(draftFC(ring));
    if (map?.isStyleLoaded()) apply(); else map?.once('load', apply);
    cb.current?.(ring);
  }, [ring]);

  // Recolor the draft when the selected zone type changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('draft-fill')) return;
    map.setPaintProperty('draft-fill', 'fill-color', color);
    map.setPaintProperty('draft-line', 'line-color', color);
    map.setPaintProperty('draft-points', 'circle-stroke-color', color);
  }, [color]);

  return (
    <div className="relative h-72 rounded-lg overflow-hidden border">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-2 left-2 z-10 flex gap-1.5">
        <button onClick={() => setRing((r) => r.slice(0, -1))} disabled={!ring.length}
          className="bg-white rounded-md shadow px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-1">
          <Undo2 className="size-3.5" /> Undo
        </button>
        <button onClick={() => setRing([])} disabled={!ring.length}
          className="bg-white rounded-md shadow px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 inline-flex items-center gap-1">
          <Eraser className="size-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}
