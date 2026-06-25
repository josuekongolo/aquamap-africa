'use client';

import { useState } from 'react';
import LogoMark from '../components/LogoMark';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/supabase-ui/Input';
import { Button } from '../components/supabase-ui/Button';

export default function Login() {
  const { t } = useLang();
  const { signIn, signUp, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [form, setForm] = useState({ email: '', password: '', fullName: '', organization: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (!configured) { setError(t.auth.notConfigured); return; }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(form.email, form.password);
        if (error) { setError(error.message); return; }
        router.replace(redirectTo);
      } else {
        const { data, error } = await signUp(form.email, form.password, {
          full_name: form.fullName,
          organization: form.organization,
        });
        if (error) { setError(error.message); return; }
        if (data.session) router.replace(redirectTo);
        else { setInfo(t.auth.checkEmail); setMode('signin'); }
      }
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl border border-black/[0.08] shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <LogoMark className="w-14 h-14 mx-auto mb-2" style={{ color: 'var(--brand)' }} />
          <h1 className="text-2xl font-bold text-black">
            {isSignup ? t.auth.signupTitle : t.auth.loginTitle}
          </h1>
          {!isSignup && <p className="text-gray-500 text-sm mt-1">{t.auth.loginSub}</p>}
        </div>

        {!configured && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-4 py-3">
            <AlertTriangle className="inline w-4 h-4 -mt-0.5" /> {t.auth.notConfigured}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 text-sm bg-green-50 border border-green-200 text-green-700 rounded-md px-4 py-3">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <Input label={t.auth.fullName} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              <Input label={t.auth.organization} value={form.organization} onChange={e => set('organization', e.target.value)} />
            </>
          )}
          <Input label={t.auth.email} type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label={t.auth.password} type="password" required value={form.password} onChange={e => set('password', e.target.value)} />

          <Button type="submit" variant="primary" size="large" block loading={busy} className="mt-2">
            {busy ? t.auth.signingIn : isSignup ? t.auth.signUp : t.auth.signIn}
          </Button>
        </form>

        <button
          onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); setInfo(''); }}
          className="mt-4 w-full text-sm text-center font-medium hover:underline"
          style={{ color: '#000' }}
        >
          {isSignup ? t.auth.haveAccount : t.auth.noAccount}
        </button>
      </div>
    </div>
  );
}
