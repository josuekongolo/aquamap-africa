// Coordinator-only endpoint to invite a teammate into the caller's org.
// Verifies the caller from their bearer token (anon client), checks they are a
// coordinator, records the invite (RLS-guarded), then sends the Supabase invite
// email via the service-role admin API. handle_new_user() consumes the invite
// on signup to stamp org_id + role; the email link lands on /reset-password.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROLES = ['agent', 'coordinator', 'viewer'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request) {
  if (!URL || !ANON || !SERVICE) return json({ error: 'not_configured' }, 500);

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json({ error: 'unauthenticated' }, 401);

  let email, role;
  try { ({ email, role } = await request.json()); } catch { return json({ error: 'bad_request' }, 400); }
  email = (email || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'invalid_email' }, 400);
  if (!ROLES.includes(role)) role = 'agent';

  // Resolve + authorize the caller with their own token (RLS applies).
  const caller = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userErr } = await caller.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'unauthenticated' }, 401);
  const { data: me } = await caller.from('agents').select('org_id, role').eq('id', userData.user.id).single();
  if (!me || !['coordinator', 'admin'].includes(me.role)) return json({ error: 'forbidden' }, 403);
  if (!me.org_id) return json({ error: 'no_org' }, 400);

  // Record the invite through the caller (invites RLS = coordinator of own org).
  const { error: invErr } = await caller.from('invites').insert({
    org_id: me.org_id, email, role, invited_by: userData.user.id,
  });
  if (invErr) return json({ error: invErr.message }, 400);

  // Send the invite email with the service role.
  const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: mailErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://aqafrica.com/reset-password',
  });
  if (mailErr) {
    // Invite row is recorded; the email just didn't send (e.g. already a user).
    return json({ ok: true, emailed: false, warning: mailErr.message });
  }
  return json({ ok: true, emailed: true });
}
