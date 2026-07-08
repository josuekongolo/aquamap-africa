'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Check, RefreshCw, Trash2, Hexagon, Map as MapIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ZONE_TYPES } from '../../data/dacms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ZoneMapEditor = dynamic(() => import('./ZoneMapEditor'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-lg border bg-gray-100 animate-pulse" />,
});

const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Demarcated boundaries (FAO Annex I.1.2.1): the co-managed area plus exclusion
// zones (conservation, nursery grounds, navigation routes) as GeoJSON polygons.
// Zones also render on the public /map operators layer (auth-gated).
export default function ZonesTab({ group, fr, user }) {
  const [zones, setZones] = useState([]);
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('comanaged');
  const [ring, setRing] = useState([]);
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('zones').select('*').eq('group_id', group.id).order('created_at');
    setZones(data || []);
  }, [group.id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const typeMeta = (id) => ZONE_TYPES.find((z) => z.id === id) || ZONE_TYPES[ZONE_TYPES.length - 1];

  async function save() {
    setError('');
    if (ring.length < 3) { setError(fr ? 'Tracez au moins 3 points sur la carte.' : 'Draw at least 3 points on the map.'); return; }
    if (!name.trim()) { setError(fr ? 'Donnez un nom à la zone.' : 'Give the zone a name.'); return; }
    setSaving(true);
    const { error } = await supabase.from('zones').insert({
      group_id: group.id, created_by: user.id, name: name.trim(), zone_type: zoneType,
      geojson: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setName(''); setRing([]); setEditorKey((k) => k + 1);
    load();
  }

  async function remove(id) {
    const { error } = await supabase.from('zones').delete().eq('id', id);
    if (error) setError(error.message); else { setEditorKey((k) => k + 1); load(); }
  }

  const zonesWithColor = zones.map((z) => ({ ...z, color: typeMeta(z.zone_type).color }));
  const center = group.lat != null && group.lng != null ? [group.lng, group.lat] : null;

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hexagon className="size-4" style={{ color: 'var(--brand)' }} />
            {fr ? 'Délimiter une zone' : 'Demarcate a zone'}
          </CardTitle>
          <CardDescription>
            {fr
              ? 'Cliquez sur la carte pour tracer le polygone — zone cogérée et zones d’exclusion (conservation, nurserie, navigation). Indicateur FAO I.1.2.1 : des cartes SIG endossées, intégrées à l’accord de cogestion.'
              : 'Click the map to trace the polygon — co-managed area and exclusion zones (conservation, nursery, navigation). FAO indicator I.1.2.1: endorsed GIS maps incorporated in the co-management agreement.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={`${input} flex-1`} value={name} onChange={(e) => setName(e.target.value)}
              placeholder={fr ? 'Nom de la zone (ex : Zone cogérée du lac)' : 'Zone name (e.g. Lake co-managed area)'} />
            <select className={`${input} bg-white`} value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
              {ZONE_TYPES.map((z) => <option key={z.id} value={z.id}>{fr ? z.fr : z.en}</option>)}
            </select>
            <button onClick={save} disabled={saving || ring.length < 3}
              className="inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand)' }}>
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
              {fr ? 'Enregistrer la zone' : 'Save zone'}
            </button>
          </div>
          <ZoneMapEditor key={editorKey} existingZones={zonesWithColor} center={center}
            color={typeMeta(zoneType).color} onChange={setRing} />
          {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">{error}</div>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {zones.length === 0 && (
          <p className="text-sm text-muted-foreground px-1">
            {fr ? 'Aucune zone délimitée pour ce groupe.' : 'No zones demarcated for this group yet.'}
          </p>
        )}
        {zones.map((z) => {
          const meta = typeMeta(z.zone_type);
          return (
            <Card key={z.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0 border" style={{ backgroundColor: `${meta.color}40`, borderColor: meta.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{z.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {z.geojson?.coordinates?.[0]?.length ? `${z.geojson.coordinates[0].length - 1} ${fr ? 'sommets' : 'vertices'}` : ''}
                  </p>
                </div>
                <Badge variant="outline" style={{ color: meta.color, borderColor: meta.color }}>{fr ? meta.fr : meta.en}</Badge>
                <button onClick={() => remove(z.id)} className="text-gray-300 hover:text-red-600"><Trash2 className="size-4" /></button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {zones.length > 0 && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <MapIcon className="size-3.5" />
          {fr ? 'Vos zones apparaissent aussi sur la ' : 'Your zones also appear on the '}
          <Link href="/map" className="underline" style={{ color: 'var(--brand)' }}>{fr ? 'carte live' : 'live map'}</Link>.
        </p>
      )}
    </div>
  );
}
