import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminVerifications, useReviewKyc } from '@/hooks/use-admin';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, ZoomIn } from 'lucide-react';
import { KycStatus, type KycVerificationDto } from '@/types';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [KycStatus.Pending]: 'secondary',
  [KycStatus.InReview]: 'secondary',
  [KycStatus.Approved]: 'default',
  [KycStatus.Rejected]: 'destructive',
  [KycStatus.Expired]: 'outline',
};

const STATUS_TABS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'In Review', value: 'InReview' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'All', value: undefined as string | undefined },
];

function DocImage({ url, label }: { url: string; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <button
        className="group relative w-full aspect-[3/2] overflow-hidden rounded-lg border bg-muted hover:opacity-90 transition"
        onClick={() => setLightbox(true)}
        title={`View ${label}`}
      >
        <img src={url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition">
          <ZoomIn className="h-6 w-6 text-white" />
        </div>
        <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
          {label}
        </span>
      </button>

      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-3xl p-2">
          <img src={url} alt={label} className="w-full rounded-lg object-contain max-h-[80vh]" />
          <p className="text-center text-sm text-muted-foreground pt-1">{label}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewDialog({
  kyc,
  onClose,
}: {
  kyc: KycVerificationDto;
  onClose: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const reviewMutation = useReviewKyc();
  const { toast } = useToast();

  const canAct = kyc.status === KycStatus.Pending || kyc.status === KycStatus.InReview;

  const handleApprove = async () => {
    try {
      await reviewMutation.mutateAsync({ id: kyc.id, approved: true, notes: notes || undefined });
      toast({ title: 'KYC approved' });
      onClose();
    } catch {
      toast({ title: 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await reviewMutation.mutateAsync({ id: kyc.id, approved: false, rejectionReason, notes: notes || undefined });
      toast({ title: 'KYC rejected' });
      onClose();
    } catch {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            KYC Review
            <Badge variant={statusVariant[kyc.status] ?? 'outline'}>{kyc.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Name</p>
              <p className="font-medium">{kyc.userName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium">{kyc.userEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Document Type</p>
              <p className="font-medium">{kyc.documentType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="font-medium">{formatDate(kyc.createdAt)}</p>
            </div>
            {kyc.documentNumber && (
              <div>
                <p className="text-muted-foreground text-xs">Document Number</p>
                <p className="font-medium">{kyc.documentNumber}</p>
              </div>
            )}
            {kyc.documentExpiry && (
              <div>
                <p className="text-muted-foreground text-xs">Expiry</p>
                <p className="font-medium">{formatDate(kyc.documentExpiry)}</p>
              </div>
            )}
          </div>

          {/* Document Images */}
          <div>
            <p className="text-sm font-medium mb-2">Documents</p>
            <div className="grid grid-cols-2 gap-3">
              {kyc.documentFrontUrl && (
                <DocImage url={kyc.documentFrontUrl} label="Front" />
              )}
              {kyc.documentBackUrl && (
                <DocImage url={kyc.documentBackUrl} label="Back" />
              )}
              {kyc.selfieUrl && (
                <DocImage url={kyc.selfieUrl} label="Selfie" />
              )}
            </div>
          </div>

          {/* Previous rejection reason */}
          {kyc.rejectionReason && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
              <p className="font-medium text-xs uppercase tracking-wide mb-0.5">Previous rejection reason</p>
              {kyc.rejectionReason}
            </div>
          )}

          {/* Notes textarea (always shown for admin) */}
          {canAct && (
            <div className="space-y-1">
              <Label className="text-xs">Internal notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for audit trail…"
                rows={2}
              />
            </div>
          )}

          {/* Rejection reason input */}
          {rejecting && (
            <div className="space-y-1">
              <Label className="text-xs text-destructive">Rejection reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this document is rejected…"
                rows={3}
                autoFocus
              />
            </div>
          )}
        </div>

        {canAct && (
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {!rejecting ? (
              <>
                <Button variant="destructive" onClick={() => setRejecting(true)} disabled={reviewMutation.isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button onClick={handleApprove} disabled={reviewMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={reviewMutation.isPending || !rejectionReason.trim()}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Confirm Rejection
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminVerifications() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>('Pending');
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<KycVerificationDto | null>(null);
  const { data, isLoading } = useAdminVerifications(statusFilter, page);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">KYC Verifications</h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.label}
            size="sm"
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No verifications found.</div>
      ) : (
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
                    <th className="text-left p-3 font-medium">Doc Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((kyc) => (
                    <tr key={kyc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setReviewing(kyc)}>
                      <td className="p-3">
                        <p className="font-medium">{kyc.userName}</p>
                        <p className="text-xs text-muted-foreground">{kyc.userEmail}</p>
                      </td>
                      <td className="p-3">{kyc.documentType}</td>
                      <td className="p-3">
                        <Badge variant={statusVariant[kyc.status] ?? 'outline'}>{kyc.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(kyc.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {kyc.documentFrontUrl && (
                            <img
                              src={kyc.documentFrontUrl}
                              alt="Front"
                              className="h-10 w-14 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() => setReviewing(kyc)}
                            />
                          )}
                          {kyc.documentBackUrl && (
                            <img
                              src={kyc.documentBackUrl}
                              alt="Back"
                              className="h-10 w-14 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() => setReviewing(kyc)}
                            />
                          )}
                          {kyc.selfieUrl && (
                            <img
                              src={kyc.selfieUrl}
                              alt="Selfie"
                              className="h-10 w-10 object-cover rounded-full border cursor-pointer hover:opacity-80"
                              onClick={() => setReviewing(kyc)}
                            />
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
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {reviewing && <ReviewDialog kyc={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}
