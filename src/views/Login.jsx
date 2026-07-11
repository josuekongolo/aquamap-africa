'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/supabase-ui/Input';
import { Button } from '../components/supabase-ui/Button';

export default function Login() {
  const { t } = useLang();
  const { signIn, signUp, resetPassword, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/dashboard';

  // modes: signin | signup | forgot. Self-serve signup creates a private
  // workspace (org) for the new agent — see handle_new_user() in schema.sql.
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', organization: '', accept: false });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (!configured) { setError(t.auth.notConfigured); return; }
    if (mode === 'signup' && !form.accept) { setError(t.auth.acceptRequired); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(form.email);
        if (error) { setError(error.message); return; }
        setInfo(t.auth.resetSent);
      } else if (mode === 'signup') {
        const { data, error } = await signUp(form.email, form.password, {
          fullName: form.fullName, organization: form.organization,
        });
        if (error) { setError(error.message); return; }
        // Email confirmation on → no session yet; ask them to confirm. If a
        // session comes back (confirmation off), go straight to the dashboard.
        if (data?.session) router.replace(redirectTo);
        else { setInfo(t.auth.checkEmail); setMode('signin'); }
      } else {
        const { error } = await signIn(form.email, form.password);
        if (error) { setError(error.message); return; }
        router.replace(redirectTo);
      }
    } finally {
      setBusy(false);
    }
  }

  const isForgot = mode === 'forgot';
  const isSignup = mode === 'signup';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl border border-black/[0.08] shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark; next/image optimization is unnecessary */}
          <img src="/img/logo-mark.png" alt="AQAFRIKA" className="w-14 h-14 mx-auto mb-2 object-contain" />
          <h1 className="text-2xl font-bold text-black">
            {isForgot ? t.auth.forgotTitle : isSignup ? t.auth.signupTitle : t.auth.loginTitle}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{isForgot ? t.auth.forgotSub : isSignup ? t.auth.signupSub : t.auth.loginSub}</p>
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
              <Input label={t.auth.fullName} type="text" required value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              <Input label={`${t.auth.organization} (${t.auth.optional})`} type="text" value={form.organization} onChange={e => set('organization', e.target.value)} />
            </>
          )}
          <Input label={t.auth.email} type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
          {!isForgot && (
            <Input label={t.auth.password} type="password" required value={form.password} onChange={e => set('password', e.target.value)} />
          )}

          {isSignup && (
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.accept} onChange={e => set('accept', e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]" />
              <span>
                {t.auth.acceptTerms}{' '}
                <a href="/privacy" target="_blank" className="underline hover:text-gray-900">{t.auth.privacyLink}</a>
                {' · '}
                <a href="/terms" target="_blank" className="underline hover:text-gray-900">{t.auth.termsLink}</a>
              </span>
            </label>
          )}

          <Button type="submit" variant="primary" size="large" block loading={busy} className="mt-2">
            {busy ? t.auth.signingIn : isForgot ? t.auth.sendReset : isSignup ? t.auth.signUp : t.auth.signIn}
          </Button>
        </form>

        {mode === 'signin' && (
          <div className="mt-3 space-y-2 text-sm text-center">
            <button
              onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
              className="block w-full text-gray-500 hover:text-gray-800 hover:underline"
            >
              {t.auth.forgot}
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
              className="block w-full font-medium hover:underline"
              style={{ color: 'var(--brand)' }}
            >
              {t.auth.noAccount}
            </button>
          </div>
        )}
        {isSignup && (
          <button
            onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
            className="mt-4 w-full text-sm text-center font-medium hover:underline"
            style={{ color: '#000' }}
          >
            {t.auth.haveAccount}
          </button>
        )}
        {isForgot && (
          <button
            onClick={() => { setMode('signin'); setError(''); setInfo(''); }}
            className="mt-4 w-full text-sm text-center font-medium hover:underline"
            style={{ color: '#000' }}
          >
            {t.auth.backToLogin}
          </button>
        )}
        <p className="mt-2 text-xs text-center text-gray-400">
          <a href="/privacy" className="underline hover:text-gray-600">{t.auth.privacyLink}</a>
          {' · '}
          <a href="/terms" className="underline hover:text-gray-600">{t.auth.termsLink}</a>
        </p>
      </div>
    </div>
  );
}
