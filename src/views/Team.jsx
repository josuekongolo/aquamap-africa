'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, RefreshCw, Check, Shield, Eye, User, Crown, ArrowRightLeft, Power } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const ROLE_META = {
  admin:       { fr: 'Admin',        en: 'Admin',        Icon: Shield, cls: 'bg-purple-100 text-purple-700' },
  coordinator: { fr: 'Coordinateur', en: 'Coordinator',  Icon: Crown,  cls: 'bg-sky-100 text-sky-700' },
  agent:       { fr: 'Agent',        en: 'Agent',        Icon: User,   cls: 'bg-emerald-100 text-emerald-700' },
  viewer:      { fr: 'Observateur',  en: 'Viewer',       Icon: Eye,    cls: 'bg-gray-100 text-gray-600' },
};
const INVITE_ROLES = ['agent', 'coordinator', 'viewer'];

// Coordinator team management: members + roles + activity, invites, deactivate,
// and data reassignment (offboarding). All mutations are RLS/RPC-guarded.
export default function Team() {
  const { t, lang } = useLang();
  const { user, session, isAdmin } = useAuth();
  const fr = lang === 'fr';

  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState({}); // agent_id -> { operators, lastLog }
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [error, setError] = useState('');
  const [reassignFrom, setReassignFrom] = useState(null);

  const load = useCallback(async () => {
    const [{ data: ags, error: agErr }, { data: ops }, { data: invs }] = await Promise.all([
      supabase.from('agents').select('id, full_name, organization, role, active, created_at').order('created_at'),
      supabase.from('operators').select('id, created_by'),
      supabase.from('invites').select('id, email, role, expires_at, accepted_at').is('accepted_at', null).order('created_at', { ascending: false }),
    ]);
    if (agErr) setError(agErr.message);
    setMembers(ags || []);
    const act = {};
    for (const o of ops || []) act[o.created_by] = { operators: (act[o.created_by]?.operators || 0) + 1 };
    setActivity(act);
    setPendingInvites((invs || []).filter((i) => new Date(i.expires_at) > new Date()));
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function sendInvite(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: email.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'invite_failed'); return; }
      toast.success(data.emailed
        ? (fr ? `Invitation envoyée à ${email}` : `Invitation sent to ${email}`)
        : (fr ? 'Invitation enregistrée (e-mail non envoyé).' : 'Invite recorded (email not sent).'));
      setEmail('');
      load();
    } finally {
      setInviting(false);
    }
  }

  async function toggleActive(m) {
    const { error } = await supabase.from('agents').update({ active: !m.active }).eq('id', m.id);
    if (error) toast.error(error.message);
    else { toast.success(m.active ? (fr ? 'Compte désactivé.' : 'Deactivated.') : (fr ? 'Compte réactivé.' : 'Reactivated.')); load(); }
  }

  async function changeRole(m, role) {
    const { error } = await supabase.from('agents').update({ role }).eq('id', m.id);
    if (error) toast.error(error.message); else { toast.success(fr ? 'Rôle mis à jour.' : 'Role updated.'); load(); }
  }

  async function reassign(toAgent) {
    const { error } = await supabase.rpc('reassign_agent_data', { from_agent: reassignFrom.id, to_agent: toAgent });
    if (error) toast.error(error.message);
    else { toast.success(fr ? 'Données réattribuées.' : 'Data reassigned.'); setReassignFrom(null); load(); }
  }

  const roleLabel = (r) => { const m = ROLE_META[r]; return m ? (fr ? m.fr : m.en) : r; };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-black flex items-center gap-2.5">
          <Users className="size-7" style={{ color: 'var(--brand)' }} /> {fr ? 'Mon équipe' : 'My team'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {fr
            ? "Gérez les membres, les rôles et les invitations de votre organisation. Les agents d'une même organisation partagent les opérateurs et les données."
            : 'Manage your organization’s members, roles and invitations. Agents in the same organization share operators and data.'}
        </p>
      </div>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="size-4" style={{ color: 'var(--brand)' }} /> {fr ? 'Inviter un membre' : 'Invite a member'}</CardTitle>
          <CardDescription>{fr ? "Un e-mail d'invitation est envoyé ; le membre définit son mot de passe puis rejoint votre organisation." : 'An invitation email is sent; the member sets their password and joins your organization.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder={fr ? 'email@organisation.org' : 'email@organization.org'}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {INVITE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
            <button type="submit" disabled={inviting}
              className="inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}>
              {inviting ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />} {fr ? 'Inviter' : 'Invite'}
            </button>
          </form>
          {pendingInvites.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground">{fr ? 'En attente :' : 'Pending:'}</span>
              {pendingInvites.map((i) => (
                <Badge key={i.id} variant="outline">{i.email} · {roleLabel(i.role)}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{fr ? 'Membres' : 'Members'}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{fr ? 'Chargement…' : 'Loading…'}</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{fr ? 'Membre' : 'Member'}</TableHead>
                    <TableHead>{fr ? 'Rôle' : 'Role'}</TableHead>
                    <TableHead className="text-right">{fr ? 'Opérateurs' : 'Operators'}</TableHead>
                    <TableHead>{fr ? 'Statut' : 'Status'}</TableHead>
                    <TableHead className="text-right">{fr ? 'Actions' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const meta = ROLE_META[m.role] || ROLE_META.agent;
                    const isSelf = m.id === user?.id;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{m.full_name || '—'}{isSelf && <span className="text-xs text-muted-foreground"> ({fr ? 'vous' : 'you'})</span>}</div>
                          {m.organization && <div className="text-xs text-muted-foreground">{m.organization}</div>}
                        </TableCell>
                        <TableCell>
                          {isSelf || m.role === 'admin' ? (
                            <Badge variant="outline" className={`border-transparent ${meta.cls}`}><meta.Icon className="size-3 mr-1" /> {roleLabel(m.role)}</Badge>
                          ) : (
                            <select value={m.role} onChange={(e) => changeRole(m, e.target.value)}
                              className="text-xs rounded-md border border-gray-200 px-2 py-1 bg-white">
                              {INVITE_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                            </select>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{activity[m.id]?.operators || 0}</TableCell>
                        <TableCell>
                          {m.active === false
                            ? <Badge variant="outline" className="border-transparent bg-red-100 text-red-700">{fr ? 'Désactivé' : 'Inactive'}</Badge>
                            : <Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-700">{fr ? 'Actif' : 'Active'}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isSelf && m.role !== 'admin' && (
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => setReassignFrom(m)} title={fr ? 'Réattribuer les données' : 'Reassign data'}
                                className="p-1.5 rounded-md text-gray-400 hover:text-[#0D6B8A] hover:bg-gray-50"><ArrowRightLeft className="size-4" /></button>
                              <button onClick={() => toggleActive(m)} title={m.active ? (fr ? 'Désactiver' : 'Deactivate') : (fr ? 'Réactiver' : 'Reactivate')}
                                className={`p-1.5 rounded-md hover:bg-gray-50 ${m.active ? 'text-gray-400 hover:text-red-600' : 'text-emerald-500'}`}><Power className="size-4" /></button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <p className="text-xs text-muted-foreground">
          {fr ? 'En tant qu’administrateur, vous voyez tous les membres de la plateforme.' : 'As an administrator, you see all platform members.'}
        </p>
      )}

      {/* Reassign dialog */}
      {reassignFrom && (
        <div className="fixed inset-0 z-[1200] bg-black/40 flex items-center justify-center px-4" onClick={() => setReassignFrom(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Réattribuer les données' : 'Reassign data'}</CardTitle>
              <CardDescription>
                {fr
                  ? `Transférer tous les opérateurs, saisies et groupes de « ${reassignFrom.full_name} » vers un autre membre. Utile avant de désactiver un compte.`
                  : `Transfer all operators, logs and groups from "${reassignFrom.full_name}" to another member. Useful before deactivating an account.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.filter((m) => m.id !== reassignFrom.id && m.role !== 'viewer' && m.active !== false).map((m) => (
                <button key={m.id} onClick={() => reassign(m.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm flex items-center justify-between">
                  <span>{m.full_name || m.id.slice(0, 8)}</span>
                  <Badge variant="outline">{roleLabel(m.role)}</Badge>
                </button>
              ))}
              <button onClick={() => setReassignFrom(null)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-800">{fr ? 'Annuler' : 'Cancel'}</button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
