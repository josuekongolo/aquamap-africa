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
    ...(user ? [{ to: '/explore', label: t.nav.explore }] : []),
    ...(isAdmin ? [{ to: '/admin', label: t.nav.admin }] : []),
  ];

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: '#0D6B8A' }}>
            <Image src="/img/logo-mark.png" alt="AquaMap Africa" width={32} height={32} priority className="w-8 h-8 object-contain" />
            <span className="hidden sm:block font-display">AquaMap Africa</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link
                key={l.to}
                href={l.to}
                className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                  pathname === l.to ? 'text-teal-700 border-b-2 border-teal-600 pb-0.5' : 'text-gray-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="text-sm font-semibold px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition"
              style={{ color: '#0D6B8A' }}
            >
              {t.nav.lang}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/register"
                  className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                  style={{ backgroundColor: '#F4A261' }}
                >
                  + {t.register.title}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800"
                  title={user.email}
                >
                  {t.auth.signOut}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: '#F4A261' }}
              >
                {t.auth.signIn}
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 pb-4 pt-2 space-y-2">
          {links.map(l => (
            <Link
              key={l.to}
              href={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2 px-3 rounded-lg text-sm font-medium ${
                pathname === l.to
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="block w-full text-center text-white text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#F4A261' }}
              >
                + {t.register.title}
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
              >
                {t.auth.signOut}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-white text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#F4A261' }}
            >
              {t.auth.signIn}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
