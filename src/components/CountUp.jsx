'use client';

import { useEffect, useRef, useState } from 'react';

// Animates 0 → `to` once scrolled into view (rAF, easeOutCubic). SSR/no-JS and
// reduced-motion render the final value directly — the real number is never hidden.
export default function CountUp({ to, duration = 1400, suffix = '', className = '' }) {
  const ref = useRef(null);
  const [val, setVal] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') return;

    setVal(0); // eslint-disable-line react-hooks/set-state-in-effect -- start the count only when we can animate
    let raf;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(eased * to));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);

  return <span ref={ref} className={className}>{val.toLocaleString()}{suffix}</span>;
}
