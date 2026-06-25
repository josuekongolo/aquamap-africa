'use client';

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

// Subscribe to Supabase Realtime postgres_changes for one table and patch a local
// array (keyed by `id`). RLS is enforced server-side — you only receive rows you may
// read. Requires the table to be in the `supabase_realtime` publication (see schema.sql)
// and supabase.realtime.setAuth() to have run (see AuthContext).
export function useRealtimeTable(table, setRows, opts = {}) {
  const { filter, enabled = true, onEvent } = opts;
  const cb = useRef({ setRows, onEvent });
  useEffect(() => { cb.current = { setRows, onEvent }; });

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled) return;

    // Unique channel name per effect run — `supabase.channel(name)` reuses an existing
    // channel by name, and adding `.on()` to an already-subscribed channel (e.g. on a
    // Strict Mode remount before the old one finished tearing down) throws.
    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        (payload) => {
          const { eventType, new: row, old } = payload;
          cb.current.setRows?.((prev) => {
            if (eventType === 'INSERT') {
              if (prev.some((r) => r.id === row.id)) return prev; // dedup vs optimistic insert
              return [row, ...prev];
            }
            if (eventType === 'UPDATE') return prev.map((r) => (r.id === row.id ? { ...r, ...row } : r));
            if (eventType === 'DELETE') return prev.filter((r) => r.id !== old.id);
            return prev;
          });
          cb.current.onEvent?.(payload);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, filter, enabled]);
}
