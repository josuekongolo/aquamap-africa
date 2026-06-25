import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Alan_Sans, Exo_2, JetBrains_Mono } from 'next/font/google';
import Providers from './providers';
import { cn } from "@/lib/utils";

// Exo 2 for display/headings, Alan Sans for body/UI, JetBrains Mono for data labels.
const display = Exo_2({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Alan_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'AQAFRIKA — Plateforme aquacole',
  description: 'La plateforme gratuite pour les aquaculteurs africains',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/img/logo-mark.png' },
};

export const viewport = {
  themeColor: '#0D6B8A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={cn(display.variable, body.variable, mono.variable, "font-sans")}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
