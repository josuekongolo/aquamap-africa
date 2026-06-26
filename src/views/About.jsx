'use client';

import Link from 'next/link';
import { GraduationCap, Fish, LineChart, Globe2, Mail, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import Reveal from '../components/Reveal';

// About the founder — grounded in his CV (University of Bergen aquaculture engineer,
// Stingray Marine Solutions, thesis on camera/ML salmon monitoring, Aminor, and a
// founder/digital-marketing background). No invented claims.
export default function About() {
  const { lang } = useLang();
  const fr = lang === 'fr';

  const highlights = [
    {
      Icon: GraduationCap,
      title: fr ? 'Ingénieur en aquaculture (UiB)' : 'Aquaculture engineer (UiB)',
      body: fr
        ? "Master en génie aquacole (sivilingeniør i havbruk) à l'Université de Bergen — biologie, santé, génétique et conception des systèmes d'élevage."
        : 'MSc in Aquaculture Engineering (sivilingeniør i havbruk) at the University of Bergen — fish biology, health, genetics and the design of farming systems.',
    },
    {
      Icon: Fish,
      title: fr ? '3 ans sur les fermes salmonicoles' : '3 years on salmon farms',
      body: fr
        ? "Opérateur laser chez Stingray Marine Solutions : pilotage à distance du dépouillage laser et suivi quotidien de la santé et de la croissance des poissons en cage."
        : 'Laser operator at Stingray Marine Solutions: remotely running laser delousing and following fish health and growth daily across commercial sea cages.',
    },
    {
      Icon: LineChart,
      title: fr ? 'Données & apprentissage automatique' : 'Data & machine learning',
      body: fr
        ? "Thèse (avec Stingray) sur le suivi par caméra du comportement du saumon, combinant modèle océanique, météo et apprentissage automatique."
        : 'Thesis (with Stingray) on camera-based monitoring of salmon behaviour, combining ocean-model and weather data with machine learning.',
    },
    {
      Icon: Globe2,
      title: fr ? 'Entrepreneur & multilingue' : 'Founder & multilingual',
      body: fr
        ? "Fondateur de plusieurs entreprises (web, SEO, marketing digital). Parle norvégien, anglais, français, lingala et tshiluba."
        : 'Founder of several companies (web, SEO, digital marketing). Speaks Norwegian, English, French, Lingala and Tshiluba.',
    },
  ];

  return (
    <div className="bg-white">
      {/* Intro band */}
      <section className="relative isolate overflow-hidden" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="noise" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-24 flex flex-col sm:flex-row items-center gap-8">
          <div className="shrink-0 flex size-28 items-center justify-center rounded-full font-display text-3xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}>
            IJK
          </div>
          <div className="text-center sm:text-left">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.22em] text-[#7fd4be] mb-2">{fr ? 'À propos' : 'About'}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">Ilunga Josué Kongolo</h1>
            <p className="text-white/70 mt-2 max-w-2xl">
              {fr
                ? "Ingénieur en aquaculture (Université de Bergen) et fondateur d'AQAFRIKA — pour mettre les outils de l'aquaculture moderne au service des pisciculteurs africains."
                : 'Aquaculture engineer (University of Bergen) and founder of AQAFRIKA — bringing the tools of modern aquaculture to African fish farmers.'}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14 sm:py-16 space-y-14">
        {/* Highlights */}
        <div className="grid sm:grid-cols-2 gap-4">
          {highlights.map((h, i) => (
            <Reveal key={i} delay={i * 70}>
              <div className="h-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <span className="flex size-9 items-center justify-center rounded-lg mb-3" style={{ backgroundColor: '#0D6B8A14', color: 'var(--brand)' }}>
                  <h.Icon className="size-5" />
                </span>
                <h3 className="font-semibold text-black">{h.title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Background story */}
        <Reveal>
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-black">{fr ? 'Mon parcours' : 'My background'}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-600">
              <p>
                {fr
                  ? "Je termine un master d'ingénieur en aquaculture à l'Université de Bergen, au cœur de l'industrie norvégienne — l'une des plus avancées au monde. Depuis trois ans, je travaille chez Stingray Marine Solutions, où je pilote à distance des systèmes de dépouillage au laser et suis chaque jour la santé, la croissance et le bien-être des poissons sur des fermes commerciales le long de la côte norvégienne."
                  : 'I am finishing a master’s in aquaculture engineering at the University of Bergen, in the heart of the Norwegian industry — one of the most advanced in the world. For the past three years I have worked at Stingray Marine Solutions, remotely operating laser-delousing systems and following fish health, growth and welfare every day on commercial farms along the Norwegian coast.'}
              </p>
              <p>
                {fr
                  ? "Ma thèse, menée avec Stingray, combine des données de caméras stéréo de six sites avec des modèles océaniques et météo et de l'apprentissage automatique pour expliquer le comportement du saumon en cage. J'ai aussi travaillé sur la production à terre du loup tacheté chez Aminor, et j'ai fondé et dirigé plusieurs entreprises — développement web, SEO et marketing digital — touchant des centaines de milliers d'utilisateurs."
                  : 'My thesis, done with Stingray, combines stereo-camera data from six sites with ocean-model and weather data and machine learning to explain salmon behaviour in the pens. I have also worked on land-based production of spotted wolffish at Aminor, and founded and run several companies — web development, SEO and digital marketing — reaching hundreds of thousands of users.'}
              </p>
              <p>
                {fr
                  ? "Ce mélange — ingénierie aquacole, données, et expérience concrète du produit numérique — est exactement ce que j'ai voulu réunir dans AQAFRIKA."
                  : 'That mix — aquaculture engineering, data, and hands-on digital-product experience — is exactly what I wanted to bring together in AQAFRIKA.'}
              </p>
            </div>
          </section>
        </Reveal>

        {/* Why */}
        <Reveal>
          <section className="rounded-2xl border border-gray-100 bg-gradient-to-b from-primary/5 to-white p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-black">{fr ? 'Pourquoi AQAFRIKA' : 'Why AQAFRIKA'}</h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-600">
              <p>
                {fr
                  ? "L'aquaculture est l'une des voies les plus prometteuses pour la sécurité alimentaire et l'emploi en Afrique. Mais les petits pisciculteurs manquent souvent d'outils simples, de données fiables et de liens avec les fournisseurs — alors que la Norvège a montré ce qu'une filière outillée par la donnée peut accomplir."
                  : 'Aquaculture is one of the most promising paths to food security and jobs in Africa. Yet smallholder farmers often lack simple tools, reliable data and links to suppliers — while Norway has shown what a data-driven sector can achieve.'}
              </p>
              <p>
                {fr
                  ? "Parlant français, lingala et tshiluba, et formé à l'aquaculture norvégienne, j'ai voulu faire le pont : un outil gratuit où les agents et pisciculteurs enregistrent leurs exploitations, calculent un FCR adapté à l'espèce, accèdent à des ressources FAO/WorldFish vérifiées, trouvent des fournisseurs et suivent le secteur — d'abord en Afrique francophone, désormais à l'échelle du continent."
                  : 'Speaking French, Lingala and Tshiluba, and trained in Norwegian aquaculture, I wanted to bridge the two: a free tool where agents and farmers register operations, compute a species-aware FCR, reach verified FAO/WorldFish knowledge, find suppliers and track the sector — starting in francophone Africa and now across the continent.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/register" className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition" style={{ backgroundColor: 'var(--brand)' }}>
                {fr ? 'Enregistrer un opérateur' : 'Register an operator'} <ArrowRight className="size-4" />
              </Link>
              <a href="mailto:i.josuekongolo@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                <Mail className="size-4" /> {fr ? 'Me contacter' : 'Get in touch'}
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
