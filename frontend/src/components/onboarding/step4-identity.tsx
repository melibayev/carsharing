import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Upload, Camera, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep4, useDocumentUpload } from '@/hooks/use-onboarding';

const schema = z.object({
  nationalIdNumber: z.string().min(1, 'ID number is required'),
  nationalIdFrontUrl: z.string().min(1, 'Front of ID is required'),
  nationalIdBackUrl: z.string().optional(),
  selfieUrl: z.string().min(1, 'Selfie is required'),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep4() {
  const { formData, updateForm, nextStep, prevStep } = useOnboardingStore();
  const step4Mutation = useOnboardingStep4();
  const uploadMutation = useDocumentUpload();
  const webcamRef = useRef<Webcam>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(formData.selfieUrl || null);
  const [frontPreview, setFrontPreview] = useState<string | null>(formData.nationalIdFrontUrl || null);
  const [backPreview, setBackPreview] = useState<string | null>(formData.nationalIdBackUrl || null);

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nationalIdNumber: formData.nationalIdNumber,
      nationalIdFrontUrl: formData.nationalIdFrontUrl,
      nationalIdBackUrl: formData.nationalIdBackUrl,
      selfieUrl: formData.selfieUrl,
    },
  });

  const handleFileUpload = async (
    file: File,
    fieldName: 'nationalIdFrontUrl' | 'nationalIdBackUrl',
    setPreview: (url: string | null) => void
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue(fieldName, url, { shouldValidate: true });
    } catch {
      // Upload failed
    }
  };

  const captureSelfie = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setSelfiePreview(imageSrc);
    setShowWebcam(false);

    // Convert base64 to file and upload
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue('selfieUrl', url, { shouldValidate: true });
    } catch {
      // Upload failed
    }
  }, [uploadMutation, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      await step4Mutation.mutateAsync({
        nationalIdNumber: values.nationalIdNumber,
        nationalIdFrontUrl: values.nationalIdFrontUrl,
        nationalIdBackUrl: values.nationalIdBackUrl,
        selfieUrl: values.selfieUrl,
      });
      updateForm(values);
      nextStep();
    } catch {
      // Error handled by react-query
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Identity verification</CardTitle>
        <CardDescription>
          Upload your national ID or passport, and take a selfie to verify your identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nationalIdNumber">ID / Passport number</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nationalIdNumber"
                placeholder="e.g. AA1234567"
                className="pl-10"
                {...field('nationalIdNumber')}
              />
            </div>
            {errors.nationalIdNumber && (
              <p className="text-sm text-destructive">{errors.nationalIdNumber.message}</p>
            )}
          </div>

          {/* Front of ID */}
          <div className="space-y-2">
            <Label>Front of ID</Label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                {frontPreview ? (
                  <img src={frontPreview} alt="ID front" className="mx-auto max-h-36 rounded-lg object-contain" />
                ) : (
                  <div className="space-y-1 py-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload front of ID</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'nationalIdFrontUrl', setFrontPreview);
                  }}
                />
              </div>
            </label>
            {errors.nationalIdFrontUrl && (
              <p className="text-sm text-destructive">{errors.nationalIdFrontUrl.message}</p>
            )}
          </div>

          {/* Back of ID (optional) */}
          <div className="space-y-2">
            <Label>Back of ID (optional)</Label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                {backPreview ? (
                  <img src={backPreview} alt="ID back" className="mx-auto max-h-36 rounded-lg object-contain" />
                ) : (
                  <div className="space-y-1 py-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload back of ID</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'nationalIdBackUrl', setBackPreview);
                  }}
                />
              </div>
            </label>
          </div>

          {/* Selfie */}
          <div className="space-y-2">
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
              <div className="relative">
                <img src={selfiePreview} alt="Selfie" className="mx-auto max-h-48 rounded-xl object-contain" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSelfiePreview(null);
                    setShowWebcam(true);
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => setShowWebcam(true)}>
                <Camera className="h-4 w-4 mr-2" /> Take a selfie
              </Button>
            )}
            {errors.selfieUrl && (
              <p className="text-sm text-destructive">{errors.selfieUrl.message}</p>
            )}
          </div>

          {uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </p>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting || step4Mutation.isPending}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
