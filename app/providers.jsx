'use client';

import { usePathname } from 'next/navigation';
import { LangProvider } from '@/src/context/LangContext';
import { AuthProvider } from '@/src/context/AuthContext';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import BottomNav from '@/src/components/BottomNav';
import OfflineBanner from '@/src/components/OfflineBanner';
import ServiceWorkerRegister from '@/src/components/ServiceWorkerRegister';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';

export default function Providers({ children }) {
  const pathname = usePathname();
  // The full-bleed map hides the bottom bar, so it needs no reserved space
  // (otherwise a dead strip appears under the map on mobile).
  const reserveBottom = !pathname.startsWith('/map');

  return (
    <LangProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={0}>
          {/* Reserve space for the fixed mobile bottom bar on the whole column
              (so the Footer clears it too), plus the iOS home-indicator inset. */}
          <div className={`min-h-screen flex flex-col md:pb-0 ${reserveBottom ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : ''}`} style={{ backgroundColor: '#F8FAFC' }}>
            <Navbar />
            <OfflineBanner />
            <main className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
          </div>
          <Toaster richColors position="top-right" />
          <ServiceWorkerRegister />
        </TooltipProvider>
      </AuthProvider>
    </LangProvider>
  );
}
