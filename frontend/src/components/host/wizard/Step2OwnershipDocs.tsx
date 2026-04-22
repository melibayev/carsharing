import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUploadDraftDocument, usePatchDraft } from '@/hooks/use-host';

interface DocUploadProps {
  label: string;
  docType: string;
  draftId: string;
  onUploaded?: (url: string) => void;
}

function DocUpload({ label, docType, draftId, onUploaded }: DocUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDraftDocument(draftId);
  const [fileName, setFileName] = useState('');

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', docType);
    const result = await upload.mutateAsync(formData);
    onUploaded?.(result.url);
  }

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div
        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        {fileName ? (
          <p className="text-sm text-foreground truncate max-w-xs">{fileName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Click to upload</p>
        )}
        {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <input ref={inputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleChange} />
    </div>
  );
}

export default function Step2OwnershipDocs({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const patch = usePatchDraft(draftId);

  async function handleContinue() {
    await patch.mutateAsync({ currentStep: 'OwnershipDocs' });
    onNext?.();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Ownership Documents</h2>
      <p className="text-sm text-muted-foreground">
        Upload clear photos or PDFs of the required documents.
      </p>

      <div className="space-y-4">
        <DocUpload label="Tech Passport (Front)" docType="TechPassportFront" draftId={draftId} />
        <DocUpload label="Tech Passport (Back)" docType="TechPassportBack" draftId={draftId} />
        <DocUpload label="Insurance Policy" docType="InsurancePolicy" draftId={draftId} />
        <DocUpload label="Technical Inspection" docType="TechnicalInspection" draftId={draftId} />
      </div>

      <div className="space-y-1">
        <Label>Ownership Relation</Label>
        <Input placeholder="e.g. Owner, Authorized Representative" />
      </div>

      <Button className="w-full" onClick={handleContinue} disabled={patch.isPending}>
        {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save & Continue
      </Button>
    </div>
  );
}
