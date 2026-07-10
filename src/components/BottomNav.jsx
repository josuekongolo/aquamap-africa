'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, BookOpen, Store, LayoutDashboard, LogIn, Users } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

// Thumb-reach bottom tab bar for mobile (icon + short label). Hidden on desktop,
// where the top navbar is used. Reflects auth state.
export default function BottomNav() {
  const { lang } = useLang();
  const { user } = useAuth();
  const pathname = usePathname();

  // The full-bleed map is immersive; its side panels (z-1100) would otherwise
  // fight this bar (z-50). Mobile still has the top navbar there for nav.
  if (pathname.startsWith('/map')) return null;

  const L = lang === 'fr'
    ? { home: 'Accueil', map: 'Carte', know: 'Docs', sup: 'Fourn.', dash: 'Tableau', groups: 'Groupes', login: 'Connexion' }
    : { home: 'Home', map: 'Map', know: 'Docs', sup: 'Suppliers', dash: 'Board', groups: 'Groups', login: 'Sign in' };

  const items = [
    { href: '/', Icon: Home, label: L.home },
    { href: '/map', Icon: Map, label: L.map },
    { href: '/knowledge', Icon: BookOpen, label: L.know },
    ...(user
      ? [
          { href: '/groups', Icon: Users, label: L.groups },
          { href: '/dashboard', Icon: LayoutDashboard, label: L.dash },
        ]
      : [
          { href: '/suppliers', Icon: Store, label: L.sup },
          { href: '/login', Icon: LogIn, label: L.login },
        ]),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t flex shadow-[0_-1px_8px_rgba(0,0,0,0.06)] pt-1.5 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
      {items.map(it => {
        const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex-1 flex flex-col items-center justify-center py-1.5 text-[11px] font-medium"
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
