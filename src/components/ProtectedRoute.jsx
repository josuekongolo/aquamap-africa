'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

// Gates a route behind agent auth. Pass adminOnly to additionally require the
// admin role. Client-side guard (App Router): redirect via the router in an effect.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, agent, isAdmin, loading, signOut } = useAuth();
  const { t, lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <RefreshCw className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  // Soft-deactivated agents (agents.active = false) are blocked everywhere.
  if (agent && agent.active === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center text-gray-500 max-w-sm">
          <div className="mb-3 flex justify-center"><Lock className="w-9 h-9" /></div>
          {lang === 'fr'
            ? 'Ce compte a été désactivé. Contactez votre coordinateur ou contact@aqafrica.com.'
            : 'This account has been deactivated. Contact your coordinator or contact@aqafrica.com.'}
          <button onClick={() => signOut()} className="block mx-auto mt-4 text-sm font-medium underline">
            {t.auth.signOut}
          </button>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center text-gray-500">
          <div className="mb-3 flex justify-center"><Lock className="w-9 h-9" /></div>
          {t.auth.adminOnly}
        </div>
      </div>
    );
  }

  return children;
}
