import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The app still builds and runs without credentials (graceful degradation):
// auth/data screens show a "backend not configured" notice instead of crashing.
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && process.env.NODE_ENV !== 'production') {
  console.warn(
    '[AquaMap] Supabase not configured — copy .env.example to .env.local and set ' +
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
