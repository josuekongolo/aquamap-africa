import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Alan_Sans, Exo_2, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Providers from './providers';
import { cn } from "@/lib/utils";

// Exo 2 for display/headings, Alan Sans for body/UI, JetBrains Mono for data labels.
const display = Exo_2({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Alan_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://aqafrica.com'),
  title: {
    default: 'AQAFRIKA — Plateforme aquacole',
    template: '%s · AQAFRIKA',
  },
  description: 'La plateforme gratuite pour les aquaculteurs africains — enregistrement des opérateurs, suivi de production (FCR), cogestion FAO et intelligence sectorielle.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/img/logo-mark.png' },
  openGraph: {
    type: 'website',
    siteName: 'AQAFRIKA',
    url: 'https://aqafrica.com',
    title: 'AQAFRIKA — Plateforme aquacole africaine',
    description: 'Enregistrement des pisciculteurs, suivi de production (FCR par espèce), cogestion aquacole FAO et données sectorielles pour l’Afrique de l’Ouest et centrale.',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AQAFRIKA — Plateforme aquacole africaine',
    description: 'Suivi de production, FCR par espèce, cogestion FAO — la plateforme de données aquacoles pour l’Afrique.',
  },
};

export const viewport = {
  themeColor: '#0D6B8A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={cn(display.variable, body.variable, mono.variable, "font-sans")}>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
