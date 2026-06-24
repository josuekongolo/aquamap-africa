'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

// Gates a route behind agent auth. Pass adminOnly to additionally require the
// admin role. Client-side guard (App Router): redirect via the router in an effect.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLang();
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
