// Clean the precomputed tables (free — no Places calls): drop rows that are
// non-African OR not aquaculture-relevant (supermarkets, ranches, restaurants…).
// Dry-run by default; pass --apply to delete.
//   node --env-file=.env.local scripts/clean-data.mjs [--apply]
import { createClient } from '@supabase/supabase-js';
import { isNonAfricanAddress } from '../src/lib/africa.js';
import { isIrrelevantPlace } from '../src/lib/relevance.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error('✗ Supabase env missing'); process.exit(1); }
const apply = process.argv.includes('--apply');
const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

for (const table of ['aquaculture_sites', 'equipment_suppliers']) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supa.from(table).select('id,name,type,address').range(from, from + 999);
    if (error) { console.error(`✗ read ${table}:`, error.message); process.exit(1); }
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const foreign = rows.filter((r) => isNonAfricanAddress(r.address));
  const irrelevant = rows.filter((r) => !isNonAfricanAddress(r.address) && isIrrelevantPlace(r.type, r.name));
  const badIds = [...foreign, ...irrelevant].map((r) => r.id);
  console.log(`\n${table}: ${rows.length} rows → drop ${foreign.length} non-African + ${irrelevant.length} irrelevant = keep ${rows.length - badIds.length}`);

  if (apply && badIds.length) {
    for (let i = 0; i < badIds.length; i += 200) {
      const { error } = await supa.from(table).delete().in('id', badIds.slice(i, i + 200));
      if (error) { console.error(`✗ delete ${table}:`, error.message); process.exit(1); }
    }
    console.log(`   ✓ deleted ${badIds.length} rows`);
  }
}
console.log(apply ? '\n✓ Cleanup applied.' : '\n(dry-run — re-run with --apply to delete)');
