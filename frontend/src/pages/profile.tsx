import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/auth-store';
import { useUpdateProfile } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getInitials, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      bio: user?.bio ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data, {
      onSuccess: () => toast({ title: 'Profile updated!' }),
      onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
    });
  };

  if (!user) return null;

  return (
    <div className="container py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('nav.profile')}</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profilePhotoUrl ?? undefined} />
              <AvatarFallback className="text-xl">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2">
                {user.isIdentityVerified && <Badge variant="secondary">Tasdiqlangan</Badge>}
                <Badge variant="outline">{formatDate(user.createdAt)}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.edit')}</CardTitle>
          <CardDescription>{t('nav.profile')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('auth.phone')}</Label>
              <Input id="phoneNumber" type="tel" {...register('phoneNumber')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="O'zingiz haqingizda yozing..." {...register('bio')} />
            </div>

            <Button type="submit" className="rounded-xl" disabled={!isDirty || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{user.guestTripCount}</p>
              <p className="text-xs text-muted-foreground">Mehmon sifatida</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.hostTripCount}</p>
              <p className="text-xs text-muted-foreground">Egasi sifatida</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.averageRatingAsGuest > 0 ? user.averageRatingAsGuest.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Mehmon reytingi</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.averageRatingAsHost > 0 ? user.averageRatingAsHost.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Egasi reytingi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
