import { getAvatarColor } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 32 | 40 | 48 | 56;
  className?: string;
}

const SIZE_CLASS: Record<number, string> = {
  32: 'w-8 h-8 text-xs',
  40: 'w-10 h-10 text-sm',
  48: 'w-12 h-12 text-sm',
  56: 'w-14 h-14 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, photoUrl, size = 40, className = '' }: UserAvatarProps) {
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS[40]!;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-1 ring-border shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ring-1 ring-border flex items-center justify-center font-semibold shrink-0 ${getAvatarColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
