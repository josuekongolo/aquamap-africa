'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, MapPin, BadgeCheck, ChevronLeft, Trash2, AlertTriangle, Pencil, Download, FileText } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ACM_GROUP_TYPES, ACM_MODELS, ACM_DEGREES } from '../data/dacms';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GroupForm from '../components/groups/GroupForm';
import PhotoUpload from '../components/PhotoUpload';
import MembersTab from '../components/groups/MembersTab';
import PlanTab from '../components/groups/PlanTab';
import MeetingsTab from '../components/groups/MeetingsTab';
import IncidentsTab from '../components/groups/IncidentsTab';
import AssessmentTab from '../components/groups/AssessmentTab';
import ZonesTab from '../components/groups/ZonesTab';

const label = (list, id, fr) => {
  const item = list.find((x) => x.id === id);
  return item ? (fr ? item.fr : item.en) : null;
};

// One co-management group: members & representation, plan & indicators,
// meetings, conflict/compliance register, DACMS self-assessment, zones.
export default function GroupDetail({ groupId }) {
  const { t, lang } = useLang();
  const { user, configured, isCoordinator } = useAuth();
  const router = useRouter();
  const fr = lang === 'fr';

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (error) setError(error.message);
    else setGroup(data);
    setLoading(false);
  }, [configured, groupId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // Donor M&E export: one CSV bundling the DACMS assessment, plan indicators,
  // meetings and conflict register for this group (the data DACMS exists to feed).
  async function exportGroupCsv() {
    const [{ data: inds }, { data: mtgs }, { data: incs }, { data: asmts }] = await Promise.all([
      supabase.from('plan_indicators').select('name, category, unit, baseline, target, current, plans!inner(group_id)').eq('plans.group_id', groupId),
      supabase.from('meetings').select('meeting_date, title, attendees_count, women_count, decisions').eq('group_id', groupId).order('meeting_date'),
      supabase.from('incidents').select('incident_date, kind, conflict_type, status, sanction, resolution').eq('group_id', groupId).order('incident_date'),
      supabase.from('assessments').select('criterion_id, score, assessed_on').eq('group_id', groupId).order('criterion_id'),
    ]);
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const section = (title, cols, rows) => [
      title, cols.join(','),
      ...(rows || []).map((r) => cols.map((c) => esc(r[c])).join(',')), '',
    ].join('\n');
    const csv = '﻿' + [
      `AQAFRIKA — ${fr ? 'Rapport de cogestion' : 'Co-management report'}: ${group.name}`, '',
      section(fr ? 'INDICATEURS' : 'INDICATORS', ['name', 'category', 'unit', 'baseline', 'target', 'current'], inds),
      section(fr ? 'REUNIONS' : 'MEETINGS', ['meeting_date', 'title', 'attendees_count', 'women_count', 'decisions'], mtgs),
      section(fr ? 'CONFLITS & CONFORMITE' : 'CONFLICTS & COMPLIANCE', ['incident_date', 'kind', 'conflict_type', 'status', 'sanction', 'resolution'], incs),
      section(fr ? 'AUTO-EVALUATION DACMS' : 'DACMS ASSESSMENT', ['criterion_id', 'score', 'assessed_on'], asmts),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(group.name || 'group').replace(/\s+/g, '_')}_report.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    const msg = fr
      ? 'Supprimer ce groupe et toutes ses données (membres, plan, réunions, registre, évaluation, zones) ?'
      : 'Delete this group and all its data (members, plan, meetings, register, assessment, zones)?';
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) { setError(error.message); return; }
    router.push('/groups');
  }

  if (!configured) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
          <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
        <ChevronLeft className="size-4" /> {fr ? 'Tous les groupes' : 'All groups'}
      </Link>

      {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}
      {loading && <p className="text-sm text-muted-foreground">{fr ? 'Chargement…' : 'Loading…'}</p>}
      {!loading && !group && !error && (
        <p className="text-sm text-muted-foreground">{fr ? 'Groupe introuvable.' : 'Group not found.'}</p>
      )}

      {group && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-black flex items-center gap-2.5">
                <Users className="size-7" style={{ color: 'var(--brand)' }} />
                {group.name}
                {group.registered && (
                  <span title={fr ? 'Organisation enregistrée' : 'Registered organization'}>
                    <BadgeCheck className="size-6" style={{ color: 'var(--brand-2)' }} />
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {[group.region, group.country].filter(Boolean).join(', ') || '—'}
                {group.established_on && <span>· {fr ? 'créé le' : 'est.'} {group.established_on}</span>}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {group.group_type && <Badge variant="outline">{label(ACM_GROUP_TYPES, group.group_type, fr)}</Badge>}
                {group.acm_model && <Badge variant="outline" style={{ color: 'var(--brand)', borderColor: 'var(--brand)' }}>{label(ACM_MODELS, group.acm_model, fr)}</Badge>}
                {group.degree && <Badge variant="outline" style={{ color: 'var(--brand-2)', borderColor: 'var(--brand-2)' }}>{label(ACM_DEGREES, group.degree, fr)}</Badge>}
              </div>
              {group.description && <p className="text-sm text-gray-600 mt-3 max-w-2xl">{group.description}</p>}
            </div>{/* header text block */}
            <div className="flex items-center gap-2 self-start shrink-0">
              <Link href={`/groups/${groupId}/report`}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50">
                <FileText className="size-4" /> {fr ? 'Rapport' : 'Report'}
              </Link>
              <button onClick={exportGroupCsv}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50">
                <Download className="size-4" /> CSV
              </button>
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50">
                <Pencil className="size-4" /> {fr ? 'Modifier' : 'Edit'}
              </button>
              {isCoordinator && (
                <button onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50">
                  <Trash2 className="size-4" /> {fr ? 'Supprimer' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {editing && (
            <GroupForm fr={fr} user={user} initialGroup={group}
              onClose={() => setEditing(false)}
              onSaved={() => { setEditing(false); load(); }} />
          )}

          {/* Signed co-management agreement scan (FAO Box 2 legal document) */}
          <div className="rounded-lg border bg-white px-4 py-3">
            <PhotoUpload bucket="group-docs" path={group.agreement_path} subdir={group.id} accept="image/*,application/pdf" fr={fr}
              label={fr ? 'Accord de cogestion signé (scan / photo)' : 'Signed co-management agreement (scan / photo)'}
              onChange={async (p) => {
                const { error } = await supabase.from('groups').update({ agreement_path: p }).eq('id', group.id);
                if (error) setError(error.message); else setGroup((g) => ({ ...g, agreement_path: p }));
              }} />
          </div>

          <Tabs defaultValue="members">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="members">{fr ? 'Membres' : 'Members'}</TabsTrigger>
              <TabsTrigger value="plan">{fr ? 'Plan & indicateurs' : 'Plan & indicators'}</TabsTrigger>
              <TabsTrigger value="meetings">{fr ? 'Réunions' : 'Meetings'}</TabsTrigger>
              <TabsTrigger value="incidents">{fr ? 'Conflits & conformité' : 'Conflicts & compliance'}</TabsTrigger>
              <TabsTrigger value="assessment">{fr ? 'Auto-évaluation FAO' : 'FAO self-assessment'}</TabsTrigger>
              <TabsTrigger value="zones">{fr ? 'Zones' : 'Zones'}</TabsTrigger>
            </TabsList>
            <TabsContent value="members"><MembersTab group={group} fr={fr} user={user} /></TabsContent>
            <TabsContent value="plan"><PlanTab group={group} fr={fr} user={user} /></TabsContent>
            <TabsContent value="meetings"><MeetingsTab group={group} fr={fr} user={user} /></TabsContent>
            <TabsContent value="incidents"><IncidentsTab group={group} fr={fr} user={user} /></TabsContent>
            <TabsContent value="assessment"><AssessmentTab group={group} fr={fr} user={user} /></TabsContent>
            <TabsContent value="zones"><ZonesTab group={group} fr={fr} user={user} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
