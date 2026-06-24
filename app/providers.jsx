'use client';

import { LangProvider } from '@/src/context/LangContext';
import { AuthProvider } from '@/src/context/AuthContext';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import BottomNav from '@/src/components/BottomNav';
import OfflineBanner from '@/src/components/OfflineBanner';
import ServiceWorkerRegister from '@/src/components/ServiceWorkerRegister';

export default function Providers({ children }) {
  return (
    <LangProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC' }}>
          <Navbar />
          <OfflineBanner />
          {/* pb on mobile so content clears the fixed bottom nav */}
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <ServiceWorkerRegister />
        </div>
      </AuthProvider>
    </LangProvider>
  );
}
