'use client';

import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

// Real country centroids from src/data/institutions.js ([lat, lng]). No operator PII.
const MARKERS = [
  { name: 'Sénégal', lat: 14.5, lng: -14.45 },
  { name: "Côte d'Ivoire", lat: 7.54, lng: -5.55 },
  { name: 'Cameroun', lat: 5.7, lng: 12.74 },
];

// Realistic blue-marble Earth (react-globe.gl / three.js). Textures self-hosted in
// public/img. Transparent canvas so it sits on the hero; auto-rotates, drag to spin,
// reduced-motion aware, dpr-capped. Loaded via next/dynamic({ ssr:false }) in Home.
export default function HeroGlobe() {
  const globeEl = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState(0);

  // Responsive square sizing from the wrapper.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => setSize(wrap.offsetWidth || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Camera, controls, perf — once the globe has mounted at a known size.
  useEffect(() => {
    const g = globeEl.current;
    if (!g || !size) return;

    g.pointOfView({ lat: 8, lng: 2, altitude: 2.1 }, 0); // frame West/Central Africa

    const renderer = g.renderer?.();
    if (renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const controls = g.controls?.();
    if (controls) {
      controls.enableZoom = false;
      controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controls.autoRotateSpeed = 0.55;
    }
  }, [size]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="h-full w-full">
      {size > 0 && (
        <Globe
          ref={globeEl}
          width={size}
          height={size}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/img/earth-blue-marble.jpg"
          bumpImageUrl="/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="#8fd6ff"
          atmosphereAltitude={0.2}
          pointsData={MARKERS}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#00E59C'}
          pointAltitude={0.03}
          pointRadius={0.55}
          pointsMerge={false}
          pointLabel="name"
          ringsData={MARKERS}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t) => `rgba(0,168,120,${1 - t})`}
          ringMaxRadius={4}
          ringPropagationSpeed={2.5}
          ringRepeatPeriod={1400}
        />
      )}
    </div>
  );
}
