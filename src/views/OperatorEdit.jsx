'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import OperatorForm from '../components/OperatorForm';
import PhotoUpload from '../components/PhotoUpload';

// Edit an existing operator (fixes the "registrations are permanent" blocker).
// Guarded delete lives here too until the operator detail page ships.
export default function OperatorEdit({ operatorId }) {
  const { t, lang } = useLang();
  const { configured } = useAuth();
  const router = useRouter();
  const fr = lang === 'fr';

  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    const { data, error } = await supabase.from('operators').select('*').eq('id', operatorId).single();
    if (error) setError(error.message);
    else setOperator(data);
    setLoading(false);
  }, [configured, operatorId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    const msg = fr
      ? `Supprimer définitivement « ${operator.name} » et toutes ses saisies (productions, événements) ?`
      : `Permanently delete "${operator.name}" and all their entries (logs, events)?`;
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from('operators').delete().eq('id', operatorId);
    if (error) { setError(error.message); return; }
    toast.success(fr ? 'Opérateur supprimé.' : 'Operator deleted.');
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
            <ChevronLeft className="size-4" /> {t.nav.dashboard}
          </Link>
          {operator && (
            <button onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 bg-white">
              <Trash2 className="size-4" /> {fr ? "Supprimer l'opérateur" : 'Delete operator'}
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-center mb-8 text-black">
          {fr ? 'Modifier un opérateur' : 'Edit operator'}{operator ? ` — ${operator.name}` : ''}
        </h1>

        {error && <div className="mb-6 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}
        {loading && <p className="text-center text-sm text-gray-400">{fr ? 'Chargement…' : 'Loading…'}</p>}
        {!loading && !operator && !error && (
          <p className="text-center text-sm text-gray-400">{fr ? 'Opérateur introuvable.' : 'Operator not found.'}</p>
        )}

        {operator && (
          <>
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <PhotoUpload bucket="operator-photos" path={operator.photo_path} subdir={operator.id} fr={fr}
                label={fr ? 'Photo de l’exploitation / opérateur' : 'Farm / operator photo'}
                onChange={async (p) => {
                  const { error } = await supabase.from('operators').update({ photo_path: p }).eq('id', operator.id);
                  if (error) toast.error(error.message);
                  else { setOperator((o) => ({ ...o, photo_path: p })); toast.success(fr ? 'Photo enregistrée ✓' : 'Photo saved ✓'); }
                }} />
            </div>
            <OperatorForm
              initialOperator={operator}
              onSaved={() => { toast.success(fr ? 'Modifications enregistrées ✓' : 'Changes saved ✓'); router.push('/dashboard'); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
