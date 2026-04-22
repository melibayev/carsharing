import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAdminUsers, useBanUser, useUnbanUser, useVerifyUser } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Ban, CheckCircle, ShieldCheck, User } from 'lucide-react';
import type { AdminUserDto } from '@/types';

function UserDetailDialog({ user, onClose }: { user: AdminUserDto; onClose: () => void }) {
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const verifyMutation = useVerifyUser();
  const { toast } = useToast();

  const handleBan = async () => {
    try { await banMutation.mutateAsync(user.id); toast({ title: 'User banned' }); onClose(); }
    catch { toast({ title: 'Failed to ban user', variant: 'destructive' }); }
  };
  const handleUnban = async () => {
    try { await unbanMutation.mutateAsync(user.id); toast({ title: 'User unbanned' }); onClose(); }
    catch { toast({ title: 'Failed to unban user', variant: 'destructive' }); }
  };
  const handleVerify = async () => {
    try { await verifyMutation.mutateAsync(user.id); toast({ title: 'User verified' }); onClose(); }
    catch { toast({ title: 'Failed to verify user', variant: 'destructive' }); }
  };

  const isPending = banMutation.isPending || unbanMutation.isPending || verifyMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium break-all">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phoneNumber ?? <span className="italic text-muted-foreground">вЂ”</span>}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trips</p>
              <p className="font-medium">{user.guestTripCount}G / {user.hostTripCount}H</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {user.isIdentityVerified
              ? <Badge variant="default">Verified</Badge>
              : <Badge variant="secondary">Unverified</Badge>}
            {user.isBanned && <Badge variant="destructive">Banned</Badge>}
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!user.isIdentityVerified && (
            <Button variant="outline" onClick={handleVerify} disabled={isPending}>
              <ShieldCheck className="h-4 w-4 mr-1" /> Verify Identity
            </Button>
          )}
          {user.isBanned ? (
            <Button variant="outline" onClick={handleUnban} disabled={isPending}>
              <CheckCircle className="h-4 w-4 mr-1" /> Unban
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleBan} disabled={isPending}>
              <Ban className="h-4 w-4 mr-1" /> Ban User
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUserDto | null>(null);
  const { data, isLoading } = useAdminUsers(page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">KYC / Status</th>
                  <th className="text-left p-3 font-medium">Trips</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(user)}
                  >
                    <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3 text-muted-foreground">
                      {user.phoneNumber ?? <span className="text-muted-foreground/50 text-xs italic">вЂ”</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {user.isIdentityVerified
                          ? <Badge variant="default" className="text-xs">Verified</Badge>
                          : <Badge variant="secondary" className="text-xs">Unverified</Badge>}
                        {user.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                      </div>
                    </td>
                    <td className="p-3">{user.guestTripCount}G / {user.hostTripCount}H</td>
                    <td className="p-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data && data.totalCount > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {Math.ceil(data.totalCount / data.pageSize)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.totalCount / data.pageSize)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {selected && <UserDetailDialog user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
