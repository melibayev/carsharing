import { Link, useNavigate } from 'react-router-dom';
import { Car, Bell, LogOut, User, Shield, Moon, Sun, Search, CalendarDays, PlusCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useUnreadMessageCount } from '@/hooks/use-messages';
import { getInitials, getAvatarColor } from '@/lib/utils';
import { useState } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  const { data: unreadMessages } = useUnreadMessageCount();
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = user?.email === 'admin@CarSharing.dev';
  const { theme, toggle: toggleTheme } = useThemeStore();

  const isHost = user?.hostOnboardingStatus === 'Complete';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?city=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl shrink-0">
          <Car className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">CarSharing</span>
        </Link>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden md:flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by city…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-full bg-muted border-0"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/search')}>
            <Search className="h-5 w-5" />
          </Button>

          {isAuthenticated() ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/messages')} title="Messages">
                <MessageSquare className="h-5 w-5" />
                {unreadMessages != null && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
                {unreadCount != null && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profilePhotoUrl ?? undefined} alt={user?.firstName} />
                      <AvatarFallback className={getAvatarColor(user?.firstName ?? '')}>{getInitials(user?.firstName ?? '', user?.lastName)}</AvatarFallback>
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

                  <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {isHost ? (
                    <DropdownMenuItem onClick={() => navigate('/host')}>
                      <Car className="mr-2 h-4 w-4" />
                      Host Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate('/host/become-a-host')}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Become a Host
                    </DropdownMenuItem>
                  )}

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
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
