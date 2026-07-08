'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
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

// Bilingual privacy policy. Content drafted for the pilot phase — have a lawyer
// versed in Senegal Loi 2008-12 / CI Loi 2013-450 / Cameroon Law 2024/017
// review before relying on it in a regulatory context.
export default function Privacy() {
  const { lang } = useLang();
  const fr = lang === 'fr';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <ShieldCheck className="w-9 h-9 mb-3" style={{ color: 'var(--brand)' }} />
        <h1 className="font-display text-3xl font-bold text-black">
          {fr ? 'Politique de confidentialité' : 'Privacy policy'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {fr ? 'Dernière mise à jour : ' : 'Last updated: '}{UPDATED}
        </p>
      </div>

      {fr ? (
        <>
          <S title="1. Qui sommes-nous">
            <p>
              AQAFRIKA (« la plateforme », accessible sur aqafrica.com) est une plateforme de suivi de
              l&apos;aquaculture en Afrique de l&apos;Ouest et centrale. Des agents de terrain (ONG, services de
              vulgarisation) y enregistrent des pisciculteurs (« opérateurs ») et leurs données de production.
              Responsable de traitement : AQAFRIKA — contact&nbsp;: <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>.
            </p>
          </S>
          <S title="2. Données collectées">
            <p><strong>Opérateurs (pisciculteurs)</strong> — collectées par un agent, avec le consentement de
            l&apos;opérateur : nom, téléphone, localisation GPS de l&apos;exploitation, genre, tranche d&apos;âge,
            caractéristiques de l&apos;exploitation (surface, espèces, systèmes), données de production
            (ensemencements, aliments, récoltes, incidents) et fourchettes de revenus.</p>
            <p><strong>Agents</strong> — e-mail, nom, organisation, mot de passe (haché par notre prestataire
            d&apos;authentification).</p>
            <p><strong>Techniques</strong> — statistiques d&apos;usage agrégées et journaux d&apos;erreurs (Vercel).
            Pas de cookies publicitaires.</p>
          </S>
          <S title="3. Finalités">
            <p>Suivi de production individuel (FCR, croissance, conseils), coordination de la cogestion aquacole
            (cadre FAO DACMS) et production de <strong>statistiques sectorielles anonymisées</strong> (comptages et
            agrégats par pays — jamais de données individuelles) partagées avec les partenaires institutionnels
            (ex. FAO, BAD).</p>
          </S>
          <S title="4. Consentement">
            <p>L&apos;enregistrement d&apos;un opérateur exige que l&apos;agent atteste avoir informé l&apos;opérateur et
            recueilli son consentement. La date du consentement est enregistrée. Un opérateur peut retirer son
            consentement à tout moment via son agent ou en nous contactant.</p>
          </S>
          <S title="5. Partage et visibilité">
            <p>Les données individuelles des opérateurs ne sont <strong>jamais publiques</strong>. Elles sont visibles
            uniquement par l&apos;agent qui les a enregistrées (et son équipe/organisation le cas échéant) et par les
            administrateurs de la plateforme. La carte publique n&apos;affiche que des données institutionnelles par
            pays. Les partenaires ne reçoivent que des agrégats anonymisés. Nous ne vendons aucune donnée.</p>
          </S>
          <S title="6. Hébergement et sous-traitants">
            <p>Les données sont hébergées chez Supabase (base de données et authentification) et Vercel
            (application), avec chiffrement en transit. Les e-mails transactionnels sont envoyés via Resend.</p>
          </S>
          <S title="7. Conservation">
            <p>Les données sont conservées tant que le compte de l&apos;organisation est actif, puis supprimées ou
            anonymisées dans un délai de 12 mois après la fin de la collaboration.</p>
          </S>
          <S title="8. Vos droits">
            <p>Conformément aux lois applicables sur la protection des données personnelles — notamment la loi
            sénégalaise n° 2008-12, la loi ivoirienne n° 2013-450 et la loi camerounaise n° 2024/017 — vous disposez
            de droits d&apos;accès, de rectification, d&apos;opposition et de suppression. Exercez-les via votre agent ou
            à <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>. Vous pouvez aussi
            saisir l&apos;autorité de protection compétente (CDP au Sénégal, ARTCI en Côte d&apos;Ivoire).</p>
          </S>
          <S title="9. Modifications">
            <p>Toute évolution de cette politique sera publiée sur cette page avec une nouvelle date de mise à jour.</p>
          </S>
        </>
      ) : (
        <>
          <S title="1. Who we are">
            <p>
              AQAFRIKA (&quot;the platform&quot;, at aqafrica.com) is an aquaculture monitoring platform for West and
              Central Africa. Field agents (NGOs, extension services) register fish farmers (&quot;operators&quot;) and
              their production data. Data controller: AQAFRIKA — contact{' '}
              <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>.
            </p>
          </S>
          <S title="2. Data we collect">
            <p><strong>Operators (fish farmers)</strong> — collected by an agent with the operator&apos;s consent:
            name, phone, farm GPS location, gender, age range, farm characteristics (area, species, systems),
            production data (stocking, feed, harvests, incidents) and revenue ranges.</p>
            <p><strong>Agents</strong> — email, name, organization, password (hashed by our auth provider).</p>
            <p><strong>Technical</strong> — aggregated usage statistics and error logs (Vercel). No advertising cookies.</p>
          </S>
          <S title="3. Purposes">
            <p>Individual production monitoring (FCR, growth, advisory), aquaculture co-management coordination
            (FAO DACMS framework), and <strong>anonymized sector statistics</strong> (counts and per-country
            aggregates — never individual data) shared with institutional partners (e.g. FAO, AfDB).</p>
          </S>
          <S title="4. Consent">
            <p>Registering an operator requires the agent to attest that the operator was informed and consented.
            The consent date is recorded. An operator may withdraw consent at any time via their agent or by
            contacting us.</p>
          </S>
          <S title="5. Sharing and visibility">
            <p>Individual operator data is <strong>never public</strong>. It is visible only to the agent who
            registered it (and their team/organization where applicable) and to platform administrators. The public
            map shows country-level institutional data only. Partners receive anonymized aggregates only. We never
            sell data.</p>
          </S>
          <S title="6. Hosting and processors">
            <p>Data is hosted on Supabase (database and authentication) and Vercel (application), encrypted in
            transit. Transactional email is sent via Resend.</p>
          </S>
          <S title="7. Retention">
            <p>Data is kept while the organization&apos;s account is active, then deleted or anonymized within 12
            months after the collaboration ends.</p>
          </S>
          <S title="8. Your rights">
            <p>Under applicable data-protection laws — including Senegal&apos;s Law 2008-12, Côte d&apos;Ivoire&apos;s
            Law 2013-450 and Cameroon&apos;s Law 2024/017 — you have rights of access, rectification, objection and
            erasure. Exercise them via your agent or at{' '}
            <a className="underline" href="mailto:contact@aqafrica.com">contact@aqafrica.com</a>. You may also
            contact the competent authority (CDP in Senegal, ARTCI in Côte d&apos;Ivoire).</p>
          </S>
          <S title="9. Changes">
            <p>Any changes to this policy will be published on this page with a new update date.</p>
          </S>
        </>
      )}

      <p className="text-sm text-gray-400 border-t pt-4">
        {fr ? 'Voir aussi les ' : 'See also the '}
        <Link href="/terms" className="underline">{fr ? "conditions d'utilisation" : 'terms of use'}</Link>.
      </p>
    </div>
  );
}
