import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useRegister } from '@/hooks/use-auth';
import { useCheckEmailAvailable } from '@/hooks/use-onboarding';
import { useAuthStore } from '@/stores/auth-store';
import {
  step1Schema,
  type Step1FormValues,
  getPasswordStrength,
} from '@/features/onboarding/schemas';

export default function OnboardingStep1() {
  const { setStepData, completeStep, setStep } = useOnboardingStore();
  const registerMutation = useRegister();
  const checkEmail = useCheckEmailAvailable();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    register: field,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      termsAccepted: false as unknown as true,
    },
  });

  const passwordValue = watch('password');
  const emailValue = watch('email');
  const strength = getPasswordStrength(passwordValue || '');

  // Debounced email availability check
  useEffect(() => {
    if (!emailValue || emailValue.length < 5 || !emailValue.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkEmail.mutateAsync(emailValue);
        setEmailStatus(available ? 'available' : 'taken');
      } catch {
        setEmailStatus('idle');
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [emailValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: Step1FormValues) => {
    setApiError('');

    if (emailStatus === 'taken') {
      setApiError('This email is already taken');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: '2000-01-01',
      });
      setStepData('step1', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
      });
      completeStep(1);
      setStep(2);
      navigate('/onboarding/verify-email');
    } catch {
      setApiError('Registration failed. Try a different email or password.');
    }
  };

  // If already authenticated AND email verified, skip ahead to onboarding
  // If authenticated but NOT verified, stay here so they can re-register with correct email
  useEffect(() => {
    if (isAuthenticated && authUser?.emailConfirmed) {
      navigate('/onboarding?step=3');
    }
  }, [isAuthenticated, authUser, navigate]);

  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <Link to="/" className="font-heading font-bold text-lg">
            CarSharing
          </Link>
          <h1 className="text-2xl font-medium mt-4">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Get started in a few minutes
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First / Last name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className="pl-10 h-11"
                  {...field('firstName')}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="pl-10 h-11"
                  {...field('lastName')}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="pl-10 h-11"
                {...field('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {emailStatus === 'checking' && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {emailStatus === 'taken' && (
              <p className="text-sm text-destructive">This email is already taken</p>
            )}
            {emailStatus === 'available' && (
              <p className="text-sm text-green-600">Email is available</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="pl-10 pr-10 h-11"
                {...field('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {/* Strength meter: 3-segment bar */}
            {passwordValue && (
              <div className="flex gap-1 h-1.5">
                <div className={`flex-1 rounded-full ${strength === 'weak' || strength === 'fair' || strength === 'strong' ? strengthColors[strength] : 'bg-muted'}`} />
                <div className={`flex-1 rounded-full ${strength === 'fair' || strength === 'strong' ? strengthColors[strength] : 'bg-muted'}`} />
                <div className={`flex-1 rounded-full ${strength === 'strong' ? strengthColors[strength] : 'bg-muted'}`} />
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="pl-10 h-11"
                {...field('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="space-y-1.5">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-muted-foreground/30"
                {...field('termsAccepted')}
              />
              <span className="text-muted-foreground">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={!isValid || isSubmitting || registerMutation.isPending || emailStatus === 'taken'}
          >
            {isSubmitting || registerMutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'}
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
