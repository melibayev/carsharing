import { useTranslation } from 'react-i18next';
import { formatUzs } from '@/lib/utils';

interface PriceBreakdownProps {
  dailyRate: number;
  days: number;
  cleaningFee?: number;
  serviceFee?: number;
}

export function PriceBreakdown({ dailyRate, days, cleaningFee = 0, serviceFee = 0 }: PriceBreakdownProps) {
  const { t } = useTranslation();
  const subtotal = dailyRate * days;
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {formatUzs(dailyRate, false)} × {days} {t('booking.noDays', { count: days })}
        </span>
        <span className="font-mono">{formatUzs(subtotal)}</span>
      </div>
      {cleaningFee > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('car.cleaningFee')}</span>
          <span className="font-mono">{formatUzs(cleaningFee)}</span>
        </div>
      )}
      {serviceFee > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('car.serviceFee')}</span>
          <span className="font-mono">{formatUzs(serviceFee)}</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-3 font-semibold">
        <span>{t('car.totalPrice')}</span>
        <span className="font-mono text-base">{formatUzs(total)}</span>
      </div>
    </div>
  );
}
