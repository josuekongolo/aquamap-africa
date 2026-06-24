'use client';

import Image from 'next/image';
import { useLang } from '../context/LangContext';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 py-8 text-center text-sm text-gray-500 border-t bg-white">
      <p>{t.footer}</p>
      <div className="mt-2 flex justify-center items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Image src="/img/logo-mark.png" alt="" width={16} height={16} className="w-4 h-4 object-contain" />
          AquaMap Africa
        </span>
        <span>•</span>
        <span>🇸🇳 Sénégal · 🇨🇮 Côte d&apos;Ivoire · 🇨🇲 Cameroun</span>
      </div>
    </footer>
  );
}
