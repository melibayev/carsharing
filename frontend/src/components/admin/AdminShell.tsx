import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  CalendarCheck,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/cars', icon: Car, label: 'Cars' },
  { to: '/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
  { to: '/admin/verifications', icon: ShieldCheck, label: 'Verifications' },
  { to: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
  { to: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Log' },
];

export default function AdminShell() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-sidebar text-sidebar-foreground shrink-0">
        <div className="px-4 py-5 border-b border-sidebar-border/50">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-background border-b overflow-x-auto">
        <nav className="flex gap-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 md:pt-6 mt-12 md:mt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
