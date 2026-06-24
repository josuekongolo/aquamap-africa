'use client';

import { LangProvider } from '@/src/context/LangContext';
import { AuthProvider } from '@/src/context/AuthContext';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import BottomNav from '@/src/components/BottomNav';
import OfflineBanner from '@/src/components/OfflineBanner';
import ServiceWorkerRegister from '@/src/components/ServiceWorkerRegister';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Providers({ children }) {
  return (
    <LangProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={0}>
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
            <Navbar />
            <OfflineBanner />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
          </div>
          <ServiceWorkerRegister />
        </TooltipProvider>
      </AuthProvider>
    </LangProvider>
  );
}
