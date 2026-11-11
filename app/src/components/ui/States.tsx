import { type ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-bg-hover flex items-center justify-center text-text-muted mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-h3 font-semibold text-text mb-2">{title}</h3>
      {description && <p className="text-body text-text-muted max-w-sm mb-6">{description}</p>}
      {action && (
        <Button variant={action.variant || 'primary'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

export function ErrorState({ icon, title, message, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-danger-soft flex items-center justify-center text-danger mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-h3 font-semibold text-text mb-2">{title}</h3>
      {message && <p className="text-body text-text-muted max-w-sm mb-6">{message}</p>}
      {action && (
        <Button variant={action.variant || 'primary'} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface LoadingStateProps {
  variant?: 'spinner' | 'dots' | 'bars';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingState({ variant = 'spinner', size = 'md', text, className }: LoadingStateProps) {
  const sizeStyles = {
    spinner: { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' },
    dots: { sm: 'w-1.5 h-1.5', md: 'w-2.5 h-2.5', lg: 'w-3.5 h-3.5' },
    bars: { sm: 'w-1 h-1', md: 'w-1 h-2', lg: 'w-1 h-3' },
  };

  const gapStyles = { sm: 'gap-1', md: 'gap-2', lg: 'gap-3' };

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      {variant === 'spinner' && (
        <svg
          className={cn('animate-spin text-accent', sizeStyles.spinner[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {variant === 'dots' && (
        <div className={cn('flex items-center', gapStyles[size])} aria-hidden="true">
          <div className={cn('bg-accent rounded-full animate-pulse-soft', sizeStyles.dots[size])} style={{ animationDelay: '0ms' }} />
          <div className={cn('bg-accent rounded-full animate-pulse-soft', sizeStyles.dots[size])} style={{ animationDelay: '150ms' }} />
          <div className={cn('bg-accent rounded-full animate-pulse-soft', sizeStyles.dots[size])} style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {variant === 'bars' && (
        <div className={cn('flex items-end', gapStyles[size])} aria-hidden="true">
          <div className={cn('w-1 bg-accent rounded-t animate-pulse-soft', sizeStyles.bars[size])} style={{ animationDelay: '0ms', height: '0.5rem' }} />
          <div className={cn('w-1 bg-accent rounded-t animate-pulse-soft', sizeStyles.bars[size])} style={{ animationDelay: '150ms', height: '1rem' }} />
          <div className={cn('w-1 bg-accent rounded-t animate-pulse-soft', sizeStyles.bars[size])} style={{ animationDelay: '300ms', height: '1.5rem' }} />
          <div className={cn('w-1 bg-accent rounded-t animate-pulse-soft', sizeStyles.bars[size])} style={{ animationDelay: '450ms', height: '1rem' }} />
          <div className={cn('w-1 bg-accent rounded-t animate-pulse-soft', sizeStyles.bars[size])} style={{ animationDelay: '600ms', height: '0.5rem' }} />
        </div>
      )}

      {text && <p className="mt-3 text-body text-text-muted">{text}</p>}
    </div>
  );
}
