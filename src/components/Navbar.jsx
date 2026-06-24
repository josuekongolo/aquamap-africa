'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { t, toggle } = useLang();
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/img/logo-mark.png" alt="AquaMap Africa" width={32} height={32} priority className="w-8 h-8 object-contain" />
            <span className="hidden sm:block font-display font-bold text-lg tracking-tight" style={{ color: 'var(--brand)' }}>AquaMap Africa</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center h-full">
            {links.map(l => {
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  href={l.to}
                  className={`relative h-full flex items-center px-4 text-sm font-medium transition-colors ${active ? 'text-teal-700' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {l.label}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              {t.nav.lang}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/register" className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90 shadow-sm" style={{ backgroundColor: 'var(--brand-accent)' }}>
                  + {t.register.title}
                </Link>
                <button onClick={handleSignOut} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition" title={user.email}>
                  {t.auth.signOut}
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:inline-flex text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90 shadow-sm" style={{ backgroundColor: 'var(--brand-accent)' }}>
                {t.auth.signIn}
              </Link>
            )}

            <button className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 pb-4 pt-2 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              href={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2.5 px-3 rounded-lg text-sm font-medium ${isActive(l.to) ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            {user ? (
              <>
                <Link href="/register" onClick={() => setOpen(false)} className="block w-full text-center text-white text-sm font-semibold px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--brand-accent)' }}>
                  + {t.register.title}
                </Link>
                <button onClick={handleSignOut} className="block w-full text-center py-2.5 mt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  {t.auth.signOut}
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="block w-full text-center text-white text-sm font-semibold px-4 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--brand-accent)' }}>
                {t.auth.signIn}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
