import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import SupportWidget from '@/components/shared/SupportWidget';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function RootLayout() {
  const { pathname } = useLocation();
  const isMessages = pathname.startsWith('/messages');

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className={isMessages ? 'flex-1 overflow-hidden' : 'flex-1 pb-14 md:pb-0'}>
        <Outlet />
      </main>
      {!isMessages && <Footer />}
      <MobileBottomNav />
      <Toaster />
      <SupportWidget />
    </div>
  );
}
