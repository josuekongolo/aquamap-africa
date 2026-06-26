'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { dataSources } from '../data/institutions';
import { africaCountries } from '../data/africaCountries';
import { speciesList } from '../data/species';
import { knowledge } from '../data/knowledge';
import { suppliers } from '../data/suppliers';
import Reveal from '../components/Reveal';
import CountUp from '../components/CountUp';

// Aesthetic: editorial data-journal meets sector-intelligence dashboard. Interactive
// deep-ocean globe centred on the three focus countries; brightened brand gradients,
// glassy glow, scroll reveals. Display serif (Fraunces) + grotesque body + mono data.
export default function Home({ counts } = {}) {
  const { t, lang } = useLang();
  const fr = lang === 'fr';

  const stat = [
    { n: africaCountries.length, l: fr ? 'pays couverts' : 'countries covered' },
    { n: speciesList.length, l: fr ? 'espèces suivies' : 'species tracked' },
    { n: knowledge.length, l: fr ? 'ressources FAO' : 'FAO resources' },
    { n: counts?.suppliers ?? suppliers.length, l: fr ? 'fournisseurs' : 'suppliers' },
  ];

  const features = [
    {
      k: '01', img: '/img/feat-production.jpg', href: '/register',
      tag: fr ? 'Suivi de production' : 'Production tracking',
      title: t.home.feature1, desc: t.home.feature1desc,
      alt: fr ? "Poissons dans un bassin d'élevage" : 'Fish in a rearing pond',
    },
    {
      k: '02', img: '/img/feat-knowledge.jpg', href: '/knowledge',
      tag: fr ? 'Base FAO' : 'FAO knowledge',
      title: t.home.feature2, desc: t.home.feature2desc,
      alt: fr ? 'Tilapias récoltés' : 'Harvested tilapia',
    },
    {
      k: '03', img: '/img/feat-suppliers.jpg', href: '/suppliers',
      tag: fr ? 'Fournisseurs' : 'Suppliers',
      title: t.home.feature3, desc: t.home.feature3desc,
      alt: fr ? "Aérateurs d'étang" : 'Pond aerators',
    },
  ];

  const steps = [
    { label: t.home.step1, desc: t.home.step1desc },
    { label: t.home.step2, desc: t.home.step2desc },
    { label: t.home.step3, desc: t.home.step3desc },
  ];

  const sourced = ['FAO', 'WorldFish', fr ? 'Banque mondiale' : 'World Bank', 'BAD / AfDB', 'Open-Meteo', 'CrossRef', 'CEDEAO'];

  return (
    <div className="overflow-x-hidden">
      {/* ───────────────── HERO — centered, over aquaculture video ─────────── */}
      <section className="relative isolate text-white" style={{ backgroundColor: 'var(--ink)' }}>
        {/* Looping video backdrop — African cage aquaculture (Pexels, free license) */}
        <video
          autoPlay muted loop playsInline
          poster="/img/hero-video-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,48,61,0.74) 0%, rgba(11,80,103,0.5) 50%, rgba(6,48,61,0.76) 100%)' }} />
        <div className="absolute inset-0 bg-dotgrid pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 flex flex-col items-center justify-center text-center min-h-[88vh] py-24">
          <h1 className="rise font-display font-medium tracking-[-0.02em] text-balance mb-6"
            style={{ animationDelay: '60ms', fontSize: 'clamp(2.6rem, 1rem + 6.5vw, 5.25rem)', lineHeight: 1.02 }}>
            {t.home.hero}
          </h1>
          <p className="rise text-lg md:text-xl text-white max-w-2xl leading-relaxed mb-10"
            style={{ animationDelay: '150ms' }}>
            {t.home.heroSub}
          </p>
          <div className="rise flex flex-col sm:flex-row gap-3 justify-center mb-12" style={{ animationDelay: '240ms' }}>
            <Link href="/login"
              className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
              style={{ backgroundColor: 'var(--brand)' }}>
              {fr ? 'Espace agent' : 'Agent login'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/map"
              className="inline-flex items-center justify-center h-12 px-7 rounded-xl font-semibold text-white border border-white/25 bg-white/[0.06] backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/[0.12]">
              {fr ? 'Explorer les données pays' : 'Explore country data'}
            </Link>
          </div>
          {/* Inline data index */}
          <div className="rise flex flex-wrap items-start justify-center divide-x divide-white/15" style={{ animationDelay: '320ms' }}>
            {stat.map((s, i) => (
              <div key={i} className="px-5 sm:px-7 text-center">
                <div className="font-display text-3xl font-semibold leading-none">{s.n.toLocaleString()}</div>
                <div className="font-mono2 text-[10px] uppercase tracking-wider text-white mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sourced-data credibility strip */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            <span className="font-mono2 text-[10px] uppercase tracking-[0.2em] text-white">
              {fr ? 'Données sourcées' : 'Sourced data'}
            </span>
            {sourced.map((s) => (
              <span key={s} className="font-mono2 text-xs text-white">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── STATS BAND — animated figures ──────────────────── */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
          <Reveal as="p" className="font-mono2 text-[11px] uppercase tracking-[0.22em] mb-10" style={{ color: 'var(--brand)' }}>
            {fr ? 'Couverture du secteur' : 'Sector coverage'}
          </Reveal>
          <dl className="grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-200">
            {stat.map((s, i) => (
              <Reveal key={i} delay={i * 90} className="flex flex-col lg:px-8 lg:first:pl-0">
                <dd className="font-display text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight tabular-nums leading-none"
                  style={{ color: 'var(--ink)' }}>
                  <CountUp to={s.n} />
                </dd>
                <dt className="font-mono2 mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  {s.l}
                </dt>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── FEATURES — bento grid (adapted from supabase/supabase apps/www) ───────── */}
      <section className="bg-[#F8FAFC] py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal as="p" className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-12 text-center">
            {fr ? 'Ce que fait la plateforme' : 'What the platform does'}
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12 md:gap-4 xl:gap-5">
            {features.map((f, i) => {
              const wide = i === 0;
              return (
                <Reveal
                  key={f.k}
                  delay={i * 80}
                  className={wide ? 'col-span-1 sm:col-span-2 md:col-span-12 xl:col-span-6' : 'col-span-1 md:col-span-6 xl:col-span-3'}
                >
                  <Link
                    href={f.href}
                    className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6B8A] sm:h-[400px]"
                  >
                    {/* media */}
                    <div className="relative w-full h-40 overflow-hidden sm:h-1/2">
                      <Image
                        src={f.img}
                        alt={f.alt}
                        fill
                        sizes={wide ? '(max-width: 768px) 100vw, 45vw' : '(max-width: 768px) 100vw, 24vw'}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        className="font-mono2 absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] backdrop-blur"
                        style={{ color: 'var(--brand)' }}
                      >
                        {f.tag}
                      </span>
                    </div>

                    {/* body */}
                    <div className="relative z-10 flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                        <h3 className="font-display text-xl font-bold leading-tight md:text-2xl">{f.title}</h3>
                        <ArrowUpRight className="ml-auto h-4 w-4 text-gray-300 transition-all group-hover:text-[color:var(--brand)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>

                      {wide && (
                        <ul className="mt-auto flex flex-col gap-1.5 pt-2 text-sm" style={{ color: 'var(--ink)' }}>
                          {(fr
                            ? ['FCR adapté à l’espèce', 'Récoltes, ensemencements, incidents', 'Suivi des performances dans le temps']
                            : ['Species-aware FCR', 'Harvests, stocking, incidents', 'Performance tracking over time']
                          ).map((h) => (
                            <li key={h} className="flex items-center gap-2">
                              <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-2)' }} />
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Link>
                </Reveal>
              );
            })}

            {/* summary line — pattern from the Supabase source */}
            <p className="col-span-full pt-2 text-xl tracking-[-.01rem] text-gray-400 sm:text-2xl">
              <span style={{ color: 'var(--ink)' }} className="font-display font-bold">
                {fr ? 'Une seule plateforme.' : 'One platform.'}
              </span>{' '}
              {fr ? 'Du suivi terrain à l’intelligence sectorielle.' : 'From field tracking to sector intelligence.'}
            </p>
          </div>
        </div>
      </section>

      {/* ───────── METHODOLOGY — sources grid (same card language as features) ───────── */}
      <section className="relative isolate border-y border-black/5"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eef6f4 100%)' }}>
        <div className="absolute inset-0 bg-dotgrid pointer-events-none opacity-60" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <Reveal className="max-w-2xl mb-12">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--brand)' }}>
              {fr ? 'Méthodologie' : 'Methodology'}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] mb-5" style={{ color: 'var(--ink)' }}>
              {fr ? 'Derrière chaque chiffre, une source.' : 'Behind every number, a source.'}
            </h2>
            <p className="text-gray-600 text-lg">
              {fr
                ? "Chaque figure est datée et référencée. Les indices de conversion alimentaire (FCR) par espèce proviennent de la FAO et de SRAC — jamais de données inventées."
                : 'Every figure is dated and referenced. Species-specific feed conversion ratios (FCR) come from FAO and SRAC — never invented data.'}
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((s, i) => (
              <Reveal key={s.name} as="a" delay={i * 60} href={s.url} target="_blank" rel="noopener noreferrer"
                className="group relative flex flex-col rounded-2xl bg-white ring-1 ring-black/5 shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6B8A]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-2)' }}>{fr ? 'Source' : 'Source'}</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all group-hover:text-[color:var(--brand)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="font-display text-lg font-bold mb-1" style={{ color: 'var(--ink)' }}>{s.name}</div>
                <div className="text-sm text-gray-500">{s.desc[lang]}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── HOW IT WORKS — bento grid, icon tiles (no numbers) ───────── */}
      <section className="bg-[#F8FAFC] py-20 md:py-24 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal as="h2" className="font-display text-3xl md:text-4xl font-bold mb-12" style={{ color: 'var(--ink)' }}>
            {t.home.how}
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-12 md:gap-4 xl:gap-5">
            {steps.map((s, i) => {
              const wide = i === 0;
              return (
                <Reveal
                  key={s.label}
                  delay={i * 80}
                  className={wide ? 'col-span-1 sm:col-span-2 md:col-span-12 xl:col-span-6' : 'col-span-1 md:col-span-6 xl:col-span-3'}
                >
                  <div className="group relative flex h-full w-full flex-col justify-center overflow-hidden rounded-2xl bg-white p-7 ring-1 ring-black/5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-black/10 sm:min-h-[220px]">
                    <h3 className="font-display text-2xl font-bold mb-2 leading-tight" style={{ color: 'var(--ink)' }}>
                      {s.label}
                    </h3>
                    <p className="text-gray-600 leading-relaxed max-w-md">{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── CLOSING CTA — light panel (same card theme) ───────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-sm">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #eef6f4 100%)' }} />
            <div className="absolute inset-0 bg-dotgrid pointer-events-none opacity-60" />
            <div className="relative px-8 py-16 md:py-20 text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-[1.02] mb-5" style={{ color: 'var(--ink)' }}>
                {fr ? 'Une donnée par ferme. Un secteur visible.' : 'One record per farm. A visible sector.'}
              </h2>
              <p className="text-gray-600 text-lg mb-9 max-w-xl mx-auto">
                {fr
                  ? 'Gratuit pour les ONG et les agents de vulgarisation. Données sourcées, sécurisées, exportables.'
                  : 'Free for NGOs and extension agents. Sourced, secure, exportable data.'}
              </p>
              <Link href="/login"
                className="group inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                style={{ backgroundColor: 'var(--brand)' }}>
                {fr ? 'Commencer — Espace agent' : 'Get started — Agent login'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
