// Aquaculture sites for the public map — served from the precomputed
// `aquaculture_sites` table (populated by scripts/populate-aquaculture-sites.mjs).
// No live Places calls here, so $0 per visitor. Returns { sites, configured }.
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

export const revalidate = 3600; // re-read the table at most hourly

export async function GET() {
  if (!isSupabaseConfigured) return Response.json({ sites: [], configured: false });

  const cols = 'id,name,address,phone,website,lat,lng,type,maps_uri';
  const PAGE = 1000;
  const sites = [];
  try {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('aquaculture_sites')
        .select(cols)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      for (const r of data || []) sites.push({ ...r, mapsUri: r.maps_uri });
      if (!data || data.length < PAGE) break;
    }
    return Response.json({ sites, configured: true });
  } catch (e) {
    return Response.json({ sites: [], configured: true, error: String(e?.message || e) }, { status: 502 });
  }
}
