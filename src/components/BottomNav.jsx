'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, BookOpen, Store, LayoutDashboard, LogIn } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

// Thumb-reach bottom tab bar for mobile (icon + short label). Hidden on desktop,
// where the top navbar is used. Reflects auth state.
export default function BottomNav() {
  const { lang } = useLang();
  const { user } = useAuth();
  const pathname = usePathname();

  const L = lang === 'fr'
    ? { home: 'Accueil', map: 'Carte', know: 'Docs', sup: 'Fourn.', dash: 'Tableau', login: 'Connexion' }
    : { home: 'Home', map: 'Map', know: 'Docs', sup: 'Suppliers', dash: 'Board', login: 'Sign in' };

  const items = [
    { href: '/', Icon: Home, label: L.home },
    { href: '/map', Icon: Map, label: L.map },
    { href: '/knowledge', Icon: BookOpen, label: L.know },
    { href: '/suppliers', Icon: Store, label: L.sup },
    user
      ? { href: '/dashboard', Icon: LayoutDashboard, label: L.dash }
      : { href: '/login', Icon: LogIn, label: L.login },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t flex shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      {items.map(it => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium"
            style={{ color: active ? '#0D6B8A' : '#94a3b8' }}
          >
            <it.Icon className="w-5 h-5 mb-0.5" strokeWidth={2} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
