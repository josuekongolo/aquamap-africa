import { useLang } from '../context/LangContext';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 py-8 text-center text-sm text-gray-500 border-t bg-white">
      <p>{t.footer}</p>
      <div className="mt-2 flex justify-center gap-4 text-xs text-gray-400">
        <span>🌊 AquaMap Africa</span>
        <span>•</span>
        <span>Version MVP 1.0</span>
        <span>•</span>
        <span>2024</span>
      </div>
    </footer>
  );
}
