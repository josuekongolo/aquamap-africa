import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Navbar() {
  const { t, toggle } = useLang();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/map', label: t.nav.map },
    { to: '/knowledge', label: t.nav.knowledge },
    { to: '/suppliers', label: t.nav.suppliers },
    { to: '/dashboard', label: t.nav.dashboard },
    { to: '/admin', label: t.nav.admin },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: '#0D6B8A' }}>
            <span className="text-2xl">🐠</span>
            <span className="hidden sm:block">AquaMap Africa</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-teal-600 ${
                  location.pathname === l.to ? 'text-teal-700 border-b-2 border-teal-600 pb-0.5' : 'text-gray-600'
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
            <Link
              to="/register"
              className="hidden md:block text-white text-sm font-semibold px-4 py-2 rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#F4A261' }}
            >
              {t.nav.register}
            </Link>
            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setOpen(!open)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
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
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-2 px-3 rounded-lg text-sm font-medium ${
                location.pathname === l.to
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-white text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ backgroundColor: '#F4A261' }}
          >
            {t.nav.register}
          </Link>
        </div>
      )}
    </nav>
  );
}
