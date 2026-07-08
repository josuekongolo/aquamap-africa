import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AQAFRIKA — Plateforme aquacole africaine';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Build-time OG banner (satori) — brand colors, no external assets, so
// WhatsApp/LinkedIn/X shares render a proper card instead of a bare link.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #06303d 0%, #0D6B8A 70%, #00A878 130%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 22, height: 22, borderRadius: 9999, background: '#00A878', display: 'flex',
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2, display: 'flex' }}>
            AQAFRIKA
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, display: 'flex' }}>
            La plateforme de données
          </div>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, color: '#7fe0c3', display: 'flex' }}>
            de l’aquaculture africaine
          </div>
          <div style={{ fontSize: 30, opacity: 0.85, marginTop: 10, display: 'flex' }}>
            Suivi de production · FCR par espèce · Cogestion FAO · Sénégal, Côte d’Ivoire, Cameroun
          </div>
        </div>
        <div style={{ fontSize: 26, opacity: 0.7, display: 'flex' }}>aqafrica.com</div>
      </div>
    ),
    size
  );
}
