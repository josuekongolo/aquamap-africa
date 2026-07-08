'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

// Click-to-place location picker (MapLibre) — manual GPS fallback when the
// device geolocation is unavailable or inaccurate. Reports [lng, lat] up.
export default function LocationPicker({ lat, lng, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const cb = useRef(onPick);
  useEffect(() => { cb.current = onPick; });

  useEffect(() => {
    const hasPoint = lat != null && lng != null;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: hasPoint ? [lng, lat] : [ -5, 8 ],
      zoom: hasPoint ? 11 : 3.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const place = (lngLat) => {
      if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: '#0D6B8A', draggable: true }).setLngLat(lngLat).addTo(map);
      else markerRef.current.setLngLat(lngLat);
      markerRef.current.off('dragend');
      markerRef.current.on('dragend', () => { const p = markerRef.current.getLngLat(); cb.current?.([p.lng, p.lat]); });
      cb.current?.([lngLat.lng ?? lngLat[0], lngLat.lat ?? lngLat[1]]);
    };
    if (hasPoint) place({ lng, lat });
    map.on('click', (e) => place(e.lngLat));
    map.getCanvas().style.cursor = 'crosshair';

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-56 rounded-lg overflow-hidden border">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
