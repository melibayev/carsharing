import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminCars, useApproveCar, useRejectCar } from '@/hooks/use-admin';
import { formatUzs } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { CarStatus } from '@/types';

const statusColor: Record<string, string> = {
  [CarStatus.Listed]: 'default',
  [CarStatus.PendingApproval]: 'secondary',
  [CarStatus.Draft]: 'outline',
  [CarStatus.Snoozed]: 'outline',
  [CarStatus.Removed]: 'destructive',
};

export default function AdminCars() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminCars(page);
  const approveMutation = useApproveCar();
  const rejectMutation = useRejectCar();
  const { toast } = useToast();

  const handleApprove = async (carId: string) => {
    try {
      await approveMutation.mutateAsync(carId);
      toast({ title: 'Car approved' });
    } catch {
      toast({ title: 'Failed to approve car', variant: 'destructive' });
    }
  };

  const handleReject = async (carId: string) => {
    try {
      await rejectMutation.mutateAsync(carId);
      toast({ title: 'Car rejected' });
    } catch {
      toast({ title: 'Failed to reject car', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Cars</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cars</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Vehicle</th>
                  <th className="text-left p-3 font-medium">City</th>
                  <th className="text-left p-3 font-medium">Price/Day</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Rating</th>
                  <th className="text-left p-3 font-medium">Trips</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((car) => (
                  <tr key={car.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">
                      {car.make} {car.model} {car.year}
                    </td>
                    <td className="p-3 text-muted-foreground">{car.city}</td>
                    <td className="p-3">{formatUzs(car.dailyPriceUsd)}</td>
                    <td className="p-3">
                      <Badge variant={statusColor[car.status] as 'default' | 'secondary' | 'outline' | 'destructive'}>
                        {car.status}
                      </Badge>
                    </td>
                    <td className="p-3">{car.averageRating.toFixed(1)}</td>
                    <td className="p-3">{car.tripCount}</td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        {car.status === CarStatus.PendingApproval && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(car.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(car.id)}
                              disabled={rejectMutation.isPending}
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
