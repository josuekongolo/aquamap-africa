'use client';

import Link from 'next/link';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const fr = lang === 'fr';
  const year = new Date().getFullYear();

  const platform = [
    { label: t.nav.home, href: '/' },
    { label: t.nav.map, href: '/map' },
    user ? { label: t.nav.dashboard, href: '/dashboard' } : { label: fr ? 'Espace agent' : 'Agent login', href: '/login' },
  ];
  const resources = [
    { label: t.nav.knowledge, href: '/knowledge' },
    { label: t.nav.suppliers, href: '/suppliers' },
  ];
  const sources = [
    { label: 'FAO FishStat', href: 'https://www.fao.org/fishery/en/fishstat' },
    { label: 'FAO FISH4ACP', href: 'https://www.fao.org/in-action/fish-4-acp/' },
    { label: 'AfDB — TAAT', href: 'https://taat-africa.org/aquaculture/' },
    { label: 'World Bank PROBLUE', href: 'https://www.worldbank.org/en/programs/problue' },
  ];

  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand lockup; next/image optimization is unnecessary */}
            <img src="/img/logo-full.png" alt="AQAFRIKA" className="h-9 w-auto object-contain" />
          </Link>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            {fr
              ? "La plateforme de données aquacoles pour l'Afrique francophone — enregistrement des opérateurs, suivi de production et intelligence sectorielle."
              : 'The aquaculture data platform for francophone Africa — operator registration, production tracking and sector intelligence.'}
          </p>
          <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
            <span>🇸🇳 Sénégal</span><span>🇨🇮 Côte d&apos;Ivoire</span><span>🇨🇲 Cameroun</span>
          </div>
        </div>

        <FooterCol title={fr ? 'Plateforme' : 'Platform'} links={platform} />
        <FooterCol title={fr ? 'Ressources' : 'Resources'} links={resources} />
        <FooterCol title={fr ? 'Sources' : 'Data sources'} links={sources} external />
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© {year} AQAFRIKA. {fr ? 'Tous droits réservés.' : 'All rights reserved.'}</span>
          <span>{fr ? 'Données sourcées — FAO · WorldFish · CEDEAO · Banque mondiale' : 'Sourced data — FAO · WorldFish · ECOWAS · World Bank'}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, external }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l.label}>
            {external ? (
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-teal-700 transition">{l.label}</a>
            ) : (
              <Link href={l.href} className="text-sm text-gray-600 hover:text-teal-700 transition">{l.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
