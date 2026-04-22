import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHostEligibility, useConfirmIdentity } from '@/hooks/use-host';
import { useProfile, useUpdateProfile } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import HostPayoutStep from '@/components/host/HostPayoutStep';
import HostAgreementStep from '@/components/host/HostAgreementStep';

type Step = 'identity' | 'payout' | 'agreement' | 'done';

function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : label}
      </div>
    </div>
  );
}

export default function BecomeAHostPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: eligibility, refetch: refetchEligibility, isLoading: eligibilityLoading } = useHostEligibility();
  const confirmIdentity = useConfirmIdentity();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState<Step>('identity');
  const [phone, setPhone] = useState('');
  const [identityError, setIdentityError] = useState<string | null>(null);

  const status = (profile as any)?.hostOnboardingStatus ?? 'NotStarted';

  // If already complete, redirect
  if (status === 'Complete') {
    navigate('/host', { replace: true });
    return null;
  }

  function handleIdentityConfirmed() {
    setStep('payout');
  }

  async function handleConfirmIdentity() {
    setIdentityError(null);
    try {
      // If phone is newly entered, save it first
      if (phone.trim() && !profile?.phoneNumber) {
        await updateProfile.mutateAsync({ phoneNumber: phone.trim() });
      }
      await confirmIdentity.mutateAsync();
      await refetchEligibility();
      handleIdentityConfirmed();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not confirm identity. Please ensure your KYC verification is approved.';
      setIdentityError(msg);
    }
  }

  const missing = eligibility?.missing ?? [];
  const kycMissing = missing.includes('IdentityNotVerified');
  const emailMissing = missing.includes('EmailNotConfirmed');
  const ageMissing = missing.includes('Under21') || missing.includes('DateOfBirthMissing');
  const isLoading = eligibilityLoading || !profile;
  const hasHardBlocker = kycMissing || emailMissing || ageMissing;

  const steps: { id: Step; label: string; icon: typeof ShieldCheck }[] = [
    { id: 'identity', label: 'Identity', icon: ShieldCheck },
    { id: 'payout', label: 'Payout Method', icon: CreditCard },
    { id: 'agreement', label: 'Host Agreement', icon: FileText },
  ];

  const stepIdx = { identity: 0, payout: 1, agreement: 2, done: 3 };
  const current = stepIdx[step];

  return (
    <div className="min-h-screen bg-background">
      {/* Progress header */}
      <div className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold mb-4">Become a Host</h1>
          <div className="flex items-center gap-0">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <StepDot label={String(i + 1)} active={current === i} done={current > i} />
                <div className="flex-1 relative">
                  <div className="absolute inset-x-0 top-[15px] h-0.5 bg-border" />
                  <div
                    className="absolute left-0 top-[15px] h-0.5 bg-primary transition-all"
                    style={{ width: current > i ? '100%' : current === i ? '0%' : '0%' }}
                  />
                </div>
              </div>
            ))}
            <StepDot label={String(steps.length)} active={false} done={current >= steps.length} />
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((s) => (
              <span key={s.id} className="text-xs text-muted-foreground w-16 text-center">{s.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 'identity' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Confirm your identity</h2>
              <p className="text-muted-foreground mt-2">
                Review your personal information below. We'll use this to verify your identity as a host.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Read-only fields from registration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">First Name</Label>
                    <Input value={profile?.firstName ?? ''} readOnly className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <Input value={profile?.lastName ?? ''} readOnly className="bg-muted cursor-default" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={profile?.email ?? ''} readOnly className="bg-muted cursor-default" />
                </div>

                {profile?.dateOfBirth && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                    <Input
                      value={format(new Date(profile.dateOfBirth), 'MMMM d, yyyy')}
                      readOnly
                      className="bg-muted cursor-default"
                    />
                  </div>
                )}

                {/* Phone — editable only if not yet set */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Phone Number {!profile?.phoneNumber && <span className="text-primary">*</span>}
                  </Label>
                  {profile?.phoneNumber ? (
                    <Input value={profile.phoneNumber} readOnly className="bg-muted cursor-default" />
                  ) : (
                    <Input
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  )}
                </div>

                {/* KYC status */}
                <div className={`flex items-start gap-3 rounded-lg p-3 ${kycMissing ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  <ShieldCheck className={`h-5 w-5 mt-0.5 shrink-0 ${kycMissing ? 'text-destructive' : 'text-primary'}`} />
                  <div>
                    {kycMissing ? (
                      <>
                        <p className="font-medium text-destructive text-sm">Identity not yet verified</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You must complete{' '}
                          <a href="/kyc" className="underline font-medium text-primary">KYC verification</a>{' '}
                          before becoming a host.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-sm">Identity verified</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your KYC verification is approved.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Other blockers */}
                {emailMissing && (
                  <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
                    Your email address is not confirmed. Please check your inbox for a confirmation link.
                  </div>
                )}
                {ageMissing && (
                  <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
                    Hosts must be at least 21 years old.
                  </div>
                )}

                {identityError && (
                  <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
                    {identityError}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleConfirmIdentity}
              disabled={
                confirmIdentity.isPending ||
                updateProfile.isPending ||
                isLoading ||
                hasHardBlocker ||
                (!profile?.phoneNumber && phone.trim().length < 7)
              }
            >
              {confirmIdentity.isPending || updateProfile.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</>
              ) : (
                'Confirm Identity & Continue'
              )}
            </Button>
          </div>
        )}

        {step === 'payout' && (
          <HostPayoutStep onNext={() => setStep('agreement')} />
        )}

        {step === 'agreement' && (
          <HostAgreementStep onComplete={() => {
            setStep('done');
            setTimeout(() => navigate('/host'), 1500);
          }} />
        )}

        {step === 'done' && (
          <div className="text-center space-y-4 py-12">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold">You're a host!</h2>
            <p className="text-muted-foreground">Redirecting to your host dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}
