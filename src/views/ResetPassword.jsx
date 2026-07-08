'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, KeyRound } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Input } from '../components/supabase-ui/Input';
import { Button } from '../components/supabase-ui/Button';

// Landing page for Supabase password-recovery links. supabase-js exchanges the
// token in the URL for a recovery session automatically (detectSessionInUrl);
// once that session exists we let the user set a new password via updateUser.
export default function ResetPassword() {
  const { t } = useLang();
  const { user, loading, configured, updatePassword } = useAuth();
  const router = useRouter();

  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery session can arrive slightly after mount (token exchange).
  // Accept either the PASSWORD_RECOVERY event or any signed-in session.
  useEffect(() => {
    if (!configured) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const ready = recoveryReady || !!user;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t.auth.passwordMismatch); return; }
    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) { setError(error.message); return; }
      setDone(true);
      setTimeout(() => router.replace('/dashboard'), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl border border-black/[0.08] shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <KeyRound className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--brand)' }} />
          <h1 className="text-2xl font-bold text-black">{t.auth.resetTitle}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.auth.resetSub}</p>
        </div>

        {!configured && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-3">
            <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
          </div>
        )}

        {configured && !loading && !ready && (
          <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3">
            {t.auth.resetInvalid}
            <Link href="/login" className="block mt-2 font-medium underline">{t.auth.backToLogin}</Link>
          </div>
        )}

        {done && (
          <div className="mb-4 text-sm bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3">
            {t.auth.resetSuccess}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {configured && ready && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t.auth.newPassword} type="password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label={t.auth.confirmPassword} type="password" required minLength={6}
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" variant="primary" size="large" block loading={busy} className="mt-2">
              {t.auth.updatePassword}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
