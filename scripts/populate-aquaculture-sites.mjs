// One-off (or cron) precompute: sweep the whole of Africa for aquaculture sites
// via Google Places and store them in the public `aquaculture_sites` table. The
// /map route then reads from the DB — $0 Places cost per visitor.
//
// Run:  npm run sites:populate         (loads .env.local automatically)
// Needs: GOOGLE_PLACES_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Env overrides: SITES_MAX_CALLS, SITES_MAX_DEPTH.
import { createClient } from '@supabase/supabase-js';
import { searchAfrica } from '../src/lib/places.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.GOOGLE_PLACES_API_KEY) { console.error('✗ GOOGLE_PLACES_API_KEY missing'); process.exit(1); }
if (!url || !serviceKey) { console.error('✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing'); process.exit(1); }

const maxCalls = Number(process.env.SITES_MAX_CALLS) || 10000; // generous backstop
const maxDepth = Number(process.env.SITES_MAX_DEPTH) || 5;

console.log(`Sweeping Africa (maxDepth=${maxDepth}, maxCalls=${maxCalls})…`);
const t0 = Date.now();
const { candidates, calls, capped, configured, error } = await searchAfrica({ maxCalls, maxDepth });
if (!configured) { console.error('✗ Places not configured'); process.exit(1); }
if (error) { console.error('✗ Sweep error:', error); process.exit(1); }

const secs = ((Date.now() - t0) / 1000).toFixed(0);
console.log(`→ ${candidates.length} unique sites from ${calls} Places calls in ${secs}s${capped ? ' (CAPPED — raise SITES_MAX_CALLS for more)' : ''}`);
console.log(`  est. Places cost ≈ $${(calls * 0.035).toFixed(2)} (≈$35/1000 Text Search)`);

const now = new Date().toISOString();
const rows = candidates.map((c) => ({
  id: c.id, name: c.name, address: c.address, phone: c.phone, website: c.website,
  lat: c.lat, lng: c.lng, type: c.type, maps_uri: c.mapsUri, source: c.source, updated_at: now,
}));

const supa = createClient(url, serviceKey, { auth: { persistSession: false } });
let written = 0;
for (let i = 0; i < rows.length; i += 500) {
  const batch = rows.slice(i, i + 500);
  const { error: upErr } = await supa.from('aquaculture_sites').upsert(batch, { onConflict: 'id' });
  if (upErr) { console.error('✗ Upsert failed:', upErr.message); process.exit(1); }
  written += batch.length;
  process.stdout.write(`\r  upserted ${written}/${rows.length}`);
}
console.log(`\n✓ Done — ${written} sites stored in aquaculture_sites.`);
