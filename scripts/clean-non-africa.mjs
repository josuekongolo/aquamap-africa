// Remove rows outside Africa from the precomputed tables (free — no Places calls).
// Dry-run by default; pass --apply to actually delete.
//   node --env-file=.env.local scripts/clean-non-africa.mjs [--apply]
import { createClient } from '@supabase/supabase-js';
import { isNonAfricanAddress } from '../src/lib/africa.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) { console.error('✗ Supabase env missing'); process.exit(1); }
const apply = process.argv.includes('--apply');
const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

for (const table of ['aquaculture_sites', 'equipment_suppliers']) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supa.from(table).select('id,address').range(from, from + 999);
    if (error) { console.error(`✗ read ${table}:`, error.message); process.exit(1); }
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const bad = rows.filter((r) => isNonAfricanAddress(r.address));
  console.log(`\n${table}: ${rows.length} rows, ${bad.length} outside Africa (${rows.length - bad.length} kept)`);
  for (const r of bad.slice(0, 5)) console.log('   drop:', (r.address || '').slice(-40));

  if (apply && bad.length) {
    const ids = bad.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supa.from(table).delete().in('id', ids.slice(i, i + 200));
      if (error) { console.error(`✗ delete ${table}:`, error.message); process.exit(1); }
    }
    console.log(`   ✓ deleted ${ids.length} rows`);
  }
}
console.log(apply ? '\n✓ Cleanup applied.' : '\n(dry-run — re-run with --apply to delete)');
