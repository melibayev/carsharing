import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKycStatus, useSubmitKyc } from '@/hooks/use-kyc';
import { useToast } from '@/hooks/use-toast';
import { KycStatus, KycDocumentType } from '@/types';
import { CheckCircle, Clock, XCircle, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const steps = ['Document Type', 'Upload Documents', 'Review & Submit'];

export default function KycWizard() {
  const { data: kycStatus, isLoading, error } = useKycStatus();
  const submitMutation = useSubmitKyc();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [documentType, setDocumentType] = useState<KycDocumentType>(KycDocumentType.Passport);
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentExpiry, setDocumentExpiry] = useState('');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-8">
        <Skeleton className="h-64" />
      </div>
    );
  }

  // If already submitted and not rejected, show status
  if (kycStatus && !error && kycStatus.status !== KycStatus.Rejected) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Identity Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {kycStatus.status === KycStatus.Approved && (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-lg">Verified</p>
                    <p className="text-sm text-muted-foreground">
                      Your identity has been verified successfully.
                    </p>
                  </div>
                </>
              )}
              {(kycStatus.status === KycStatus.Pending || kycStatus.status === KycStatus.InReview) && (
                <>
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-lg">Under Review</p>
                    <p className="text-sm text-muted-foreground">
                      Your documents are being reviewed. This usually takes 1-2 business days.
                    </p>
                  </div>
                </>
              )}
              {kycStatus.status === KycStatus.Expired && (
                <>
                  <XCircle className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-semibold text-lg">Expired</p>
                    <p className="text-sm text-muted-foreground">
                      Your verification has expired. Please submit new documents.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{kycStatus.documentType}</Badge>
              <Badge variant={kycStatus.status === KycStatus.Approved ? 'default' : 'secondary'}>
                {kycStatus.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!frontFile) {
      toast({ title: 'Please upload the front of your document', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentFront', frontFile);
    if (backFile) formData.append('documentBack', backFile);
    if (selfieFile) formData.append('selfie', selfieFile);
    if (documentNumber) formData.append('documentNumber', documentNumber);
    if (documentExpiry) formData.append('documentExpiry', documentExpiry);

    try {
      await submitMutation.mutateAsync(formData);
      toast({ title: 'Documents submitted successfully' });
    } catch {
      toast({ title: 'Failed to submit documents', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <h1 className="text-2xl font-bold">Identity Verification</h1>

      {/* Rejected banner */}
      {kycStatus?.status === KycStatus.Rejected && (
        <Card className="border-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <p className="font-medium">Previous submission rejected</p>
              {kycStatus.rejectionReason && (
                <p className="text-sm text-muted-foreground">{kycStatus.rejectionReason}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i <= step ? 'font-medium' : 'text-muted-foreground'}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Step 0: Document Type */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v as KycDocumentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KycDocumentType.Passport}>Passport</SelectItem>
                    <SelectItem value={KycDocumentType.DriverLicense}>Driver License</SelectItem>
                    <SelectItem value={KycDocumentType.NationalId}>National ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Document Number (optional)</Label>
                <Input
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. AB1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="date"
                  value={documentExpiry}
                  onChange={(e) => setDocumentExpiry(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Front *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                    className="max-w-xs mx-auto"
                  />
                  {frontFile && (
                    <p className="text-sm text-green-600 mt-2">{frontFile.name}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Document Back (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                    className="max-w-xs mx-auto"
                  />
                  {backFile && (
                    <p className="text-sm text-green-600 mt-1">{backFile.name}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Selfie with Document (optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                    className="max-w-xs mx-auto"
                  />
                  {selfieFile && (
                    <p className="text-sm text-green-600 mt-1">{selfieFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review your submission</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Document Type</div>
                <div className="font-medium">{documentType}</div>
                {documentNumber && (
                  <>
                    <div className="text-muted-foreground">Document Number</div>
                    <div className="font-medium">{documentNumber}</div>
                  </>
                )}
                {documentExpiry && (
                  <>
                    <div className="text-muted-foreground">Expiry Date</div>
                    <div className="font-medium">{documentExpiry}</div>
                  </>
                )}
                <div className="text-muted-foreground">Front Image</div>
                <div className="font-medium">{frontFile?.name ?? 'Not uploaded'}</div>
                <div className="text-muted-foreground">Back Image</div>
                <div className="font-medium">{backFile?.name ?? 'Not provided'}</div>
                <div className="text-muted-foreground">Selfie</div>
                <div className="font-medium">{selfieFile?.name ?? 'Not provided'}</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Verification'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
