'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { allQueued, removeQueued, countQueued } from '../lib/offlineQueue';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';

// Global connection + sync status. Shows when offline or when writes are queued,
// and replays the queue to Supabase on reconnect.
export default function OfflineBanner() {
  const { lang } = useLang();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try { setPending(await countQueued()); } catch { /* no idb */ }
  }, []);

  const flush = useCallback(async () => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return;
    let items = [];
    try { items = await allQueued(); } catch { return; }
    if (!items.length) return;
    setSyncing(true);
    for (const it of items) {
      const { error } = await supabase.from(it.table).insert(it.payload);
      if (!error) await removeQueued(it.id);
    }
    setSyncing(false);
    refresh();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('aquamap:synced'));
  }, [refresh]);

  useEffect(() => {
    const setStatus = () => setOnline(navigator.onLine);
    const onOnline = () => { setStatus(); flush(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', setStatus);
    window.addEventListener('aquamap:queued', refresh);
    // Defer initial reads off the synchronous effect body.
    Promise.resolve().then(() => { setStatus(); refresh(); flush(); });
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', setStatus);
      window.removeEventListener('aquamap:queued', refresh);
    };
  }, [flush, refresh]);

  if (online && pending === 0) return null;

  const offlineMsg = lang === 'fr' ? 'Hors ligne — vos saisies sont enregistrées localement' : 'Offline — your entries are saved locally';
  const pendingMsg = lang === 'fr'
    ? `${pending} saisie${pending > 1 ? 's' : ''} en attente de synchronisation`
    : `${pending} entr${pending > 1 ? 'ies' : 'y'} waiting to sync`;
  const syncMsg = lang === 'fr' ? 'Synchronisation…' : 'Syncing…';

  const bg = !online ? '#475569' : syncing ? '#0D6B8A' : '#F4A261';
  const label = !online ? offlineMsg : syncing ? syncMsg : pendingMsg;
  const Icon = !online ? WifiOff : syncing ? RefreshCw : Clock;

  return (
    <div
      className="fixed top-16 inset-x-0 z-40 text-white text-sm text-center py-1.5 px-4 font-medium"
      style={{ backgroundColor: bg }}
    >
<Icon className={`inline w-4 h-4 mr-1.5 -mt-0.5 ${syncing ? 'animate-spin' : ''}`} />{label}
      {online && pending > 0 && !syncing && (
        <button onClick={flush} className="ml-3 underline font-semibold">
          {lang === 'fr' ? 'Synchroniser' : 'Sync now'}
        </button>
      )}
    </div>
  );
}
