'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Plus, MapPin, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ACM_GROUP_TYPES, ACM_MODELS, ACM_DEGREES, DACMS_SOURCE } from '../data/dacms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GroupForm from '../components/groups/GroupForm';

const label = (list, id, fr) => {
  const item = list.find((x) => x.id === id);
  return item ? (fr ? item.fr : item.en) : null;
};

// Co-management groups (FAO DACMS): committees, cooperatives, associations,
// networks the agent facilitates. List + registration; detail lives at /groups/[id].
export default function Groups() {
  const { t, lang } = useLang();
  const { user, configured } = useAuth();
  const fr = lang === 'fr';

  const [groups, setGroups] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [loading, setLoading] = useState(configured);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [queuedMsg, setQueuedMsg] = useState(false);

  const load = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setGroups(data || []);
    const { data: members } = await supabase.from('group_members').select('group_id');
    const counts = {};
    for (const m of members || []) counts[m.group_id] = (counts[m.group_id] || 0) + 1;
    setMemberCounts(counts);
    setLoading(false);
  }, [configured]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-black flex items-center gap-2.5">
            <Users className="size-7" style={{ color: 'var(--brand)' }} />
            {fr ? 'Cogestion aquacole' : 'Aquaculture co-management'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fr
              ? 'Comités, coopératives et associations de producteurs — selon le guide FAO de cogestion aquacole (DACMS).'
              : 'Committees, cooperatives and producer associations — per the FAO aquaculture co-management guidebook (DACMS).'}
          </p>
        </div>
        <button onClick={() => setFormOpen(true)}
          className="text-white px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 inline-flex items-center gap-1 self-start"
          style={{ backgroundColor: 'var(--brand)' }}>
          <Plus className="size-4" /> {fr ? 'Nouveau groupe' : 'New group'}
        </button>
      </div>

      {!configured && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      )}
      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}
      {queuedMsg && (
        <div className="text-sm bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-4 py-3">
          {fr ? 'Hors ligne — le groupe sera synchronisé à la reconnexion.' : 'Offline — the group will sync when you reconnect.'}
        </div>
      )}

      {formOpen && (
        <GroupForm fr={fr} user={user} onClose={() => setFormOpen(false)}
          onSaved={(queued) => { setFormOpen(false); if (queued) setQueuedMsg(true); else load(); }} />
      )}

      {configured && !loading && groups.length === 0 && !formOpen && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-1 font-medium text-gray-700">
              {fr ? 'Aucun groupe de cogestion pour le moment.' : 'No co-management groups yet.'}
            </p>
            <p className="text-sm max-w-md mx-auto">
              {fr
                ? 'Enregistrez un comité de cogestion, une coopérative ou une association, puis reliez-y vos opérateurs, votre plan de cogestion et vos zones.'
                : 'Register a co-management committee, cooperative or association, then link your operators, co-management plan and zones to it.'}
            </p>
            <button onClick={() => setFormOpen(true)} className="mt-4 font-medium" style={{ color: 'var(--brand)' }}>
              + {fr ? 'Enregistrer un groupe' : 'Register a group'}
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <Link key={g.id} href={`/groups/${g.id}`} className="block group">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span className="group-hover:underline decoration-2" style={{ textDecorationColor: 'var(--brand)' }}>{g.name}</span>
                  {g.registered && (
                    <span title={fr ? 'Organisation enregistrée' : 'Registered organization'}>
                      <BadgeCheck className="size-5 shrink-0" style={{ color: 'var(--brand-2)' }} />
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {[g.region, g.country].filter(Boolean).join(', ') || '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {g.group_type && <Badge variant="outline">{label(ACM_GROUP_TYPES, g.group_type, fr)}</Badge>}
                  {g.acm_model && <Badge variant="outline" style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}>{label(ACM_MODELS, g.acm_model, fr)}</Badge>}
                  {g.degree && <Badge variant="outline" style={{ color: 'var(--brand-2)', borderColor: 'var(--brand-2)' }}>{label(ACM_DEGREES, g.degree, fr)}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    {g.members_declared ?? memberCounts[g.id] ?? 0} {fr ? 'membres' : 'members'}
                  </span>
                  {g.women_declared != null && g.members_declared > 0 && (
                    <span>{Math.round((100 * g.women_declared) / g.members_declared)}% {fr ? 'femmes' : 'women'}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground pt-2">
        {fr ? 'Cadre : ' : 'Framework: '}
        <a href={DACMS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          {DACMS_SOURCE.citation}
        </a>
      </p>
    </div>
  );
}

