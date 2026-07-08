'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { allQueued, removeQueued, countQueued, bumpTries } from '../lib/offlineQueue';
import { supabase } from '../lib/supabase';
import { useLang } from '../context/LangContext';

const MAX_RETRIES = 5;

// Global connection + sync status. Shows when offline or when writes are queued,
// and replays the queue to Supabase on reconnect.
export default function OfflineBanner() {
  const { lang } = useLang();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [failed, setFailed] = useState(0);
  const flushingRef = useRef(false);

  const refresh = useCallback(async () => {
    try { setPending(await countQueued()); } catch { /* no idb */ }
  }, []);

  const flush = useCallback(async () => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.onLine) return;
    // Sync lock: guard against concurrent flushes (online event + manual click)
    // double-inserting the same queued rows.
    if (flushingRef.current) return;
    flushingRef.current = true;
    let items = [];
    try { items = await allQueued(); } catch { flushingRef.current = false; return; }
    if (!items.length) { flushingRef.current = false; return; }
    setSyncing(true);
    let failures = 0;
    for (const it of items) {
      const { error } = await supabase.from(it.table).insert(it.payload);
      // Duplicate-key (23505) means this row already synced on a prior attempt
      // whose ack was lost — treat as success and drop it (idempotent replay).
      if (!error || error.code === '23505') {
        await removeQueued(it.id);
      } else {
        // Retry cap: drop poison items after MAX_RETRIES so one bad row can't
        // block the queue forever; surface the count instead of silent loss.
        const tries = (it.tries || 0) + 1;
        if (tries >= MAX_RETRIES) { await removeQueued(it.id); }
        else { await bumpTries(it.id); }
        failures += 1;
      }
    }
    setSyncing(false);
    setFailed(failures);
    flushingRef.current = false;
    refresh();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('aquamap:synced'));
  }, [refresh]);

  useEffect(() => {
    const setStatus = () => setOnline(navigator.onLine);
    const onOnline = () => { setStatus(); flush(); };
    const onQueued = () => { setFailed(0); refresh(); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', setStatus);
    window.addEventListener('aquamap:queued', onQueued);
    // Defer initial reads off the synchronous effect body.
    Promise.resolve().then(() => { setStatus(); refresh(); flush(); });
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', setStatus);
      window.removeEventListener('aquamap:queued', onQueued);
    };
  }, [flush, refresh]);

  if (online && pending === 0) return null;

  const offlineMsg = lang === 'fr' ? 'Hors ligne — vos saisies sont enregistrées localement' : 'Offline — your entries are saved locally';
  const pendingMsg = lang === 'fr'
    ? `${pending} saisie${pending > 1 ? 's' : ''} en attente de synchronisation`
    : `${pending} entr${pending > 1 ? 'ies' : 'y'} waiting to sync`;
  const syncMsg = lang === 'fr' ? 'Synchronisation…' : 'Syncing…';

  const failedMsg = lang === 'fr'
    ? `${failed} saisie${failed > 1 ? 's' : ''} en échec de synchronisation — réessayez`
    : `${failed} entr${failed > 1 ? 'ies' : 'y'} failed to sync — retry`;

  const showFailed = online && !syncing && failed > 0;
  const bg = !online ? '#475569' : showFailed ? '#dc2626' : syncing ? '#0D6B8A' : '#F4A261';
  const label = !online ? offlineMsg : showFailed ? failedMsg : syncing ? syncMsg : pendingMsg;
  const Icon = !online ? WifiOff : showFailed ? AlertTriangle : syncing ? RefreshCw : Clock;

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
