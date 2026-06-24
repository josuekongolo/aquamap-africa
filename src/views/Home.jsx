'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '../context/LangContext';
import { countries, dataSources } from '../data/institutions';
import { speciesList } from '../data/species';
import { knowledge } from '../data/knowledge';
import { suppliers } from '../data/suppliers';

// Aesthetic: editorial data-journal. Display serif (Fraunces) + grotesque body
// (Hanken) + mono (JetBrains) for data. Photography: Pexels (free license).
export default function Home() {
  const { t, lang } = useLang();
  const fr = lang === 'fr';

  const stat = [
    { n: countries.length, l: fr ? 'pays' : 'countries' },
    { n: speciesList.length, l: fr ? 'espèces' : 'species' },
    { n: knowledge.length, l: fr ? 'ressources FAO' : 'FAO resources' },
    { n: suppliers.length, l: fr ? 'fournisseurs' : 'suppliers' },
  ];

  const features = [
    {
      k: '01', img: '/img/feat-production.jpg', tag: fr ? 'Suivi de production' : 'Production tracking',
      title: t.home.feature1, desc: t.home.feature1desc,
      alt: fr ? "Poissons dans un bassin d'élevage" : 'Fish in a rearing pond',
    },
    {
      k: '02', img: '/img/feat-knowledge.jpg', tag: fr ? 'Base FAO' : 'FAO knowledge',
      title: t.home.feature2, desc: t.home.feature2desc,
      alt: fr ? 'Tilapias récoltés' : 'Harvested tilapia',
    },
    {
      k: '03', img: '/img/feat-suppliers.jpg', tag: fr ? 'Fournisseurs' : 'Suppliers',
      title: t.home.feature3, desc: t.home.feature3desc,
      alt: fr ? "Aérateurs d'étang" : 'Pond aerators',
    },
  ];

  const steps = [
    { n: '01', label: t.home.step1, desc: t.home.step1desc },
    { n: '02', label: t.home.step2, desc: t.home.step2desc },
    { n: '03', label: t.home.step3, desc: t.home.step3desc },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ───────────────── HERO — split, asymmetric, showing the product ── */}
      <section className="relative isolate text-white" style={{ backgroundColor: 'var(--ink)' }}>
        <Image src="/img/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #06303def 0%, #06303dcc 42%, #0d6b8a66 100%)' }} />
        <div className="noise" />

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10 items-center py-20 lg:py-28">
          {/* Copy */}
          <div className="lg:col-span-7">
            <p className="rise font-mono2 text-[11px] tracking-[0.25em] uppercase text-[#7fd4be] mb-6" style={{ animationDelay: '0ms' }}>
              {fr ? 'Données aquacoles · Afrique francophone' : 'Aquaculture data · Francophone Africa'}
            </p>
            <h1 className="rise font-display font-black leading-[0.95] tracking-tight text-5xl md:text-7xl mb-6" style={{ animationDelay: '80ms' }}>
              {t.home.hero}
            </h1>
            <p className="rise text-lg md:text-xl text-white/75 max-w-xl mb-9" style={{ animationDelay: '160ms' }}>
              {t.home.heroSub}
            </p>
            <div className="rise flex flex-col sm:flex-row gap-3 mb-10" style={{ animationDelay: '240ms' }}>
              <Link href="/login" className="text-center font-semibold px-7 py-4 rounded-full text-[#06303d] hover:opacity-90 transition"
                style={{ backgroundColor: 'var(--accent)' }}>
                {fr ? 'Espace agent' : 'Agent login'} →
              </Link>
              <Link href="/map" className="text-center font-semibold px-7 py-4 rounded-full border border-white/25 text-white hover:bg-white/10 transition">
                {fr ? 'Explorer les données pays' : 'Explore country data'}
              </Link>
            </div>
            {/* Inline data index */}
            <div className="rise flex flex-wrap gap-x-7 gap-y-3" style={{ animationDelay: '320ms' }}>
              {stat.map((s, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold" style={{ color: 'var(--accent)' }}>{s.n}</span>
                  <span className="font-mono2 text-[11px] uppercase tracking-wider text-white/55">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product preview — real admin dashboard, floating + bleeding right */}
          <div className="lg:col-span-5 relative">
            <div className="rise relative rounded-xl overflow-hidden ring-1 ring-white/15 shadow-2xl rotate-[1.5deg] lg:translate-x-8"
              style={{ animationDelay: '360ms', aspectRatio: '4 / 3' }}>
              <Image src="/img/product-admin.png" alt={fr ? "Tableau de bord national d'AquaMap" : "AquaMap national dashboard"}
                fill sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover object-top" />
            </div>
            <div className="hidden lg:block absolute -bottom-5 -left-4 font-mono2 text-[11px] uppercase tracking-wider text-white/60 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full ring-1 ring-white/15">
              ↳ {fr ? 'tableau de bord réel' : 'real product'}
            </div>
          </div>
        </div>

        {/* Sourced-data credibility strip */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-mono2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              {fr ? 'Données sourcées' : 'Sourced data'}
            </span>
            {['FAO', 'WorldFish', 'CEDEAO', 'Banque mondiale', 'BAD / AfDB'].map(s => (
              <span key={s} className="font-mono2 text-xs text-white/60">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FEATURES — alternating editorial rows ───────── */}
      <section className="bg-[#F8FAFC] py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-16 text-center">
            {fr ? 'Ce que fait la plateforme' : 'What the platform does'}
          </p>
          <div className="space-y-20 md:space-y-28">
            {features.map((f, i) => (
              <div key={f.k} className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
                <div className={`relative ${i % 2 ? 'md:order-2' : ''}`}>
                  <span className="font-display absolute -top-10 -left-2 text-8xl font-black text-gray-100 select-none">{f.k}</span>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[3/2]">
                    <Image src={f.img} alt={f.alt} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
                  </div>
                </div>
                <div className={i % 2 ? 'md:order-1' : ''}>
                  <p className="font-mono2 text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--secondary)' }}>
                    {f.k} · {f.tag}
                  </p>
                  <h3 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: 'var(--ink)' }}>
                    {f.title}
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-md">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── DARK — sources & methodology (FAO/AfDB anchor) ── */}
      <section className="relative isolate text-white" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="noise" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-[#7fd4be] mb-4">
              {fr ? 'Méthodologie' : 'Methodology'}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] mb-5">
              {fr ? 'Derrière chaque chiffre, une source.' : 'Behind every number, a source.'}
            </h2>
            <p className="text-white/70 text-lg">
              {fr
                ? "Chaque figure est datée et référencée. Les indices de conversion alimentaire (FCR) par espèce proviennent de la FAO et de SRAC — jamais de données inventées."
                : 'Every figure is dated and referenced. Species-specific feed conversion ratios (FCR) come from FAO and SRAC — never invented data.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden">
            {dataSources.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className="group bg-[#06303d] hover:bg-[#0a3d4d] transition p-6">
                <div className="font-mono2 text-[10px] uppercase tracking-wider text-[#7fd4be] mb-2">{fr ? 'Source' : 'Source'}</div>
                <div className="font-display text-lg font-bold mb-1 group-hover:underline">{s.name}</div>
                <div className="text-sm text-white/55">{s.desc[lang]}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── HOW IT WORKS — numbered editorial sequence ──── */}
      <section className="bg-white py-20 md:py-24 border-b">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-14" style={{ color: 'var(--ink)' }}>
            {t.home.how}
          </h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((s) => (
              <div key={s.n} className="border-t-2 pt-5" style={{ borderColor: 'var(--secondary)' }}>
                <span className="font-mono2 text-sm" style={{ color: 'var(--secondary)' }}>{s.n}</span>
                <h3 className="font-display text-2xl font-bold mt-2 mb-2" style={{ color: 'var(--ink)' }}>{s.label}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── CLOSING CTA — community photography ─────────── */}
      <section className="relative isolate text-white">
        <Image src="/img/community.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #06303de6 0%, #00a87899 100%)' }} />
        <div className="noise" />
        <div className="relative max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-black leading-[0.95] mb-5">
            {fr ? 'Une donnée par ferme. Un secteur visible.' : 'One record per farm. A visible sector.'}
          </h2>
          <p className="text-white/85 text-lg mb-9 max-w-xl mx-auto">
            {fr
              ? 'Gratuit pour les ONG et les agents de vulgarisation. Données sourcées, sécurisées, exportables.'
              : 'Free for NGOs and extension agents. Sourced, secure, exportable data.'}
          </p>
          <Link href="/login" className="inline-block font-semibold px-9 py-4 rounded-full text-[#06303d] hover:opacity-90 transition"
            style={{ backgroundColor: 'var(--accent)' }}>
            {fr ? 'Commencer — Espace agent' : 'Get started — Agent login'} →
          </Link>
        </div>
      </section>
    </div>
  );
}
