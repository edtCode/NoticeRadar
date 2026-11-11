import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  cta: 'btn-primary btn-cta',
};

const sizeClasses = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn('whitespace-nowrap', variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="border-transparent" />
          {loadingText ?? 'Working…'}
        </>
      ) : (
        children
      )}
    </button>
  );
});
