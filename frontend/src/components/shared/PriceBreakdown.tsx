import { formatUzs } from '@/lib/utils';

interface PriceBreakdownProps {
  dailyRate: number;
  days: number;
  cleaningFee?: number;
  serviceFee?: number;
}

export function PriceBreakdown({ dailyRate, days, cleaningFee = 0, serviceFee = 0 }: PriceBreakdownProps) {
  const subtotal = dailyRate * days;
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {formatUzs(dailyRate)} x {days} {days === 1 ? 'day' : 'days'}
        </span>
        <span className="font-mono">{formatUzs(subtotal)}</span>
      </div>
      {cleaningFee > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cleaning fee</span>
          <span className="font-mono">{formatUzs(cleaningFee)}</span>
        </div>
      )}
      {serviceFee > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service fee</span>
          <span className="font-mono">{formatUzs(serviceFee)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-3 font-semibold">
        <span>Total</span>
        <span className="font-mono text-base">{formatUzs(total)}</span>
      </div>
    </div>
  );
}
