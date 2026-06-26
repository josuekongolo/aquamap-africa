'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Plus } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

// Scroll-adaptive chrome (Vercel/Linear pattern): transparent over the dark globe
// hero on the homepage, frosted light glass once scrolled or on any other page.
export default function Navbar() {
  const { t, lang, toggle } = useLang();
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isHome = pathname === '/';
  const isMap = pathname.startsWith('/map');
  // dark/transparent only at the top of the homepage with no menu open
  const onDark = isHome && !scrolled && !open;
  // On the full-bleed map the bar hides itself; revealing on top-edge hover (desktop).
  const mapHidden = isMap && !revealed && !open;
  const isFr = lang === 'fr';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal the bar only when the cursor hits the very top edge of the map — a small
  // zone so reaching panel controls near the top doesn't pop it. Also suppressed
  // entirely while the cursor is over a side panel. Hysteresis (6 / 56) avoids flicker.
  useEffect(() => {
    if (!isMap) return; // off the map, `revealed` is unused (mapHidden is false)
    const onMove = (e) => {
      const overPanel = typeof e.target?.closest === 'function' && e.target.closest('aside');
      if (overPanel) { setRevealed(false); return; }
      if (e.clientY <= 6) setRevealed(true);
      else if (e.clientY > 56) setRevealed(false);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [isMap]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/map', label: t.nav.map },
    { to: '/knowledge', label: t.nav.knowledge },
    { to: '/suppliers', label: t.nav.suppliers },
    ...(user ? [{ to: '/dashboard', label: t.nav.dashboard }] : []),
    ...(isAdmin ? [{ to: '/admin', label: t.nav.admin }] : []),
  ];

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <>
      <nav
        className={[
          'fixed inset-x-0 top-0 transition-[background-color,border-color,box-shadow,backdrop-filter,transform] duration-300 ease-out',
          // On the map, float above the side panels (z-[1100]) so the revealed bar isn't hidden behind them.
          isMap ? 'z-[1200]' : 'z-50',
          mapHidden ? 'md:-translate-y-full' : 'translate-y-0',
          onDark
            ? 'bg-transparent border-b border-white/10'
            : 'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.06] shadow-[0_1px_20px_-8px_rgba(6,48,61,0.25)]',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand — two-tone wordmark, mark nudges on hover */}
            <Link href="/" className="group flex items-center gap-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static brand mark; next/image optimization is unnecessary */}
              <img src="/img/logo-mark.png" alt="" aria-hidden="true"
                className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
              <span className="hidden sm:block font-display font-semibold text-[17px] tracking-tight transition-colors"
                style={{ color: onDark ? '#fff' : '#000' }}>
                AQA<span style={{ color: onDark ? 'var(--brand-2)' : '#000' }}>FRIKA</span>
              </span>
            </Link>

            {/* Desktop links — animated underline grows from the left */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = isActive(l.to);
                const color = active
                  ? (onDark ? 'text-white' : 'text-black')
                  : (onDark ? 'text-white hover:text-white' : 'text-gray-700 hover:text-black');
                return (
                  <Link key={l.to} href={l.to}
                    className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${color}`}>
                    {l.label}
                    <span
                      className={`pointer-events-none absolute left-3 right-3 -bottom-px h-0.5 rounded-full origin-left transition-transform duration-300 ease-out ${active ? 'scale-x-100' : 'scale-x-0'}`}
                      style={{ backgroundColor: onDark ? 'var(--brand-2)' : 'var(--brand)' }}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Segmented FR | EN toggle with sliding thumb */}
              <button onClick={toggle} aria-label="Language / Langue"
                className={`relative inline-flex items-center rounded-full p-0.5 text-xs font-semibold transition-colors ${onDark ? 'bg-white/10 border border-white/15' : 'bg-black/[0.04] border border-black/[0.06]'}`}>
                <span
                  className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-transform duration-300 ease-out ${isFr ? 'translate-x-0' : 'translate-x-full'}`}
                  style={{ backgroundColor: onDark ? '#fff' : 'var(--brand)' }}
                />
                <span className="relative z-10 w-8 text-center py-1 transition-colors"
                  style={{ color: isFr ? (onDark ? 'var(--ink)' : '#fff') : (onDark ? 'rgba(255,255,255,0.7)' : 'rgba(6,48,61,0.5)') }}>FR</span>
                <span className="relative z-10 w-8 text-center py-1 transition-colors"
                  style={{ color: !isFr ? (onDark ? 'var(--ink)' : '#fff') : (onDark ? 'rgba(255,255,255,0.7)' : 'rgba(6,48,61,0.5)') }}>EN</span>
              </button>

              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/register"
                    className="inline-flex items-center gap-1.5 text-white text-sm font-semibold pl-3 pr-4 py-2 rounded-full shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                    style={{ backgroundColor: 'var(--brand)' }}>
                    <Plus className="w-4 h-4" /> {t.register.title}
                  </Link>
                  <button onClick={handleSignOut} title={user.email}
                    className={`p-2 rounded-full transition-colors ${onDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.04]'}`}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link href="/login"
                  className="hidden md:inline-flex items-center text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                  style={{ backgroundColor: 'var(--brand)' }}>
                  {t.auth.signIn}
                </Link>
              )}

              <button
                className={`md:hidden p-2 rounded-full transition-colors ${onDark ? 'text-white hover:bg-white/10' : 'text-[#06303d] hover:bg-black/[0.04]'}`}
                onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-black/[0.06] px-4 pb-4 pt-2 space-y-1">
            {links.map((l) => {
              const active = isActive(l.to);
              return (
                <Link key={l.to} href={l.to} onClick={() => setOpen(false)}
                  className={`block py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${active ? '' : 'text-slate-600 hover:bg-black/[0.04]'}`}
                  style={active ? { backgroundColor: 'rgba(0,0,0,0.05)', color: '#000' } : undefined}>
                  {l.label}
                </Link>
              );
            })}
            <div className="pt-2">
              {user ? (
                <>
                  <Link href="/register" onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-white text-sm font-semibold px-4 py-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--brand)' }}>
                    <Plus className="w-4 h-4" /> {t.register.title}
                  </Link>
                  <button onClick={handleSignOut}
                    className="block w-full text-center py-2.5 mt-1 text-sm font-medium text-slate-500 hover:text-slate-900">
                    {t.auth.signOut}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}
                  className="block w-full text-center text-white text-sm font-semibold px-4 py-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--brand)' }}>
                  {t.auth.signIn}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* The navbar is fixed; reserve its height on every page except the homepage
          (dark hero sits beneath the transparent bar) and the desktop map, which
          goes full-bleed with the bar auto-hiding above it. */}
      {!isHome && <div aria-hidden className={`h-16 ${isMap ? 'md:hidden' : ''}`} />}
    </>
  );
}
