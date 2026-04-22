import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OnboardingLayout from '@/features/onboarding/OnboardingLayout';
import { OtpInput } from '@/components/shared/OtpInput';
import { useEmailStatus, useSendCode, useVerifyCode } from '@/hooks/use-email-verification';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import api from '@/lib/api';

function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const logout = useAuthStore((s) => s.logout);
  const { completeStep, setStep, reset: resetOnboarding } = useOnboardingStore();
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const { data: statusData, isLoading: statusLoading } = useEmailStatus();
  const sendCode = useSendCode();
  const verifyCode = useVerifyCode();

  // Redirect unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Redirect already-verified users
  useEffect(() => {
    if (user?.emailConfirmed) {
      navigate('/onboarding?step=3', { replace: true });
    }
  }, [user, navigate]);

  // Manage resend countdown from status
  useEffect(() => {
    if (statusData?.nextResendAllowedAt) {
      const diff = Math.ceil(
        (new Date(statusData.nextResendAllowedAt).getTime() - Date.now()) / 1000
      );
      setResendCountdown(Math.max(0, diff));
    }
  }, [statusData]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => {
      setResendCountdown((n) => {
        if (n <= 1) { clearInterval(t); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  const handleCodeChange = (val: string) => {
    setCode(val);
    setVerifyError(null);
    if (val.length === 6) {
      handleVerify(val);
    }
  };

  const handleVerify = async (submittedCode: string) => {
    try {
      await verifyCode.mutateAsync(submittedCode);
      toast({ title: 'Email verified!' });
      completeStep(2);
      setStep(3);
      setTimeout(() => navigate('/onboarding?step=3'), 600);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Verification failed. Please try again.';
      setVerifyError(detail);
      setCode('');
    }
  };

  const handleResend = async () => {
    try {
      await sendCode.mutateAsync();
      toast({ title: 'A new code has been sent to your email.' });
      setCode('');
      setVerifyError(null);
      setResendCountdown(60);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Could not send a new code. Please try again later.';
      toast({ title: detail, variant: 'destructive' });
    }
  };

  const handleWrongEmail = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    resetOnboarding();
    navigate('/register', { replace: true });
  };

  if (!isAuthenticated || statusLoading) return null;

  const email = user?.email ?? '';

  return (
    <OnboardingLayout showBack={false} showSaveExit={false}>
      <div className="flex flex-col items-center text-center max-w-md mx-auto py-8 gap-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <MailCheck className="w-10 h-10 text-neutral-600 dark:text-neutral-300" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{obfuscateEmail(email)}</span>.
            Enter it below to verify your address.
          </p>
        </div>

        <div className="space-y-4 w-full flex flex-col items-center">
          <OtpInput
            value={code}
            onChange={handleCodeChange}
            disabled={verifyCode.isPending}
            error={!!verifyError}
            autoFocus
          />

          {verifyError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {verifyError}
            </p>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          {resendCountdown > 0 ? (
            <p>Resend available in {resendCountdown}s</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={sendCode.isPending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>

        <button
          onClick={handleWrongEmail}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Wrong email? Go back and edit it
        </button>
      </div>
    </OnboardingLayout>
  );
}
