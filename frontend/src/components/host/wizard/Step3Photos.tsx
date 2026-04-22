import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUploadDraftDocument, usePatchDraft } from '@/hooks/use-host';

interface PreviewFile {
  id: string;
  objectUrl: string;
  name: string;
}

const REQUIRED_SLOTS = [
  { key: 'front', label: 'Front', hint: 'Head-on front view' },
  { key: 'back', label: 'Back', hint: 'Rear view' },
  { key: 'interior', label: 'Interior', hint: 'Dashboard / seats' },
];

export default function Step3Photos({ draftId, onNext }: { draftId: string; onNext?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<string | null>(null);
  const [slotPhotos, setSlotPhotos] = useState<Record<string, PreviewFile>>({});
  const [extras, setExtras] = useState<PreviewFile[]>([]);
  const upload = useUploadDraftDocument(draftId);
  const patch = usePatchDraft(draftId);

  async function uploadFile(file: File): Promise<PreviewFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'Photo');
    const result = await upload.mutateAsync(formData);
    return { id: result.documentId, objectUrl: URL.createObjectURL(file), name: file.name };
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const slot = activeSlotRef.current;
    if (slot) {
      const first = files[0];
      if (!first) return;
      const preview = await uploadFile(first);
      setSlotPhotos((prev) => ({ ...prev, [slot]: preview }));
    } else {
      for (const file of Array.from(files)) {
        const preview = await uploadFile(file);
        setExtras((prev) => [...prev, preview]);
      }
    }
    e.target.value = '';
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    activeSlotRef.current = null;
    for (const file of Array.from(e.dataTransfer.files)) {
      if (!file.type.startsWith('image/')) continue;
      const preview = await uploadFile(file);
      setExtras((prev) => [...prev, preview]);
    }
  }

  function openSlotPicker(slot: string) {
    activeSlotRef.current = slot;
    inputRef.current!.removeAttribute('multiple');
    inputRef.current?.click();
  }

  function openExtraPicker() {
    activeSlotRef.current = null;
    inputRef.current!.setAttribute('multiple', 'true');
    inputRef.current?.click();
  }

  async function handleContinue() {
    await patch.mutateAsync({ currentStep: 'Photos' });
    onNext?.();
  }

  const filledSlots = REQUIRED_SLOTS.filter((s) => slotPhotos[s.key]).length;
  const canContinue = filledSlots >= REQUIRED_SLOTS.length && !upload.isPending;
  const totalCount = filledSlots + extras.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Car Photos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Clear, well-lit photos dramatically increase bookings. The 3 required shots are mandatory.
        </p>
      </div>

      {/* Required slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Required shots</p>
          <Badge variant={filledSlots === REQUIRED_SLOTS.length ? 'default' : 'secondary'} className="gap-1">
            {filledSlots === REQUIRED_SLOTS.length
              ? <><CheckCircle2 className="h-3 w-3" /> Complete</>
              : `${filledSlots} / ${REQUIRED_SLOTS.length}`}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {REQUIRED_SLOTS.map((slot) => {
            const photo = slotPhotos[slot.key];
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => openSlotPicker(slot.key)}
                disabled={upload.isPending}
                className={cn(
                  'relative aspect-[4/3] rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-all w-full',
                  photo
                    ? 'border-primary/40 hover:border-primary'
                    : 'border-dashed border-muted-foreground/30 hover:border-primary/60 bg-muted/30',
                )}
              >
                {photo ? (
                  <>
                    <img src={photo.objectUrl} alt={slot.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">Replace</span>
                    </div>
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[10px] px-1.5 py-0 h-5 bg-black/60 hover:bg-black/60 border-0">
                        {slot.label}
                      </Badge>
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" />
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-foreground/70">{slot.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center px-1">{slot.hint}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra photos */}
      <div>
        <p className="text-sm font-medium mb-3">
          Extra photos{' '}
          <span className="text-muted-foreground font-normal">(optional — more is better)</span>
        </p>

        <div
          className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/60 transition-colors bg-muted/20"
          onClick={openExtraPicker}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click or drag photos here</p>
          {upload.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        {extras.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {extras.map((p, i) => (
              <div key={p.id} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted group">
                <img src={p.objectUrl} alt={p.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setExtras((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Summary + continue */}
      <div className="pt-2 border-t space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} photo{totalCount !== 1 ? 's' : ''} total</span>
          {filledSlots < REQUIRED_SLOTS.length && (
            <span className="text-destructive text-xs">
              {REQUIRED_SLOTS.length - filledSlots} required photo{REQUIRED_SLOTS.length - filledSlots > 1 ? 's' : ''} missing
            </span>
          )}
        </div>
        <Button
          className="w-full"
          onClick={handleContinue}
          disabled={!canContinue || patch.isPending}
        >
          {patch.isPending || upload.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
