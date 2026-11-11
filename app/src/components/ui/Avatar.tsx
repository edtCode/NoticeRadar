import { type ReactNode } from 'react';
import { cn } from '../../utils/helpers';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase() : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn('rounded-full object-cover bg-bg-elevated', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium bg-accent text-loud-ink select-none',
        sizeStyles[size],
        className
      )}
      aria-label={name || 'User avatar'}
    >
      {initials}
    </div>
  );
}

export interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string; alt?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = 'md', className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const sizeStyles = {
    xs: '-ml-1',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
  };

  return (
    <div className={cn('flex', className)} aria-label={`${avatars.length} people`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          alt={avatar.alt}
          name={avatar.name}
          size={size}
          className={cn(index > 0 && 'border-2 border-bg', sizeStyles[size])}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-border text-text-muted border-2 border-bg',
            sizeStyles[size]
          )}
          aria-label={`${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
