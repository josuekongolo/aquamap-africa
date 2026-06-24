import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import Providers from './providers';

// Editorial display serif + clean grotesque body + mono for data labels.
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', axes: ['opsz'] });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'AquaMap Africa — Plateforme aquacole',
  description: 'La plateforme gratuite pour les aquaculteurs africains',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon-logo.png', apple: '/img/logo-mark.png' },
};

export const viewport = {
  themeColor: '#0D6B8A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
