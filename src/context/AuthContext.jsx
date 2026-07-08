'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearQueue } from '../lib/offlineQueue';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [agent, setAgent] = useState(null);   // row from public.agents
  // Only "loading" while we actually have a backend to query a session from.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Load the agent profile (role, name) for a signed-in user.
  async function loadAgent(userId) {
    if (!userId) { setAgent(null); return; }
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setAgent(data ?? null);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.access_token) supabase.realtime.setAuth(data.session.access_token);
      await loadAgent(data.session?.user?.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.access_token) supabase.realtime.setAuth(newSession.access_token);
      await loadAgent(newSession?.user?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  // Clear any queued offline writes on sign-out — they carry farmer PII and
  // belong to the agent who was signed in on this device.
  const signOut = async () => {
    try { await clearQueue(); } catch { /* no idb — nothing to clear */ }
    return supabase.auth.signOut();
  };

  // Sends the Supabase recovery email; the link lands on /reset-password where
  // the recovery session lets the user set a new password via updatePassword.
  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const updatePassword = (password) => supabase.auth.updateUser({ password });

  const role = agent?.role ?? null;
  const value = {
    session,
    user: session?.user ?? null,
    agent,
    role,
    orgId: agent?.org_id ?? null,
    isAdmin: role === 'admin',
    isCoordinator: role === 'coordinator' || role === 'admin',
    // Viewers are read-only; everyone else with a role can write. RLS enforces
    // this server-side regardless — canWrite just hides write affordances.
    canWrite: role != null && role !== 'viewer',
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
