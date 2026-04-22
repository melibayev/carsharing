import { useRef, useState } from 'react';
import { FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSignAgreement } from '@/hooks/use-host';

const AGREEMENT_VERSION = '1.0';

const AGREEMENT_TEXT = `
HOST AGREEMENT – VERSION ${AGREEMENT_VERSION}

This Host Agreement ("Agreement") is entered into between CarSharing UZ ("Platform") and the user registering as a host ("Host").

1. ELIGIBILITY. Host must be at least 21 years old, have a verified identity, and maintain a payout method on file.

2. CAR REQUIREMENTS. All listed vehicles must have valid insurance, technical inspection, and registration documents. Hosts are responsible for keeping documentation current.

3. PLATFORM FEES. CarSharing UZ retains 15% of each booking total as a service fee. Host receives 85% of the booking total, paid within 3 business days of trip completion.

4. HOST RESPONSIBILITIES. Hosts must maintain their vehicles in safe, rentable condition. Hosts must respond to booking requests within 24 hours. Hosts must be available for key handoff or enable self check-in.

5. INSURANCE. Hosts are required to maintain valid comprehensive insurance on all listed vehicles. CarSharing UZ provides supplemental liability coverage during active trips.

6. CANCELLATIONS. Frequent host-initiated cancellations may result in listing suspension or account termination. Emergency cancellations must be reported within 2 hours.

7. REVIEWS & CONDUCT. Hosts must maintain an average rating of at least 3.5 stars. Violations of platform policies may result in listing removal or account suspension.

8. DATA & PRIVACY. Host agrees that CarSharing UZ may use listing data, pricing information, and anonymized trip data to improve services and provide market insights.

9. GOVERNING LAW. This Agreement is governed by the laws of the Republic of Uzbekistan.

10. AMENDMENTS. CarSharing UZ reserves the right to update this Agreement with 30 days' notice. Continued use of the platform constitutes acceptance of updated terms.

By signing this Agreement, Host acknowledges they have read, understood, and agree to all terms above.
`;

export default function HostAgreementStep({ onComplete }: { onComplete: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const signAgreement = useSignAgreement();

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) {
      setScrolledToBottom(true);
    }
  }

  async function handleSign() {
    await signAgreement.mutateAsync({ version: AGREEMENT_VERSION });
    onComplete();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Host Agreement</h2>
        <p className="text-muted-foreground mt-2">
          Please read the entire agreement before signing. Scroll to the bottom to enable signing.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-80 overflow-y-auto p-6 text-sm font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap"
        >
          {AGREEMENT_TEXT}
        </div>
      </Card>

      {!scrolledToBottom && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Scroll to the bottom of the agreement to continue.
        </div>
      )}

      {scrolledToBottom && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Host Agreement v{AGREEMENT_VERSION}</p>
                <p className="text-muted-foreground">
                  By clicking "Sign Agreement" below, you electronically sign this agreement and agree to all terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSign}
        disabled={!scrolledToBottom || signAgreement.isPending}
      >
        {signAgreement.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing…</>
        ) : signAgreement.isSuccess ? (
          <><CheckCircle2 className="mr-2 h-4 w-4" /> Signed!</>
        ) : (
          'Sign Agreement & Become a Host'
        )}
      </Button>
    </div>
  );
}
