import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Backend stores prices in USD internally. 1 USD = 12,800 UZS (fixed rate). */
export const USD_TO_UZS = 12800;

/** Convert a USD amount (as stored in the DB) to UZS for display. */
export function usdToUzs(usd: number): number {
  return Math.round(usd * USD_TO_UZS);
}

/** Format a UZS amount: "1,000,000 UZS" */
export function formatUzs(amount: number): string {
  return (
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' UZS'
  );
}

/** Format a USD DB value as UZS display string. Use this for all *Usd fields from the API. */
export function formatUsd(usd: number): string {
  return formatUzs(usdToUzs(usd));
}

export function formatCurrency(amount: number): string {
  return formatUzs(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const startStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(s);
  const endStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(e);
  return `${startStr} – ${endStr}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`;
}

export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

const AVATAR_PALETTE = [
  'bg-red-500 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
  'bg-lime-600 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-600 text-white',
  'bg-blue-500 text-white',
  'bg-violet-500 text-white',
  'bg-pink-500 text-white',
  'bg-rose-500 text-white',
];

export function getAvatarColor(name: string): string {
  if (!name) return 'bg-muted text-muted-foreground';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

/** Format phone for display: +998 90 123 45 67 */
export function formatPhoneUz(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone;
}
