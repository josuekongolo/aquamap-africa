'use client';

import Link from 'next/link';
import { BookOpen, UserPlus, ClipboardList, WifiOff, ShieldCheck, Users } from 'lucide-react';
import { useLang } from '../context/LangContext';

function Step({ Icon, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand)', color: '#fff' }}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-black mb-1">{title}</h3>
        <div className="text-[15px] leading-relaxed text-gray-700 space-y-1">{children}</div>
      </div>
    </div>
  );
}

// Bilingual agent onboarding guide. Doubles as evaluator documentation and
// carries the verbal-consent script agents must use at registration.
export default function Guide() {
  const { lang } = useLang();
  const fr = lang === 'fr';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <BookOpen className="w-9 h-9 mb-3" style={{ color: 'var(--brand)' }} />
        <h1 className="font-display text-3xl font-bold text-black">{fr ? 'Guide de l’agent' : 'Agent guide'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {fr ? 'Prise en main d’AQAFRIKA pour les agents de terrain.' : 'Getting started with AQAFRIKA for field agents.'}
        </p>
      </div>

      <div className="space-y-8">
        <Step Icon={UserPlus} title={fr ? '1. Enregistrer un opérateur' : '1. Register an operator'}>
          <p>{fr
            ? 'Depuis le tableau de bord, « Enregistrer un opérateur » ouvre un formulaire en 3 étapes (identité, exploitation, production). Capturez la position GPS sur place. Le consentement de l’opérateur est obligatoire (voir ci-dessous).'
            : 'From the dashboard, “Register an operator” opens a 3-step form (identity, farm, production). Capture the GPS position on site. The operator’s consent is required (see below).'}</p>
        </Step>

        <Step Icon={ShieldCheck} title={fr ? '2. Recueillir le consentement (script)' : '2. Obtain consent (script)'}>
          <p className="text-sm text-gray-500">{fr ? 'À lire à l’opérateur avant l’enregistrement :' : 'Read to the operator before registering:'}</p>
          <blockquote className="border-l-4 pl-4 py-1 italic text-gray-700" style={{ borderColor: 'var(--brand-2)' }}>
            {fr
              ? '« Je souhaite enregistrer les informations de votre exploitation (nom, téléphone, localisation, production) dans la plateforme AQAFRIKA. Ces données servent à suivre votre production et à produire des statistiques anonymisées pour le secteur. Elles ne seront pas rendues publiques individuellement, et vous pouvez demander leur correction ou leur suppression à tout moment. Êtes-vous d’accord ? »'
              : '“I would like to record your farm information (name, phone, location, production) in the AQAFRIKA platform. This data is used to track your production and to produce anonymized statistics for the sector. It will not be made individually public, and you can ask to correct or delete it at any time. Do you agree?”'}
          </blockquote>
          <p className="text-sm">{fr ? 'Cochez la case de consentement uniquement après un accord clair.' : 'Tick the consent box only after a clear yes.'} <Link href="/privacy" className="underline" style={{ color: 'var(--brand)' }}>{fr ? 'Politique de confidentialité' : 'Privacy policy'}</Link></p>
        </Step>

        <Step Icon={ClipboardList} title={fr ? '3. Saisir la production' : '3. Log production'}>
          <p>{fr
            ? 'Enregistrez régulièrement les ensemencements, l’alimentation et les récoltes. Le FCR (indice de conversion alimentaire) et la courbe de croissance se calculent automatiquement par cycle. Pesez un échantillon (~20–30 poissons) toutes les 2 semaines et saisissez-le via « Événement → Échantillon ».'
            : 'Regularly log stocking, feed and harvests. FCR (feed conversion ratio) and the growth curve are computed automatically per cycle. Weigh a sample (~20–30 fish) every 2 weeks and record it via “Event → Sampling”.'}</p>
        </Step>

        <Step Icon={WifiOff} title={fr ? '4. Travailler hors ligne' : '4. Work offline'}>
          <p>{fr
            ? 'L’application fonctionne sans connexion : les enregistrements et saisies sont stockés sur votre appareil et synchronisés automatiquement dès le retour du réseau. Une bannière indique les éléments en attente. Ne vous déconnectez pas tant que la synchronisation n’est pas terminée.'
            : 'The app works without a connection: registrations and logs are stored on your device and sync automatically when the network returns. A banner shows pending items. Don’t sign out until syncing is complete.'}</p>
        </Step>

        <Step Icon={Users} title={fr ? '5. Cogestion & équipe' : '5. Co-management & team'}>
          <p>{fr
            ? 'Reliez vos opérateurs à un groupe de cogestion (comité, coopérative) pour suivre le plan, les réunions, les conflits et l’auto-évaluation FAO. Les coordinateurs gèrent les membres et les invitations depuis « Équipe ».'
            : 'Link your operators to a co-management group (committee, cooperative) to track the plan, meetings, conflicts and the FAO self-assessment. Coordinators manage members and invitations from “Team”.'}</p>
        </Step>
      </div>

      <div className="mt-10 rounded-xl border bg-gray-50 px-5 py-4 text-sm text-gray-600">
        {fr ? 'Une question ? ' : 'A question? '}
        <a href="mailto:contact@aqafrica.com" className="underline" style={{ color: 'var(--brand)' }}>contact@aqafrica.com</a>
      </div>
    </div>
  );
}
