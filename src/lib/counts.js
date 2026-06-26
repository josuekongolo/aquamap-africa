// Server-side directory counts for the homepage stats. Reads the precomputed
// Supabase tables (public read). Returns nulls on failure so the UI can fall back
// to the curated static counts.
import { supabase, isSupabaseConfigured } from './supabase';

export async function getDirectoryCounts() {
  if (!isSupabaseConfigured) return { suppliers: null, sites: null };
  try {
    const [s, a] = await Promise.all([
      supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true }),
      supabase.from('aquaculture_sites').select('*', { count: 'exact', head: true }),
    ]);
    return { suppliers: s.count ?? null, sites: a.count ?? null };
  } catch {
    return { suppliers: null, sites: null };
  }
}
