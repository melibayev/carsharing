import { Input } from '@/components/ui/input';
import { useRef, type ChangeEvent } from 'react';

interface PhoneInputUzProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // strip leading 998 if user types full number
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  const d = local.slice(0, 9);

  let formatted = '+998';
  if (d.length > 0) formatted += ' ' + d.slice(0, 2);
  if (d.length > 2) formatted += ' ' + d.slice(2, 5);
  if (d.length > 5) formatted += ' ' + d.slice(5, 7);
  if (d.length > 7) formatted += ' ' + d.slice(7, 9);
  return formatted;
}

export function PhoneInputUz({ value, onChange, className }: PhoneInputUzProps) {
  const ref = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const masked = maskPhone(e.target.value);
    onChange(masked);
  }

  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      placeholder="+998 XX XXX XX XX"
      value={value}
      onChange={handleChange}
      className={className}
      maxLength={17}
    />
  );
}
