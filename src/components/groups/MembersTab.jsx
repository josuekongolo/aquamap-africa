'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Crown, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const ROLES = [
  { id: 'member',    fr: 'Membre',           en: 'Member' },
  { id: 'committee', fr: 'Membre du comité', en: 'Committee member' },
  { id: 'leader',    fr: 'Leader élu',       en: 'Elected leader' },
];
const isWoman = (g) => g === 'Femme' || g === 'Female';
const isYouth = (a) => a === '18-25' || a === '26-35';

// Membership & representation (FAO Annex I.2.A: participation & equity —
// women/youth shares per indicators I.2.A.7.2 and I.2.C.3.2).
export default function MembersTab({ group, fr, user }) {
  const [members, setMembers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [pickId, setPickId] = useState('');
  const [pickRole, setPickRole] = useState('member');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [{ data: m }, { data: ops }] = await Promise.all([
      supabase.from('group_members').select('*, operators(id, name, gender, age_range, region, country)').eq('group_id', group.id).order('created_at'),
      supabase.from('operators').select('id, name, gender, age_range').order('name'),
    ]);
    setMembers(m || []);
    setOperators(ops || []);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const available = operators.filter((o) => !members.some((m) => m.operator_id === o.id));

  async function addMember() {
    if (!pickId) return;
    setError('');
    const { error } = await supabase.from('group_members').insert({
      group_id: group.id, operator_id: pickId, created_by: user.id, role: pickRole,
      joined_on: new Date().toISOString().slice(0, 10),
    });
    if (error) { setError(error.message); return; }
    setPickId('');
    load();
  }

  async function removeMember(id) {
    const { error } = await supabase.from('group_members').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    load();
  }

  const linked = members.map((m) => m.operators).filter(Boolean);
  const women = linked.filter((o) => isWoman(o.gender)).length;
  const youth = linked.filter((o) => isYouth(o.age_range)).length;
  const womenPct = linked.length ? Math.round((100 * women) / linked.length) : null;
  const youthPct = linked.length ? Math.round((100 * youth) / linked.length) : null;
  const declaredWomenPct = group.members_declared > 0 && group.women_declared != null
    ? Math.round((100 * group.women_declared) / group.members_declared) : null;
  const declaredYouthPct = group.members_declared > 0 && group.youth_declared != null
    ? Math.round((100 * group.youth_declared) / group.members_declared) : null;

  const roleLabel = (id) => { const r = ROLES.find((x) => x.id === id); return r ? (fr ? r.fr : r.en) : id; };

  return (
    <div className="space-y-4 pt-2">
      {/* Representation stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={fr ? 'Membres déclarés' : 'Declared members'} value={group.members_declared ?? '—'} />
        <Stat label={fr ? 'Opérateurs liés' : 'Linked operators'} value={linked.length} />
        <Stat label={fr ? 'Femmes' : 'Women'} value={womenPct != null ? `${womenPct}%` : declaredWomenPct != null ? `${declaredWomenPct}%` : '—'}
          sub={womenPct != null ? (fr ? 'parmi les liés' : 'of linked') : declaredWomenPct != null ? (fr ? 'déclaré' : 'declared') : null} />
        <Stat label={fr ? 'Jeunes (18–35)' : 'Youth (18–35)'} value={youthPct != null ? `${youthPct}%` : declaredYouthPct != null ? `${declaredYouthPct}%` : '—'}
          sub={youthPct != null ? (fr ? 'parmi les liés' : 'of linked') : declaredYouthPct != null ? (fr ? 'déclaré' : 'declared') : null} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr ? 'Relier un opérateur au groupe' : 'Link an operator to the group'}</CardTitle>
          <CardDescription>
            {fr
              ? 'Les opérateurs enregistrés deviennent des membres traçables — la représentation (femmes, jeunes) se calcule automatiquement.'
              : 'Registered operators become traceable members — representation (women, youth) is computed automatically.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={pickId} onChange={(e) => setPickId(e.target.value)}>
            <option value="">{available.length ? (fr ? 'Choisir un opérateur…' : 'Pick an operator…') : (fr ? 'Aucun opérateur disponible' : 'No operators available')}</option>
            {available.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{fr ? r.fr : r.en}</option>)}
          </select>
          <button onClick={addMember} disabled={!pickId}
            className="inline-flex items-center justify-center gap-1 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand)' }}>
            <Plus className="size-4" /> {fr ? 'Ajouter' : 'Add'}
          </button>
        </CardContent>
      </Card>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{fr ? 'Nom' : 'Name'}</TableHead>
              <TableHead>{fr ? 'Rôle' : 'Role'}</TableHead>
              <TableHead>{fr ? 'Genre' : 'Gender'}</TableHead>
              <TableHead>{fr ? 'Âge' : 'Age'}</TableHead>
              <TableHead>{fr ? 'Depuis' : 'Since'}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                {fr ? 'Aucun membre lié pour le moment.' : 'No linked members yet.'}
              </TableCell></TableRow>
            )}
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {m.role === 'leader' ? <Crown className="size-3.5" style={{ color: 'var(--brand-accent)' }} />
                      : m.role === 'committee' ? <UserCheck className="size-3.5" style={{ color: 'var(--brand)' }} /> : null}
                    {m.operators?.name || '—'}
                  </span>
                </TableCell>
                <TableCell><Badge variant="outline">{roleLabel(m.role)}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{m.operators?.gender || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{m.operators?.age_range || '—'}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{m.joined_on || '—'}</TableCell>
                <TableCell>
                  <button onClick={() => removeMember(m.id)} className="text-gray-300 hover:text-red-600" title={fr ? 'Retirer' : 'Remove'}>
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
