// Equipment suppliers for /suppliers — served from the precomputed
// `equipment_suppliers` table (populated by scripts/populate-equipment-suppliers.mjs).
// No live Places calls, so $0 per visitor. Returns { suppliers, configured }.
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

export const revalidate = 3600; // re-read the table at most hourly

export async function GET() {
  if (!isSupabaseConfigured) return Response.json({ suppliers: [], configured: false });

  const cols = 'id,name,category,address,phone,website,lat,lng,type,maps_uri';
  const PAGE = 1000;
  const suppliers = [];
  try {
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('equipment_suppliers')
        .select(cols)
        .order('name')
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      for (const r of data || []) suppliers.push({ ...r, mapsUri: r.maps_uri });
      if (!data || data.length < PAGE) break;
    }
    return Response.json({ suppliers, configured: true });
  } catch (e) {
    return Response.json({ suppliers: [], configured: true, error: String(e?.message || e) }, { status: 502 });
  }
}
