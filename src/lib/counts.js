// Server-side directory counts for the homepage stats. Reads the precomputed
// Supabase tables (public read). Returns nulls on failure so the UI can fall back
// to the curated static counts. This module is server-only (imported by
// app/page.jsx), so importing the large static knowledge list here keeps its
// 166 KB out of the client homepage bundle — Home only needs the count.
import { supabase, isSupabaseConfigured } from './supabase';
import { knowledge } from '../data/knowledge';

export async function getDirectoryCounts() {
  const knowledgeCount = knowledge.length;
  if (!isSupabaseConfigured) return { suppliers: null, sites: null, knowledge: knowledgeCount };
  try {
    const [s, a] = await Promise.all([
      supabase.from('equipment_suppliers').select('*', { count: 'exact', head: true }),
      supabase.from('aquaculture_sites').select('*', { count: 'exact', head: true }),
    ]);
    return { suppliers: s.count ?? null, sites: a.count ?? null, knowledge: knowledgeCount };
  } catch {
    return { suppliers: null, sites: null, knowledge: knowledgeCount };
  }
}
