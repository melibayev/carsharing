import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminVerifications, useReviewKyc } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { KycStatus } from '@/types';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [KycStatus.Pending]: 'secondary',
  [KycStatus.InReview]: 'secondary',
  [KycStatus.Approved]: 'default',
  [KycStatus.Rejected]: 'destructive',
  [KycStatus.Expired]: 'outline',
};

export default function AdminVerifications() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminVerifications(page);
  const reviewMutation = useReviewKyc();
  const { toast } = useToast();

  const handleReview = async (id: string, approved: boolean) => {
    try {
      await reviewMutation.mutateAsync({
        id,
        approved,
        rejectionReason: approved ? undefined : 'Document not acceptable',
      });
      toast({ title: approved ? 'KYC approved' : 'KYC rejected' });
    } catch {
      toast({ title: 'Failed to review KYC', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">KYC Verifications</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">KYC Verifications</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Document</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Submitted</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((kyc) => (
                  <tr key={kyc.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{kyc.userName}</p>
                        <p className="text-xs text-muted-foreground">{kyc.userEmail}</p>
                      </div>
                    </td>
                    <td className="p-3">{kyc.documentType}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant[kyc.status] ?? 'outline'}>
                        {kyc.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(kyc.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        {(kyc.status === KycStatus.Pending || kyc.status === KycStatus.InReview) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(kyc.id, true)}
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReview(kyc.id, false)}
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
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
