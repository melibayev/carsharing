import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Upload,
  FileText,
  Calendar,
  Loader2,
  Check,
  Camera,
  X,
  MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep3, useDocumentUpload } from '@/hooks/use-onboarding';
import { REGIONS } from '@/lib/regions';
import { step3Schema, type Step3FormValues } from '@/features/onboarding/schemas';

type Phase = 'front' | 'back' | 'selfie' | 'review';

export default function OnboardingStep3() {
  const { step3, setStepData, completeStep, nextStep } = useOnboardingStore();
  const step3Mutation = useOnboardingStep3();
  const uploadMutation = useDocumentUpload();
  const webcamRef = useRef<Webcam>(null);

  const [phase, setPhase] = useState<Phase>(() => {
    if (step3?.driverLicensePhotoUrl && step3?.driverLicenseBackUrl && step3?.driverLicenseSelfieUrl) return 'review';
    if (step3?.driverLicensePhotoUrl && step3?.driverLicenseBackUrl) return 'selfie';
    if (step3?.driverLicensePhotoUrl) return 'back';
    return 'front';
  });

  const [showWebcam, setShowWebcam] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [apiError, setApiError] = useState('');
  const [ocrResult, setOcrResult] = useState<{ licenseNumber?: string; expiry?: string }>({});
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    mode: 'onChange',
    defaultValues: {
      driverLicenseNumber: '',
      driverLicenseExpiry: step3?.driverLicenseExpiry ?? '',
      driverLicensePhotoUrl: step3?.driverLicensePhotoUrl ?? '',
      driverLicenseBackUrl: step3?.driverLicenseBackUrl ?? '',
      driverLicenseSelfieUrl: step3?.driverLicenseSelfieUrl ?? '',
      licenseIssuedCountry: step3?.licenseIssuedCountry ?? 'UZ',
      licenseIssuedRegionId: step3?.licenseIssuedRegionId ?? '',
    },
  });

  // When review phase loads, the inputs finally mount — apply any OCR results now
  useEffect(() => {
    if (phase !== 'review') return;
    if (ocrResult.licenseNumber) setValue('driverLicenseNumber', ocrResult.licenseNumber, { shouldValidate: true });
    if (ocrResult.expiry) setValue('driverLicenseExpiry', ocrResult.expiry, { shouldValidate: true });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const frontUrl = watch('driverLicensePhotoUrl');
  const backUrl = watch('driverLicenseBackUrl');
  const selfieUrl = watch('driverLicenseSelfieUrl');
  const issuedRegion = watch('licenseIssuedRegionId');

  const phases: { key: Phase; label: string; done: boolean }[] = [
    { key: 'front', label: 'Front photo', done: Boolean(frontUrl) },
    { key: 'back', label: 'Back photo', done: Boolean(backUrl) },
    { key: 'selfie', label: 'Selfie with license', done: Boolean(selfieUrl) },
    { key: 'review', label: 'Review and submit', done: false },
  ];

  const runOcr = useCallback(
    async (file: File) => {
      setIsOcrRunning(true);
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const { data } = await worker.recognize(file);
        await worker.terminate();

        const text = data.text;
        console.debug('[OCR raw]', text);

        // ── License number ────────────────────────────────────────────────
        // UZ format field 5: exactly 2 uppercase letters + 7 digits  e.g. "AG2483604"
        // Must exclude the bottom serial "DL000775184…"
        let licenseNumber: string | undefined;
        const licensePatterns = [
          /\b5[\s.:]*([A-Z]{2}\d{7})\b/i,          // field-5 context
          /\b([A-Z]{2}\d{7})\b/,                   // standalone 2-letter + 7-digit
          /\b([A-Z]{1,3}\d{5,9})\b/,               // generic fallback
        ];
        for (const pat of licensePatterns) {
          const m = text.match(pat);
          const candidate = m?.[1] ?? m?.[0];
          if (candidate && !/^DL/i.test(candidate)) {
            licenseNumber = candidate.trim();
            break;
          }
        }

        // ── Expiry date ───────────────────────────────────────────────────
        // Collect ALL DD.MM.YYYY or DD/MM/YYYY dates, pick the latest future one.
        // This handles "4a issue" vs "4b expiry" without needing to read Cyrillic labels.
        const dateRegex = /\b(\d{2})[./](\d{2})[./](\d{4})\b/g;
        const now = Date.now();
        let latestDate: Date | null = null;
        let latestFormatted: string | undefined;
        let dm: RegExpExecArray | null;
        while ((dm = dateRegex.exec(text)) !== null) {
          const [, dd, mo, yyyy] = dm;
          const dt = new Date(Number(yyyy), Number(mo) - 1, Number(dd));
          if (!isNaN(dt.getTime()) && dt.getTime() > now) {
            if (!latestDate || dt > latestDate) {
              latestDate = dt;
              latestFormatted = `${yyyy}-${mo.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
          }
        }

        // Store results — applied to form inputs in useEffect when review phase mounts
        setOcrResult({ licenseNumber, expiry: latestFormatted });
        console.debug('[OCR result]', { licenseNumber, expiry: latestFormatted });
      } catch (err) {
        console.warn('[OCR] failed:', err);
        // OCR failed silently — user fills in manually
      } finally {
        setIsOcrRunning(false);
      }
    },
    [setValue],
  );

  const handleUpload = async (
    file: File,
    fieldName: 'driverLicensePhotoUrl' | 'driverLicenseBackUrl' | 'driverLicenseSelfieUrl',
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

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file, 'driverLicensePhotoUrl', setFrontPreview);
    runOcr(file);
    setPhase('back');
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file, 'driverLicenseBackUrl', setBackPreview);
    setPhase('selfie');
  };

  const captureSelfie = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setSelfiePreview(imageSrc);
    setShowWebcam(false);

    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], 'license-selfie.jpg', { type: 'image/jpeg' });

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue('driverLicenseSelfieUrl', url, { shouldValidate: true });
      setPhase('review');
    } catch {
      // upload error
    }
  }, [uploadMutation, setValue]);

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file, 'driverLicenseSelfieUrl', setSelfiePreview);
    setPhase('review');
  };

  const onSubmit = async (values: Step3FormValues) => {
    setApiError('');
    try {
      await step3Mutation.mutateAsync({
        driverLicenseNumber: values.driverLicenseNumber,
        driverLicenseExpiry: values.driverLicenseExpiry,
        driverLicensePhotoUrl: values.driverLicensePhotoUrl,
        driverLicenseBackUrl: values.driverLicenseBackUrl,
        driverLicenseSelfieUrl: values.driverLicenseSelfieUrl,
        licenseIssuedCountry: values.licenseIssuedCountry || undefined,
        licenseIssuedRegionId: values.licenseIssuedRegionId || undefined,
      });
      setStepData('step3', {
        driverLicensePhotoUrl: values.driverLicensePhotoUrl,
        driverLicenseBackUrl: values.driverLicenseBackUrl,
        driverLicenseSelfieUrl: values.driverLicenseSelfieUrl,
        licenseIssuedCountry: values.licenseIssuedCountry,
        licenseIssuedRegionId: values.licenseIssuedRegionId,
        driverLicenseExpiry: values.driverLicenseExpiry,
      });
      completeStep(4);
      nextStep();
    } catch {
      setApiError('Failed to save license details');
    }
  };

  return (
    <form id="onboarding-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-medium">Driver's license</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your license photos and verify the details
        </p>
      </div>

      {/* Phase checklist */}
      <div className="space-y-2">
        {phases.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              if (p.key === 'review' && !(frontUrl && backUrl && selfieUrl)) return;
              setPhase(p.key);
            }}
            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
              ${phase === p.key ? 'bg-accent/10 font-medium' : 'hover:bg-muted'}
            `}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0
                ${p.done ? 'bg-foreground text-background' : phase === p.key ? 'border-2 border-accent' : 'border border-muted-foreground/30'}
              `}
            >
              {p.done ? <Check className="h-3.5 w-3.5" /> : null}
            </div>
            <span className={p.done ? 'text-muted-foreground' : ''}>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Phase: Front */}
      {phase === 'front' && (
        <div className="space-y-3">
          <Label>Front of license</Label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {frontPreview ? (
                <img src={frontPreview} alt="License front" className="mx-auto max-h-48 rounded-lg object-contain" />
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload front of license</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFrontUpload}
              />
            </div>
          </label>
          {uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </p>
          )}
          {isOcrRunning && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading license details...
            </p>
          )}
        </div>
      )}

      {/* Phase: Back */}
      {phase === 'back' && (
        <div className="space-y-3">
          <Label>Back of license</Label>
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              {backPreview ? (
                <img src={backPreview} alt="License back" className="mx-auto max-h-48 rounded-lg object-contain" />
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload back of license</p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleBackUpload}
              />
            </div>
          </label>
          {uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </p>
          )}
        </div>
      )}

      {/* Phase: Selfie */}
      {phase === 'selfie' && (
        <div className="space-y-3">
          <Label>Selfie with license</Label>
          <p className="text-sm text-muted-foreground">
            Hold your license next to your face and take a photo
          </p>
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
                {/* Overlay guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-white/50 rounded-lg" />
                </div>
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
              <img src={selfiePreview} alt="Selfie" className="mx-auto max-h-48 rounded-xl object-contain" />
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
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowWebcam(true)}>
                <Camera className="h-4 w-4 mr-2" /> Open camera
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
          {uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </p>
          )}
        </div>
      )}

      {/* Phase: Review */}
      {phase === 'review' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify the details below and fill in any missing information
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="driverLicenseNumber">License number</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driverLicenseNumber"
                  placeholder="e.g. AB 1234567"
                  className="pl-10 h-11"
                  {...field('driverLicenseNumber')}
                />
              </div>
              {errors.driverLicenseNumber && (
                <p className="text-sm text-destructive">{errors.driverLicenseNumber.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driverLicenseExpiry">Expiry date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driverLicenseExpiry"
                  type="date"
                  className="pl-10 h-11"
                  {...field('driverLicenseExpiry')}
                />
              </div>
              {errors.driverLicenseExpiry && (
                <p className="text-sm text-destructive">{errors.driverLicenseExpiry.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issued country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-11"
                  value="Uzbekistan"
                  disabled
                  {...field('licenseIssuedCountry')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Issued region</Label>
              <Select
                value={issuedRegion}
                onValueChange={(v) => setValue('licenseIssuedRegionId', v, { shouldValidate: true })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photo thumbnails */}
          <div className="grid grid-cols-3 gap-3">
            {frontPreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Front</p>
                <img src={frontPreview} alt="Front" className="rounded-lg object-cover aspect-[3/2]" />
              </div>
            )}
            {backPreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Back</p>
                <img src={backPreview} alt="Back" className="rounded-lg object-cover aspect-[3/2]" />
              </div>
            )}
            {selfiePreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Selfie</p>
                <img src={selfiePreview} alt="Selfie" className="rounded-lg object-cover aspect-[3/2]" />
              </div>
            )}
          </div>
        </div>
      )}

      {apiError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {apiError}
        </p>
      )}

      {/* Hidden inputs for form validation */}
      <input type="hidden" {...field('driverLicensePhotoUrl')} />
      <input type="hidden" {...field('driverLicenseBackUrl')} />
      <input type="hidden" {...field('driverLicenseSelfieUrl')} />
    </form>
  );
}
