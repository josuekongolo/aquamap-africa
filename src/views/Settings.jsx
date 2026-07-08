'use client';

import { useState, useEffect } from 'react';
import { UserCog, RefreshCw, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400';

// Agent self-service: profile (name, organization display), language, and
// password change. Email changes stay out (auth-sensitive; via support).
export default function Settings() {
  const { t, lang, toggle } = useLang();
  const { user, agent, role, updatePassword } = useAuth();
  const fr = lang === 'fr';

  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (agent) { setFullName(agent.full_name || ''); setOrganization(agent.organization || ''); }
  }, [agent]);

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.from('agents').update({ full_name: fullName, organization }).eq('id', user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message); else toast.success(fr ? 'Profil mis à jour ✓' : 'Profile updated ✓');
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw !== pw2) { toast.error(t.auth.passwordMismatch); return; }
    if (pw.length < 6) { toast.error(fr ? 'Au moins 6 caractères.' : 'At least 6 characters.'); return; }
    setSavingPw(true);
    const { error } = await updatePassword(pw);
    setSavingPw(false);
    if (error) toast.error(error.message);
    else { toast.success(fr ? 'Mot de passe mis à jour ✓' : 'Password updated ✓'); setPw(''); setPw2(''); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-black flex items-center gap-2.5">
          <UserCog className="size-7" style={{ color: 'var(--brand)' }} /> {fr ? 'Paramètres' : 'Settings'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
          {user?.email}
          {role && <Badge variant="outline">{role}</Badge>}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr ? 'Profil' : 'Profile'}</CardTitle>
          <CardDescription>{fr ? 'Votre nom et organisation, visibles par votre équipe.' : 'Your name and organization, visible to your team.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.fullName}</label>
              <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.organization}</label>
              <input className={input} value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
            <button type="submit" disabled={savingProfile}
              className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}>
              {savingProfile ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />} {fr ? 'Enregistrer' : 'Save'}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr ? 'Langue' : 'Language'}</CardTitle>
        </CardHeader>
        <CardContent>
          <button onClick={toggle} className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            {fr ? 'Passer en anglais (English)' : 'Switch to French (Français)'}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="size-4" style={{ color: 'var(--brand)' }} /> {fr ? 'Mot de passe' : 'Password'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.newPassword}</label>
              <input type="password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} minLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.confirmPassword}</label>
              <input type="password" className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={6} required />
            </div>
            <button type="submit" disabled={savingPw}
              className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}>
              {savingPw ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />} {t.auth.updatePassword}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
