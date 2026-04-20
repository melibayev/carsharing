import { NavLink } from 'react-router-dom';
import { Home, Search, LayoutDashboard, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const guestNav = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Trips' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function MobileBottomNav() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {guestNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
