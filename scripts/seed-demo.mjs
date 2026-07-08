// Seed a demo evaluator account with clearly-labeled DEMO data so FAO/AfDB
// reviewers see a working product instead of an empty RLS-scoped console.
// Idempotent: re-running wipes and recreates the demo agent's data.
//   node scripts/seed-demo.mjs
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')])
);

const DEMO_EMAIL = 'demo@aqafrica.com';
const DEMO_PASSWORD = 'Demo-AQAFRIKA-2026!';

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// ── 1. Demo auth user + agent profile ──────────────────────────────────────
let userId;
const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
const found = existing?.users?.find((u) => u.email === DEMO_EMAIL);
if (found) {
  userId = found.id;
  await admin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });
  console.log('demo user exists, password reset');
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Compte Démo AQAFRIKA', organization: 'DEMO — Évaluation' },
  });
  if (error) { console.error(error.message); process.exit(1); }
  userId = data.user.id;
  console.log('demo user created');
}
await admin.from('agents').upsert({ id: userId, full_name: 'Compte Démo AQAFRIKA', organization: 'DEMO — Évaluation' });

// ── 2. Wipe previous demo data (operators cascade logs/events/members) ─────
await admin.from('groups').delete().eq('created_by', userId);
await admin.from('operators').delete().eq('created_by', userId);

// ── 3. DEMO operators — synthetic, clearly labeled, plausible magnitudes ───
const OPERATORS = [
  { name: 'DEMO — Ferme Lac Rose', country: 'Sénégal', region: 'Dakar', lat: 14.838, lng: -17.234, gender: 'male', age_range: '36-45', species: ['tilapia'], systems: ['etang'], units: 4, area_m2: 2500, production_range: '1-5 tonnes' },
  { name: 'DEMO — Coopérative Thiès', country: 'Sénégal', region: 'Thiès', lat: 14.79, lng: -16.93, gender: 'female', age_range: '26-35', species: ['tilapia', 'silure'], systems: ['bassin'], units: 6, area_m2: 1800, production_range: '1-5 tonnes' },
  { name: 'DEMO — Pisciculture Yamoussoukro', country: "Côte d'Ivoire", region: 'Yamoussoukro', lat: 6.82, lng: -5.28, gender: 'male', age_range: '46-55', species: ['silure'], systems: ['etang'], units: 8, area_m2: 4000, production_range: '5-20 tonnes' },
  { name: 'DEMO — Ferme Abidjan Sud', country: "Côte d'Ivoire", region: 'Abidjan', lat: 5.31, lng: -4.03, gender: 'female', age_range: '18-25', species: ['tilapia'], systems: ['cage'], units: 10, area_m2: 1200, production_range: '1-5 tonnes' },
  { name: 'DEMO — Aquaferme Yaoundé', country: 'Cameroun', region: 'Centre', lat: 3.87, lng: 11.52, gender: 'male', age_range: '26-35', species: ['silure', 'tilapia'], systems: ['bassin', 'ras'], units: 5, area_m2: 900, production_range: '1-5 tonnes' },
  { name: 'DEMO — Étangs de Douala', country: 'Cameroun', region: 'Littoral', lat: 4.05, lng: 9.7, gender: 'female', age_range: '36-45', species: ['tilapia'], systems: ['etang'], units: 3, area_m2: 3200, production_range: '< 1 tonne' },
];

const opRows = OPERATORS.map((o) => ({
  ...o, created_by: userId, phone: null,
  water_source: 'Forage / Puits', electricity: true, road_access: true,
  revenue_range: '500 000 - 2M FCFA', sales_channel: 'Marché local / détail',
  financing: false, training_wanted: true, challenges: ['Qualité des aliments', 'Accès au financement'],
  consent_given: true, consent_date: daysAgo(90),
}));
const { data: ops, error: opErr } = await admin.from('operators').insert(opRows).select('id, name, species');
if (opErr) { console.error(opErr.message); process.exit(1); }
console.log(`${ops.length} DEMO operators`);

// ── 4. Logs: one realistic cycle per operator (stocking → feed → harvest) ──
const logs = [];
const events = [];
for (const [i, op] of ops.entries()) {
  const start = 150 - i * 7; // stagger cycles
  const fingerlings = 2000 + i * 500;
  const sp = op.species?.[0] === 'silure' ? 'Silure' : 'Tilapia';
  logs.push({ operator_id: op.id, created_by: userId, type: 'stocking', log_date: daysAgo(start), species: sp, fingerlings_count: fingerlings, avg_weight_g: 5 });
  for (let w = 1; w <= 5; w++) {
    logs.push({ operator_id: op.id, created_by: userId, type: 'feed', log_date: daysAgo(start - w * 21), species: sp, feed_kg: 110 + w * 30 + i * 10 });
  }
  events.push({ operator_id: op.id, created_by: userId, type: 'sampling', event_date: daysAgo(start - 60), severity: 'low', description: 'DEMO — échantillonnage', details: { count: 30, avg_weight_g: 120 } });
  if (i % 2 === 0) {
    events.push({ operator_id: op.id, created_by: userId, type: 'mortality', event_date: daysAgo(start - 45), severity: i === 0 ? 'high' : 'medium', description: 'DEMO — mortalité après pluie', details: { count: 80 + i * 20, cause: 'qualité d’eau' } });
  }
  if (start > 120) {
    const harvested = Math.round(fingerlings * 0.82 * 0.28);
    logs.push({ operator_id: op.id, created_by: userId, type: 'harvest', log_date: daysAgo(start - 130), species: sp, kg_harvested: harvested, kg_sold: Math.round(harvested * 0.9), avg_weight_g: 280, price_per_kg: 1500, buyer_type: 'Marché local' });
  }
}
const { error: logErr } = await admin.from('logs').insert(logs);
if (logErr) { console.error(logErr.message); process.exit(1); }
const { error: evErr } = await admin.from('events').insert(events);
if (evErr) { console.error(evErr.message); process.exit(1); }
console.log(`${logs.length} logs, ${events.length} events`);

// ── 5. One DEMO co-management group with plan/meeting/assessment/zone ──────
const { data: g, error: gErr } = await admin.from('groups').insert({
  created_by: userId, name: 'DEMO — Comité de cogestion du Lac Rose', group_type: 'committee',
  acm_model: 'zonal', degree: 'cooperative', country: 'Sénégal', region: 'Dakar',
  registered: true, members_declared: 24, women_declared: 10, youth_declared: 9,
  description: 'Groupe de démonstration (données fictives clairement étiquetées DEMO).',
  established_on: daysAgo(400),
}).select('id').single();
if (gErr) { console.error(gErr.message); process.exit(1); }
await admin.from('group_members').insert(ops.slice(0, 2).map((o, i) => ({
  group_id: g.id, operator_id: o.id, created_by: userId, role: i === 0 ? 'leader' : 'member', joined_on: daysAgo(300),
})));
const { data: plan } = await admin.from('plans').insert({
  group_id: g.id, created_by: userId, title: 'DEMO — Plan de cogestion 2026–2028', status: 'active',
  vision: 'Démonstration : production durable et partage équitable des ressources du lac.',
  conflict_mechanism: 'Médiation interne par le comité, recours à la mairie en second niveau.',
  adopted_on: daysAgo(200), review_due: daysAgo(-500), has_agreement: true, agreement_signed_on: daysAgo(180),
  languages: ['français', 'wolof'],
}).select('id').single();
await admin.from('plan_indicators').insert([
  { plan_id: plan.id, created_by: userId, name: 'Production annuelle du comité', category: 'economic', unit: 't', baseline: 8, target: 20, current: 12 },
  { plan_id: plan.id, created_by: userId, name: 'Part de femmes aux réunions', category: 'social', unit: '%', baseline: 25, target: 50, current: 42 },
  { plan_id: plan.id, created_by: userId, name: 'Conflits résolus en interne', category: 'governance', unit: '%', baseline: 40, target: 90, current: 75 },
]);
await admin.from('meetings').insert([
  { group_id: g.id, created_by: userId, meeting_date: daysAgo(35), title: 'DEMO — Assemblée trimestrielle', attendees_count: 19, women_count: 8, minutes: 'Compte rendu de démonstration.', decisions: 'Rotation des zones de captage validée.' },
  { group_id: g.id, created_by: userId, meeting_date: daysAgo(120), title: 'DEMO — Comité restreint', attendees_count: 7, women_count: 3, minutes: 'PV de démonstration.' },
]);
await admin.from('incidents').insert({
  group_id: g.id, created_by: userId, incident_date: daysAgo(60), kind: 'conflict', conflict_type: 'producer_producer',
  parties: 'DEMO — deux membres', description: 'Différend sur l’accès au point de captage.', status: 'resolved',
  resolution: 'Médiation du comité — calendrier partagé.', resolved_on: daysAgo(50),
});
await admin.from('assessments').insert(['I.1.1.1', 'I.1.2.1', 'I.2.A.4.2', 'I.2.B.5.1', 'I.2.C.1.1', 'I.2.C.5.2']
  .map((c, i) => ({ group_id: g.id, created_by: userId, criterion_id: c, score: i % 3 === 2 ? 'partly' : 'yes' })));
await admin.from('zones').insert({
  group_id: g.id, created_by: userId, name: 'DEMO — Zone cogérée du Lac Rose', zone_type: 'comanaged',
  geojson: { type: 'Polygon', coordinates: [[[-17.245, 14.832], [-17.222, 14.832], [-17.222, 14.845], [-17.245, 14.845], [-17.245, 14.832]]] },
});
console.log('DEMO group + plan + meetings + register + assessment + zone');

console.log(`\nDemo account ready:\n  ${DEMO_EMAIL}\n  ${DEMO_PASSWORD}`);
