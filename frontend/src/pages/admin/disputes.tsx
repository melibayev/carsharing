import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDisputes, useResolveDispute, useEscalateDispute } from '@/hooks/use-admin';
import { formatDate, formatUzs } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DisputeStatus } from '@/types';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [DisputeStatus.Open]: 'secondary',
  [DisputeStatus.InReview]: 'secondary',
  [DisputeStatus.Resolved]: 'default',
  [DisputeStatus.Escalated]: 'destructive',
  [DisputeStatus.Closed]: 'outline',
};

export default function AdminDisputes() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading } = useAdminDisputes(statusFilter, page);
  const resolveMutation = useResolveDispute();
  const escalateMutation = useEscalateDispute();
  const { toast } = useToast();

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync({ id, resolution: 'Resolved by admin' });
      toast({ title: 'Dispute resolved' });
    } catch {
      toast({ title: 'Failed to resolve dispute', variant: 'destructive' });
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      await escalateMutation.mutateAsync(id);
      toast({ title: 'Dispute escalated' });
    } catch {
      toast({ title: 'Failed to escalate dispute', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Disputes</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <div className="flex gap-1">
          {[undefined, 'Open', 'InReview', 'Escalated', 'Resolved'].map((s) => (
            <Button
              key={s ?? 'all'}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s ?? 'All'}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Booking</th>
                  <th className="text-left p-3 font-medium">Filed By</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((dispute) => (
                  <tr key={dispute.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{dispute.bookingTitle}</td>
                    <td className="p-3 text-muted-foreground">{dispute.filedByName}</td>
                    <td className="p-3">{dispute.category}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant[dispute.status] ?? 'outline'}>
                        {dispute.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(dispute.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        {(dispute.status === DisputeStatus.Open || dispute.status === DisputeStatus.InReview) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(dispute.id)}
                              disabled={resolveMutation.isPending}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleEscalate(dispute.id)}
                              disabled={escalateMutation.isPending}
                            >
                              Escalate
                            </Button>
                          </>
                        )}
                        {dispute.resolution && (
                          <span className="text-xs text-muted-foreground py-2">
                            {dispute.refundAmount ? `Refund: ${formatUzs(dispute.refundAmount)}` : 'No refund'}
                          </span>
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
