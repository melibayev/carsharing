import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useCallback } from 'react';
import { Upload, FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useOnboardingStep3, useDocumentUpload } from '@/hooks/use-onboarding';

const schema = z.object({
  driverLicenseNumber: z.string().min(1, 'License number is required'),
  driverLicenseExpiry: z.string().min(1, 'Expiry date is required'),
  driverLicensePhotoUrl: z.string().min(1, 'License photo is required'),
});

type FormValues = z.infer<typeof schema>;

export default function OnboardingStep3() {
  const { formData, updateForm, nextStep, prevStep } = useOnboardingStore();
  const step3Mutation = useOnboardingStep3();
  const uploadMutation = useDocumentUpload();
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [preview, setPreview] = useState<string | null>(formData.driverLicensePhotoUrl || null);

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      driverLicenseNumber: formData.driverLicenseNumber,
      driverLicenseExpiry: formData.driverLicenseExpiry,
      driverLicensePhotoUrl: formData.driverLicensePhotoUrl,
    },
  });

  const runOcr = useCallback(async (file: File) => {
    setIsOcrRunning(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const text = data.text;

      // Try to extract license number (common patterns)
      const licenseMatch = text.match(/[A-Z]{1,3}[\s-]?\d{5,9}/i);
      if (licenseMatch) {
        setValue('driverLicenseNumber', licenseMatch[0].trim(), { shouldValidate: true });
      }

      // Try to extract expiry date
      const dateMatch = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/);
      if (dateMatch) {
        const [, d, m, y] = dateMatch;
        setValue('driverLicenseExpiry', `${y}-${m}-${d}`, { shouldValidate: true });
      }
    } catch {
      // OCR failed silently - user can still fill manually
    } finally {
      setIsOcrRunning(false);
    }
  }, [setValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    try {
      const { url } = await uploadMutation.mutateAsync(file);
      setValue('driverLicensePhotoUrl', url, { shouldValidate: true });
    } catch {
      // Upload failed
    }

    // Run OCR in parallel
    runOcr(file);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await step3Mutation.mutateAsync({
        driverLicenseNumber: values.driverLicenseNumber,
        driverLicenseExpiry: values.driverLicenseExpiry,
        driverLicensePhotoUrl: values.driverLicensePhotoUrl,
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
        <CardTitle className="text-xl">Driver's license</CardTitle>
        <CardDescription>
          Upload your driver's license. We'll try to read the details automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Photo upload */}
          <div className="space-y-2">
            <Label>License photo</Label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                {preview ? (
                  <img
                    src={preview}
                    alt="License preview"
                    className="mx-auto max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload your driver's license
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, or WebP up to 10MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
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
            {errors.driverLicensePhotoUrl && (
              <p className="text-sm text-destructive">{errors.driverLicensePhotoUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverLicenseNumber">License number</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driverLicenseNumber"
                  placeholder="e.g. AB 1234567"
                  className="pl-10"
                  {...field('driverLicenseNumber')}
                />
              </div>
              {errors.driverLicenseNumber && (
                <p className="text-sm text-destructive">{errors.driverLicenseNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverLicenseExpiry">Expiry date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="driverLicenseExpiry"
                  type="date"
                  className="pl-10"
                  {...field('driverLicenseExpiry')}
                />
              </div>
              {errors.driverLicenseExpiry && (
                <p className="text-sm text-destructive">{errors.driverLicenseExpiry.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting || step3Mutation.isPending}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
