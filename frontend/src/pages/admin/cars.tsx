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
import { useAdminCars, useAdminCarDetail, useApproveCar, useRejectCar } from '@/hooks/use-admin';
import type { AdminCarDto } from '@/types';
import { formatUzs, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, ZoomIn, AlertTriangle } from 'lucide-react';
import { CarStatus } from '@/types';

const CAR_REJECT_PRESETS = [
  'Car information is incorrect',
  'Car price is too high',
  'Technical passport does not match',
  'Insurance document expired or invalid',
  'Car photos are unclear or insufficient',
  'VIN number mismatch',
];

const statusColor: Record<string, string> = {
  [CarStatus.Listed]: 'default',
  [CarStatus.PendingApproval]: 'secondary',
  [CarStatus.Draft]: 'outline',
  [CarStatus.Snoozed]: 'outline',
  [CarStatus.Removed]: 'destructive',
};

const STATUS_TABS: { label: string; value: string | undefined }[] = [
  { label: 'Pending Approval', value: CarStatus.PendingApproval },
  { label: 'Listed', value: CarStatus.Listed },
  { label: 'Snoozed', value: CarStatus.Snoozed },
  { label: 'Draft', value: CarStatus.Draft },
  { label: 'Removed', value: CarStatus.Removed },
  { label: 'All', value: undefined },
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

function CarDocsDialog({ car, onClose }: { car: AdminCarDto; onClose: () => void }) {
  const { data, isLoading } = useAdminCarDetail(car.id);
  const approveMutation = useApproveCar();
  const rejectMutation = useRejectCar();
  const { toast } = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    try { await approveMutation.mutateAsync(car.id); toast({ title: 'Car approved' }); onClose(); }
    catch { toast({ title: 'Failed to approve car', variant: 'destructive' }); }
  };
  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: car.id, reason: rejectReason });
      toast({ title: 'Car rejected' });
      onClose();
    } catch {
      toast({ title: 'Failed to reject car', variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? `${data.year} ${data.make} ${data.model}` : 'Car Documents'}
            {data?.vinMismatchFlagged && (
              <Badge variant="destructive" className="ml-2 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" /> VIN Mismatch
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : data ? (
          <div className="space-y-5">
            {/* Owner info */}
            <div className="grid grid-cols-2 gap-3 text-sm p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="font-medium">{data.ownerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{data.ownerEmail}</p>
              </div>
              {data.ownerPhone && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{data.ownerPhone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Ownership</p>
                <p className="font-medium">{data.ownershipRelation}</p>
              </div>
              {data.vin && (
                <div>
                  <p className="text-xs text-muted-foreground">VIN</p>
                  <p className="font-medium font-mono text-xs">{data.vin}</p>
                </div>
              )}
              {data.licensePlate && (
                <div>
                  <p className="text-xs text-muted-foreground">License Plate</p>
                  <p className="font-medium">{data.licensePlate}</p>
                </div>
              )}
            </div>

            {/* Technical Passport */}
            {(data.techPassportFrontUrl || data.techPassportBackUrl) && (
              <div>
                <p className="text-sm font-medium mb-2">Technical Passport</p>
                <div className="grid grid-cols-2 gap-3">
                  {data.techPassportFrontUrl && <DocImage url={data.techPassportFrontUrl} label="Front" />}
                  {data.techPassportBackUrl && <DocImage url={data.techPassportBackUrl} label="Back" />}
                </div>
              </div>
            )}

            {/* Insurance */}
            {data.insurancePolicyUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Insurance Policy</p>
                  {data.insuranceExpiry && (
                    <span className="text-xs text-muted-foreground">Expires: {formatDate(data.insuranceExpiry)}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DocImage url={data.insurancePolicyUrl} label="Insurance" />
                </div>
              </div>
            )}

            {/* Technical Inspection */}
            {data.technicalInspectionUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Technical Inspection</p>
                  {data.technicalInspectionExpiry && (
                    <span className="text-xs text-muted-foreground">Expires: {formatDate(data.technicalInspectionExpiry)}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DocImage url={data.technicalInspectionUrl} label="Inspection" />
                </div>
              </div>
            )}

            {/* Authorization + GPS */}
            {(data.authorizationLetterUrl || data.gpsTrackerPhotoUrl) && (
              <div>
                <p className="text-sm font-medium mb-2">Other Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {data.authorizationLetterUrl && <DocImage url={data.authorizationLetterUrl} label="Authorization Letter" />}
                  {data.gpsTrackerPhotoUrl && <DocImage url={data.gpsTrackerPhotoUrl} label="GPS Tracker" />}
                </div>
              </div>
            )}

            {/* Car Photos */}
            {data.photoUrls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Car Photos ({data.photoUrls.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {data.photoUrls.map((url, i) => (
                    <DocImage key={i} url={url} label={`Photo ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Failed to load car documents.</p>
        )}

        {car.status === CarStatus.PendingApproval && (
          <>
            {rejecting && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-destructive">Rejection reason *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CAR_REJECT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        rejectReason === preset
                          ? 'bg-destructive text-white border-destructive'
                          : 'border-muted-foreground/30 hover:border-destructive/60 hover:text-destructive'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Or type a custom reason…"
                  rows={3}
                  autoFocus
                />
              </div>
            )}
            <DialogFooter className="gap-2">
              {!rejecting ? (
                <>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setRejecting(true)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button
                    className="text-white bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setRejecting(false); setRejectReason(''); }}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending || !rejectReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Confirm Rejection
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCars() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedCar, setSelectedCar] = useState<AdminCarDto | null>(null);
  const { data, isLoading } = useAdminCars(statusFilter, page);

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cars</h1>

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
        <div className="text-center py-12 text-muted-foreground">No cars found.</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Vehicle</th>
                    <th className="text-left p-3 font-medium">Owner</th>
                    <th className="text-left p-3 font-medium">City</th>
                    <th className="text-left p-3 font-medium">Price/Day</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Rating</th>
                    <th className="text-left p-3 font-medium">Trips</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((car) => (
                    <tr key={car.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedCar(car)}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {car.coverPhotoUrl && (
                            <img
                              src={car.coverPhotoUrl}
                              alt={`${car.make} ${car.model}`}
                              className="h-10 w-14 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{car.make} {car.model} {car.year}</p>
                            {car.vinMismatchFlagged && (
                              <Badge variant="destructive" className="text-xs mt-0.5">
                                <AlertTriangle className="h-3 w-3 mr-0.5" /> VIN Mismatch
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{car.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{car.ownerEmail}</p>
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

      {selectedCar && <CarDocsDialog car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </div>
  );
}
