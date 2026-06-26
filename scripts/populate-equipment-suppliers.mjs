// One-off (or cron) precompute: sweep the whole of Africa for aquaculture
// EQUIPMENT SUPPLIERS, by category, and store them in public.equipment_suppliers.
// /suppliers then reads from the DB — $0 Places cost per visitor.
//
// Run:  npm run suppliers:populate     (loads .env.local automatically)
// Needs: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from '@supabase/supabase-js';
import { searchAfrica } from '../src/lib/places.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.GOOGLE_PLACES_API_KEY) { console.error('✗ GOOGLE_PLACES_API_KEY missing'); process.exit(1); }
if (!url || !serviceKey) { console.error('✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }

// Short single-concept terms per category (long stacked queries return nothing).
const CATEGORY_TERMS = {
  feed:       ['fish feed', 'aquaculture feed'],
  fingerling: ['fish hatchery', 'fingerlings'],
  ras:        ['aquaculture equipment', 'recirculating aquaculture system'],
  aeration:   ['pond aerator', 'aquaculture aeration'],
  water:      ['water testing laboratory', 'water quality testing'],
};

const maxDepth = Number(process.env.SUPPLIERS_MAX_DEPTH) || 3; // suppliers are sparse → shallow is enough
const maxCalls = Number(process.env.SUPPLIERS_MAX_CALLS) || 2000; // per-category backstop

const t0 = Date.now();
const byId = new Map(); // id -> row (first category that finds a place wins)
let totalCalls = 0;

for (const [category, terms] of Object.entries(CATEGORY_TERMS)) {
  const { candidates, calls, capped, configured, error } = await searchAfrica({ terms, maxDepth, maxCalls });
  if (!configured) { console.error('✗ Places not configured'); process.exit(1); }
  if (error) { console.error(`✗ ${category} sweep error:`, error); process.exit(1); }
  totalCalls += calls;
  let added = 0;
  for (const c of candidates) {
    if (byId.has(c.id)) continue; // first category wins
    byId.set(c.id, { ...c, category });
    added++;
  }
  console.log(`  ${category.padEnd(11)} ${candidates.length} found, +${added} new (${calls} calls${capped ? ', CAPPED' : ''})`);
}

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`→ ${byId.size} unique suppliers from ${totalCalls} Places calls in ${secs}s`);
console.log(`  est. Places cost ≈ $${(totalCalls * 0.035).toFixed(2)}`);

const now = new Date().toISOString();
const rows = [...byId.values()].map((c) => ({
  id: c.id, name: c.name, category: c.category, address: c.address, phone: c.phone,
  website: c.website, lat: c.lat, lng: c.lng, type: c.type, maps_uri: c.mapsUri, source: c.source, updated_at: now,
}));

const supa = createClient(url, serviceKey, { auth: { persistSession: false } });
let written = 0;
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const { error: upErr } = await supa.from('equipment_suppliers').upsert(batch, { onConflict: 'id' });
  if (upErr) { console.error('✗ Upsert failed:', upErr.message); process.exit(1); }
  written += batch.length;
  process.stdout.write(`\r  upserted ${written}/${rows.length}`);
}
console.log(`\n✓ Done — ${written} suppliers stored in equipment_suppliers.`);
