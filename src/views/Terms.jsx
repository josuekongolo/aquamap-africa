'use client';

import Link from 'next/link';
import { ScrollText } from 'lucide-react';
import { useLang } from '../context/LangContext';

const UPDATED = '2026-07-08';

function S({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-bold text-black mb-2">{title}</h2>
      <div className="text-[15px] leading-relaxed text-gray-700 space-y-2">{children}</div>
    </section>
  );
}

// Bilingual terms of use — pilot-phase draft; have a lawyer review before
// relying on it contractually.
export default function Terms() {
  const { lang } = useLang();
  const fr = lang === 'fr';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <ScrollText className="w-9 h-9 mb-3" style={{ color: 'var(--brand)' }} />
        <h1 className="font-display text-3xl font-bold text-black">
          {fr ? "Conditions d'utilisation" : 'Terms of use'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {fr ? 'Dernière mise à jour : ' : 'Last updated: '}{UPDATED}
        </p>
      </div>

      {fr ? (
        <>
          <S title="1. Objet">
            <p>AQAFRIKA fournit aux agents de terrain, coordinateurs et partenaires des outils d&apos;enregistrement
            et de suivi de la production aquacole. En utilisant la plateforme, vous acceptez ces conditions.</p>
          </S>
          <S title="2. Comptes">
            <p>Les comptes sont créés sur invitation. Vous êtes responsable de la confidentialité de vos identifiants
            et de l&apos;exactitude des données que vous saisissez. Un compte peut être désactivé en cas d&apos;usage
            abusif ou de saisie de données fictives.</p>
          </S>
          <S title="3. Obligations des agents">
            <p>Les agents s&apos;engagent à : recueillir le consentement éclairé des opérateurs avant tout
            enregistrement (voir la <Link href="/privacy" className="underline">politique de confidentialité</Link>),
            saisir des données exactes, et ne pas divulguer les données individuelles en dehors de la plateforme.</p>
          </S>
          <S title="4. Données et contenus">
            <p>Les données saisies restent la propriété des opérateurs et des organisations participantes. AQAFRIKA
            dispose d&apos;un droit d&apos;usage pour produire des statistiques agrégées et anonymisées.</p>
          </S>
          <S title="5. Disponibilité et responsabilité">
            <p>La plateforme est fournie « en l&apos;état », sans garantie de disponibilité continue. Les
            recommandations (FCR, météo, conseils) sont indicatives et fondées sur des références publiques (FAO,
            SRAC) ; elles ne remplacent pas un avis technique professionnel. AQAFRIKA ne saurait être tenu
            responsable des décisions d&apos;élevage prises sur leur base.</p>
          </S>
          <S title="6. Contact et droit applicable">
            <p>Questions : <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>.
            Ces conditions peuvent évoluer ; la version en vigueur est celle publiée sur cette page.</p>
          </S>
        </>
      ) : (
        <>
          <S title="1. Purpose">
            <p>AQAFRIKA provides field agents, coordinators and partners with tools to register and monitor
            aquaculture production. By using the platform you accept these terms.</p>
          </S>
          <S title="2. Accounts">
            <p>Accounts are created by invitation. You are responsible for keeping your credentials confidential and
            for the accuracy of the data you enter. Accounts may be deactivated for abuse or fabricated data.</p>
          </S>
          <S title="3. Agent obligations">
            <p>Agents commit to: obtaining operators&apos; informed consent before any registration (see the{' '}
            <Link href="/privacy" className="underline">privacy policy</Link>), entering accurate data, and not
            disclosing individual data outside the platform.</p>
          </S>
          <S title="4. Data and content">
            <p>Entered data remains the property of the operators and participating organizations. AQAFRIKA holds a
            usage right to produce aggregated, anonymized statistics.</p>
          </S>
          <S title="5. Availability and liability">
            <p>The platform is provided &quot;as is&quot;, without a guarantee of continuous availability.
            Recommendations (FCR, weather, advisory) are indicative, based on public references (FAO, SRAC), and do
            not replace professional technical advice. AQAFRIKA is not liable for farming decisions based on them.</p>
          </S>
          <S title="6. Contact and applicable law">
            <p>Questions: <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>.
            These terms may evolve; the applicable version is the one published on this page.</p>
          </S>
        </>
      )}

      <p className="text-sm text-gray-400 border-t pt-4">
        {fr ? 'Voir aussi la ' : 'See also the '}
        <Link href="/privacy" className="underline">{fr ? 'politique de confidentialité' : 'privacy policy'}</Link>.
      </p>
    </div>
  );
}
