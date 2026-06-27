'use client';

import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import Reveal from '../components/Reveal';

// An editorial "about the founder" page — narrative prose presenting Ilunga Josué
// Kongolo and the motivation behind AQAFRIKA. Grounded in his CV (no invented claims),
// written to introduce the person, not to list a résumé.
export default function About() {
  const { lang } = useLang();
  const fr = lang === 'fr';

  return (
    <div className="bg-white">
      {/* Intro band */}
      <section className="relative isolate overflow-hidden" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="noise" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 sm:py-24 flex flex-col sm:flex-row items-center gap-8 sm:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- founder portrait */}
          <img src="/img/josue.jpg" alt="Ilunga Josué Kongolo"
            className="shrink-0 size-36 sm:size-40 rounded-full object-cover ring-4 ring-white/15 shadow-xl" />
          <div className="text-center sm:text-left">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.22em] text-[#7fd4be] mb-2">{fr ? 'Le fondateur' : 'The founder'}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">Ilunga Josué Kongolo</h1>
            <p className="text-white/75 mt-3 max-w-xl leading-relaxed">
              {fr
                ? "Ingénieur en aquaculture, façonné par l'une des filières piscicoles les plus avancées au monde — et déterminé à en partager les outils avec les pisciculteurs africains."
                : 'An aquaculture engineer shaped by one of the most advanced fish-farming industries in the world — set on sharing its tools with African fish farmers.'}
            </p>
          </div>
        </div>
      </section>

      {/* Narrative */}
      <article className="max-w-2xl mx-auto px-6 py-14 sm:py-16 space-y-6 text-[16px] leading-[1.75] text-gray-700">
        <Reveal as="p" className="text-xl leading-relaxed text-black font-medium">
          {fr
            ? "Je m'appelle Josué. J'ai passé ces dernières années au cœur de l'aquaculture norvégienne, et j'ai construit AQAFRIKA pour mettre ce même savoir-faire à portée des pisciculteurs africains."
            : "I'm Josué. I've spent the last few years inside the Norwegian aquaculture industry, and I built AQAFRIKA to put that same know-how within reach of African fish farmers."}
        </Reveal>

        <Reveal as="p">
          {fr
            ? "Ingénieur en aquaculture formé à l'Université de Bergen, je travaille chez Stingray Marine Solutions, où je pilote à distance des systèmes de dépouillage au laser et suis chaque jour la santé, la croissance et le bien-être du saumon sur des fermes commerciales le long de la côte norvégienne. C'est là que j'ai appris où la technologie, la biologie du poisson et l'économie réelle d'une ferme se rencontrent vraiment — non pas en théorie, mais dans le rythme quotidien de l'alimentation, de l'échantillonnage et du soin aux animaux."
            : 'Trained as an aquaculture engineer at the University of Bergen, I work at Stingray Marine Solutions, where I run laser-based delousing remotely and follow the health, growth and welfare of salmon every day on commercial farms along the Norwegian coast. That is where I learned where technology, fish biology and the hard economics of a farm actually meet — not in theory, but in the daily rhythm of feeding, sampling and keeping animals healthy.'}
        </Reveal>

        <Reveal as="p">
          {fr
            ? "Mon travail vit de plus en plus dans la donnée. Pour ma thèse, j'ai combiné des images de caméras stéréo de six fermes avec des modèles océaniques et météorologiques, en utilisant l'apprentissage automatique pour comprendre comment l'environnement façonne le comportement des poissons — et proposer un indicateur de bien-être basé sur la caméra. J'ai aussi travaillé sur le terrain chez Aminor, seule ferme commerciale à terre au monde pour le loup tacheté, où j'ai appris toute la chaîne, des géniteurs au poisson prêt pour le marché."
            : 'My work increasingly lives in data. For my thesis I combined stereo-camera footage from six farms with ocean-model and weather data, using machine learning to read how the environment shapes fish behaviour — and to propose a camera-based welfare indicator. I have also stood on the production floor at Aminor, the world’s only commercial land-based farm for spotted wolffish, learning the chain from broodstock to market-ready fish.'}
        </Reveal>

        <Reveal as="p">
          {fr
            ? "À côté de la science, je construis. J'ai fondé et dirigé mes propres entreprises et mené le marketing digital et le développement web pour d'autres — des produits utilisés par des centaines de milliers de personnes. J'aime livrer des outils simples, utiles, et réellement adoptés."
            : 'Alongside the science, I build. I have founded and run my own companies and led digital marketing and web development for others — products used by hundreds of thousands of people. I like shipping tools that are simple, useful and actually used.'}
        </Reveal>

        <Reveal>
          <figure className="my-8 border-l-2 pl-5" style={{ borderColor: 'var(--brand)' }}>
            <blockquote className="font-display text-xl sm:text-2xl text-black leading-snug">
              {fr
                ? "« La Norvège a montré ce qu'une filière outillée par la donnée peut accomplir. L'Afrique mérite les mêmes outils. »"
                : '“Norway has shown what a data-driven sector can achieve. Africa deserves the same tools.”'}
            </blockquote>
          </figure>
        </Reveal>

        <Reveal as="h2" className="font-display text-2xl font-bold text-black pt-2">
          {fr ? 'Pourquoi AQAFRIKA' : 'Why AQAFRIKA'}
        </Reveal>

        <Reveal as="p">
          {fr
            ? "L'aquaculture est l'une des voies les plus claires vers la sécurité alimentaire, le revenu et l'emploi en Afrique. Pourtant, les petits pisciculteurs n'ont presque jamais les outils simples, les données fiables et les liens avec les fournisseurs que l'industrie norvégienne considère comme acquis. Je parle français, lingala et tshiluba, et j'ai toujours voulu combler cet écart."
            : 'Aquaculture is one of the clearest paths to food security, income and jobs across Africa. Yet smallholder farmers rarely have the simple tools, trustworthy data and supplier connections the Norwegian industry takes for granted. I speak French, Lingala and Tshiluba, and I have always wanted to close that gap.'}
        </Reveal>

        <Reveal as="p">
          {fr
            ? "AQAFRIKA est ma réponse : une plateforme gratuite où agents de vulgarisation et pisciculteurs enregistrent leurs exploitations, calculent un FCR adapté à l'espèce, accèdent à des ressources FAO et WorldFish vérifiées, trouvent de vrais fournisseurs et lisent clairement l'état de leur secteur — pensée d'abord pour l'Afrique francophone, et désormais déployée à l'échelle du continent."
            : 'AQAFRIKA is my answer: a free platform where extension agents and farmers register their operations, calculate a species-aware FCR, reach verified FAO and WorldFish knowledge, find real suppliers, and see their sector clearly — built for francophone Africa first, and now across the whole continent.'}
        </Reveal>

        <Reveal as="p" className="text-gray-600">
          {fr
            ? "Si tout cela vous parle — comme pisciculteur, organisation ou partenaire — j'aimerais beaucoup échanger avec vous."
            : "If any of this resonates — as a farmer, an organisation, or a partner — I'd love to hear from you."}
        </Reveal>

        <Reveal className="flex flex-wrap gap-3 pt-2">
          <Link href="/register" className="inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition" style={{ backgroundColor: 'var(--brand)' }}>
            {fr ? 'Enregistrer un opérateur' : 'Register an operator'} <ArrowRight className="size-4" />
          </Link>
          <a href="mailto:i.josuekongolo@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
            <Mail className="size-4" /> {fr ? 'Me contacter' : 'Get in touch'}
          </a>
        </Reveal>
      </article>
    </div>
  );
}
