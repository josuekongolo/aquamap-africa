'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, FileText, ExternalLink } from 'lucide-react';
import { knowledge, knowledgeCategories } from '../data/knowledge';
import { KnowledgeIcon } from '../lib/icons';
import { useLang } from '../context/LangContext';
import ResearchPanel from '../components/ResearchPanel';

export default function Knowledge() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl-K opens the command palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const catCount = (id) => (id === 'all' ? knowledge.length : knowledge.filter(k => k.category === id).length);
  const filtered = activeCategory === 'all' ? knowledge : knowledge.filter(k => k.category === activeCategory);
  const groups = knowledgeCategories.filter(c => c.id !== 'all');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header + search trigger */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">{t.knowledge.title}</h1>
        <p className="text-gray-500 mb-5">{t.knowledge.subtitle}</p>
        <button
          onClick={() => setPaletteOpen(true)}
          className="w-full max-w-xl flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-teal-300 hover:shadow-sm transition text-left"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-sm">{lang === 'fr' ? 'Rechercher dans la base de connaissances…' : 'Search the knowledge base…'}</span>
          <kbd className="font-mono2 text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
        </button>
      </div>

      {/* Docs-style layout: category sidebar + resource list */}
      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
        {/* Sidebar nav */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-3 md:pb-0 mb-4 md:mb-0 md:sticky md:top-20 md:self-start">
          {knowledgeCategories.map(c => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  active ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={active ? { backgroundColor: '#0D6B8A14', color: '#0D6B8A' } : {}}
              >
                <KnowledgeIcon id={c.id} className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{c.label[lang]}</span>
                <span className="text-xs text-gray-400">{catCount(c.id)}</span>
              </button>
            );
          })}
        </nav>

        {/* Resource list */}
        <div className="min-w-0">
          <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm">
            {filtered.map(k => (
              <a
                key={k.id}
                href={k.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[15px] leading-snug group-hover:underline text-black">{k.title}</h3>
                    <div className="flex gap-1 shrink-0 pt-0.5">
                      {k.lang.map(l => (
                        <span key={l} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{l}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{k.desc[lang]}</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> {k.org}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Live related research (CrossRef) */}
      <ResearchPanel category={activeCategory} />

      {/* ⌘K command palette (cmdk) */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-[1200] bg-black/40 flex items-start justify-center pt-24 px-4"
          onClick={() => setPaletteOpen(false)}
        >
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <Command label={lang === 'fr' ? 'Recherche' : 'Search'} className="outline-none">
              <div className="flex items-center gap-2 px-4 border-b">
                <Search className="w-4 h-4 text-gray-400" />
                <Command.Input
                  autoFocus
                  placeholder={lang === 'fr' ? 'Rechercher une ressource…' : 'Search a resource…'}
                  className="w-full py-3.5 text-sm outline-none placeholder:text-gray-400"
                />
                <kbd className="font-mono2 text-[11px] text-gray-400">esc</kbd>
              </div>
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-gray-400">
                  {lang === 'fr' ? 'Aucun résultat.' : 'No results.'}
                </Command.Empty>
                {groups.map(cat => {
                  const items = knowledge.filter(k => k.category === cat.id);
                  if (!items.length) return null;
                  return (
                    <Command.Group key={cat.id} heading={cat.label[lang]}>
                      {items.map(k => (
                        <Command.Item
                          key={k.id}
                          value={`${k.title} ${k.org} ${k.desc[lang]} ${cat.label[lang]}`}
                          onSelect={() => { window.open(k.url, '_blank', 'noopener'); setPaletteOpen(false); }}
                          className="flex items-start gap-3 px-2 py-2"
                        >
                          <KnowledgeIcon id={k.category} className="w-4 h-4 mt-0.5 text-[#0D6B8A] shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-800 truncate">{k.title}</div>
                            <div className="text-xs text-gray-400 truncate">{k.org}</div>
                          </div>
                          <div className="flex gap-1 ml-auto shrink-0">
                            {k.lang.map(l => <span key={l} className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1 rounded">{l}</span>)}
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </div>
  );
}
