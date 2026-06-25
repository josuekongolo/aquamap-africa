'use client';

import { useReveal } from '../hooks/useReveal';

// Thin wrapper that fades + lifts its children in on scroll. `delay` staggers
// siblings. Reuses the .reveal CSS (globals.css), which shares the .rise easing.
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      data-shown={shown}
      style={{ '--reveal-delay': `${delay}ms` }}
      className={`reveal ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
