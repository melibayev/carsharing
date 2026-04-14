import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Bell, Menu, LogOut, User, LayoutDashboard, Settings, Shield, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-notifications';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useThemeStore } from '@/stores/theme-store';

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.email === 'admin@CarSharing.dev';
  const { theme, toggle: toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
            <Car className="h-6 w-6 text-primary" />
            <span>CarSharing</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.search')}
            </Link>
            {isAuthenticated() && (
              <Link to="/host/cars/new" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.listYourCar')}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />

          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated() ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
                {unreadCount != null && unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profilePhotoUrl ?? undefined} alt={user?.firstName} />
                      <AvatarFallback>{getInitials(user?.firstName ?? '', user?.lastName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild>
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t p-4 space-y-2">
          <Link
            to="/search"
            className="block text-sm font-medium py-2"
            onClick={() => setMobileOpen(false)}
          >
            {t('nav.search')}
          </Link>
          {isAuthenticated() && (
            <Link
              to="/host/cars"
              className="block text-sm font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              {t('nav.listYourCar')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
