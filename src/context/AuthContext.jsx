'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

  const signUp = (email, password, meta) =>
    supabase.auth.signUp({ email, password, options: { data: meta } });

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user: session?.user ?? null,
    agent,
    isAdmin: agent?.role === 'admin',
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
