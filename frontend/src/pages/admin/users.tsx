import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUsers, useBanUser, useUnbanUser, useVerifyUser } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Ban, CheckCircle, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const verifyMutation = useVerifyUser();
  const { toast } = useToast();

  const handleBan = async (userId: string) => {
    try {
      await banMutation.mutateAsync(userId);
      toast({ title: 'User banned' });
    } catch {
      toast({ title: 'Failed to ban user', variant: 'destructive' });
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unbanMutation.mutateAsync(userId);
      toast({ title: 'User unbanned' });
    } catch {
      toast({ title: 'Failed to unban user', variant: 'destructive' });
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      await verifyMutation.mutateAsync(userId);
      toast({ title: 'User verified' });
    } catch {
      toast({ title: 'Failed to verify user', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
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
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Trips</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {user.isIdentityVerified && (
                          <Badge variant="default" className="text-xs">Verified</Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        )}
                        {!user.isIdentityVerified && !user.isBanned && (
                          <Badge variant="secondary" className="text-xs">Unverified</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {user.guestTripCount}G / {user.hostTripCount}H
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        {!user.isIdentityVerified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(user.id)}
                            disabled={verifyMutation.isPending}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                            Verify
                          </Button>
                        )}
                        {user.isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnban(user.id)}
                            disabled={unbanMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBan(user.id)}
                            disabled={banMutation.isPending}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data && data.totalCount > data.pageSize && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground py-2">
            Page {page} of {Math.ceil(data.totalCount / data.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.totalCount / data.pageSize)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
