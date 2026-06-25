'use client';

// Minimal vertical timeline (shadcn-style, brand-colored nodes).
export function Timeline({ children }) {
  return <ol className="relative">{children}</ol>;
}

export function TimelineItem({ icon, color = 'var(--brand)', title, time, last, children }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-black/10" />}
      <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
        style={{ backgroundColor: color }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-[#06303d] truncate">{title}</p>
          <time className="text-[11px] text-gray-400 shrink-0">{time}</time>
        </div>
        {children && <div className="text-xs text-gray-500 mt-0.5">{children}</div>}
      </div>
    </li>
  );
}
