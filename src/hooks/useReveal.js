'use client';

import { useEffect, useRef, useState } from 'react';

// SSR-safe "reveal on scroll". Fires once, then disconnects. Reduced-motion or
// unsupported environments resolve to shown=true immediately (content visible,
// no transition) so nothing is ever JS-gated into invisibility.
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true); // eslint-disable-line react-hooks/set-state-in-effect -- a11y/env fallback, runs once
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, threshold, rootMargin]);

  return [ref, shown];
}
