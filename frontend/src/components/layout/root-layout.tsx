import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { MobileBottomNav } from './mobile-bottom-nav';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-14 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </div>
  );
}
