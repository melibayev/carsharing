import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function SetupChoicePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <BadgeCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email verified!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account is ready. To book a car or list your own, you'll need to verify your identity — but you can do that later too.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full h-12 text-base"
            onClick={() => navigate('/onboarding?step=3')}
          >
            <ShieldCheck className="h-5 w-5 mr-2" />
            Verify Your Identity
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => navigate('/dashboard')}
          >
            <Clock className="h-5 w-5 mr-2" />
            Do it Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          You can always verify your identity from your dashboard before booking.
        </p>
      </div>
    </div>
  );
}
