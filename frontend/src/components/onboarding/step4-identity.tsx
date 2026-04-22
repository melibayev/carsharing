import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Upload, Camera, FileText, Loader2, X, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep4, useDocumentUpload } from '@/hooks/use-onboarding';
import { step4Schema, type Step4FormValues } from '@/features/onboarding/schemas';

export default function OnboardingStep4() {
  const { step4, setStepData, completeStep, nextStep } = useOnboardingStore();
  const step4Mutation = useOnboardingStep4();
  const uploadMutation = useDocumentUpload();
  const webcamRef = useRef<Webcam>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [apiError, setApiError] = useState('');

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step4FormValues>({
    resolver: zodResolver(step4Schema),
    mode: 'onChange',
    defaultValues: {
      skipped: step4?.skipped ?? false,
      documentType: step4?.documentType ?? '',
      documentNumber: '',
      documentFrontUrl: step4?.documentFrontUrl ?? '',
      documentBackUrl: step4?.documentBackUrl ?? '',
      selfieUrl: step4?.selfieUrl ?? '',
    },
  });

  const docType = watch('documentType');

  const handleSkip = async () => {
    setApiError('');
    try {
      await step4Mutation.mutateAsync({
        skipped: true,
      });
      setStepData('step4', { skipped: true });
      completeStep(5);
      nextStep();
    } catch {
      setApiError('Failed to skip step');
    }
  };

  const handleFileUpload = async (
    file: File,
    fieldName: 'documentFrontUrl' | 'documentBackUrl',
    setPreview: (url: string | null) => void,
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue(fieldName, url, { shouldValidate: true });
    } catch {
      // upload error
    }
  };

  const captureSelfie = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setSelfiePreview(imageSrc);
    setShowWebcam(false);

    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], 'identity-selfie.jpg', { type: 'image/jpeg' });

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue('selfieUrl', url, { shouldValidate: true });
    } catch {
      // upload error
    }
  }, [uploadMutation, setValue]);

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue('selfieUrl', url, { shouldValidate: true });
    } catch {
      // upload error
    }
  };

  const onSubmit = async (values: Step4FormValues) => {
    setApiError('');
    try {
      await step4Mutation.mutateAsync({
        skipped: false,
        documentType: values.documentType || undefined,
        documentNumber: values.documentNumber || undefined,
        documentFrontUrl: values.documentFrontUrl || undefined,
        documentBackUrl: values.documentBackUrl || undefined,
        selfieUrl: values.selfieUrl || undefined,
      });
      setStepData('step4', {
        skipped: false,
        documentType: values.documentType,
        documentFrontUrl: values.documentFrontUrl,
        documentBackUrl: values.documentBackUrl,
        selfieUrl: values.selfieUrl,
      });
      completeStep(5);
      nextStep();
    } catch {
      setApiError('Failed to save identity details');
    }
  };

  return (
    <form id="onboarding-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">Identity verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your passport or national ID to verify your identity
        </p>
      </div>

      {/* Skip option */}
      <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
        <SkipForward className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm">
            You can skip this step for now, but you will need to verify your
            identity before your first booking.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSkip}
            disabled={step4Mutation.isPending}
          >
            {step4Mutation.isPending ? 'Skipping...' : 'Skip for now'}
          </Button>
        </div>
      </div>

      {/* Document type */}
      <div className="space-y-1.5">
        <Label>Document type</Label>
        <div className="flex gap-4">
          {[
            { value: 'Passport', label: 'Passport' },
            { value: 'NationalId', label: 'National ID' },
          ].map((d) => (
            <label key={d.value} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                value={d.value}
                checked={docType === d.value}
                onChange={() => setValue('documentType', d.value, { shouldValidate: true })}
                className="accent-primary"
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      {docType && (
        <>
          {/* Document number */}
          <div className="space-y-1.5">
            <Label htmlFor="documentNumber">
              {docType === 'Passport' ? 'Passport' : 'ID'} number
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="documentNumber"
                placeholder={docType === 'Passport' ? 'e.g. AA1234567' : 'e.g. AB1234567'}
                className="pl-10 h-11"
                {...field('documentNumber')}
              />
            </div>
            {errors.documentNumber && (
              <p className="text-sm text-destructive">{errors.documentNumber.message}</p>
            )}
          </div>

          {/* Front of document */}
          <div className="space-y-1.5">
            <Label>Front of {docType === 'Passport' ? 'passport' : 'ID'}</Label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                {frontPreview ? (
                  <img
                    src={frontPreview}
                    alt="Document front"
                    className="mx-auto max-h-36 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-1 py-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload front of document</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'documentFrontUrl', setFrontPreview);
                  }}
                />
              </div>
            </label>
            {errors.documentFrontUrl && (
              <p className="text-sm text-destructive">{errors.documentFrontUrl.message}</p>
            )}
          </div>

          {/* Back of document */}
          <div className="space-y-1.5">
            <Label>Back of {docType === 'Passport' ? 'passport' : 'ID'} (optional)</Label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                {backPreview ? (
                  <img
                    src={backPreview}
                    alt="Document back"
                    className="mx-auto max-h-36 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-1 py-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload back of document</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'documentBackUrl', setBackPreview);
                  }}
                />
              </div>
            </label>
          </div>

          {/* Selfie */}
          <div className="space-y-1.5">
            <Label>Selfie</Label>
            {showWebcam ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user', width: 480, height: 360 }}
                    className="w-full rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={captureSelfie} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" /> Capture
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowWebcam(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : selfiePreview ? (
              <div className="space-y-2">
                <img
                  src={selfiePreview}
                  alt="Selfie"
                  className="mx-auto max-h-48 rounded-xl object-contain"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelfiePreview(null);
                    setShowWebcam(true);
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowWebcam(true)}
                >
                  <Camera className="h-4 w-4 mr-2" /> Take a selfie
                </Button>
                <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" /> Upload photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleSelfieUpload}
                  />
                </label>
              </div>
            )}
            {errors.selfieUrl && (
              <p className="text-sm text-destructive">{errors.selfieUrl.message}</p>
            )}
          </div>
        </>
      )}

      {uploadMutation.isPending && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
        </p>
      )}

      {apiError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {apiError}
        </p>
      )}

      {/* Hidden */}
      <input type="hidden" {...field('skipped')} />
    </form>
  );
}
