import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/helpers';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'coral' | 'loud';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ variant = 'default', size = 'md', dot = false, children, className, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-bg-hover text-text-muted',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
    neutral: 'bg-bg text-text-muted',
    coral: 'bg-coral-soft text-coral-hover',
    loud: 'bg-loud text-ink',
  };
  const sizeStyles = { sm: 'px-1.5 py-0 text-[0.6875rem]', md: 'px-2.5 py-0.5 text-caption' };

  return (
    <span className={cn('pill', variantStyles[variant], sizeStyles[size], className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'success' && 'bg-success',
            variant === 'danger' && 'bg-danger',
            variant === 'warning' && 'bg-warning',
            variant === 'info' && 'bg-info',
            variant === 'coral' && 'bg-coral',
            variant === 'loud' && 'bg-ink',
            variant === 'default' && 'bg-text-muted',
            variant === 'neutral' && 'bg-border-strong',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: string;
  type?: 'notice' | 'extraction' | 'review' | 'eligibility';
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'notice', dot = true, size, className, ...props }: StatusBadgeProps) {
  const statusConfigs: Record<string, Record<string, { label: string; variant: BadgeProps['variant'] }>> = {
    notice: {
      DRAFT: { label: 'Draft', variant: 'info' },
      PUBLISHED: { label: 'Published', variant: 'loud' },
      ARCHIVED: { label: 'Archived', variant: 'neutral' },
    },
    extraction: {
      PENDING: { label: 'Pending', variant: 'info' },
      PROCESSING: { label: 'Processing', variant: 'coral' },
      COMPLETED: { label: 'Completed', variant: 'success' },
      FAILED: { label: 'Failed', variant: 'danger' },
      OCR_REQUIRED: { label: 'OCR Required', variant: 'warning' },
    },
    review: {
      NOT_REVIEWED: { label: 'Not Reviewed', variant: 'neutral' },
      PENDING_REVIEW: { label: 'Pending Review', variant: 'warning' },
      APPROVED: { label: 'Approved', variant: 'success' },
      REJECTED: { label: 'Rejected', variant: 'danger' },
    },
    eligibility: {
      ELIGIBLE: { label: 'Eligible', variant: 'success' },
      NOT_ELIGIBLE: { label: 'Not Eligible', variant: 'danger' },
      POSSIBLY_ELIGIBLE: { label: 'Possibly Eligible', variant: 'coral' },
    },
  };

  const config = statusConfigs[type]?.[status] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant} dot={dot} size={size} className={className} {...props}>{config.label}</Badge>;
}

export interface CategoryBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, dot = true, size = 'md', className, ...props }: CategoryBadgeProps) {
  const categoryConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PLACEMENT: { label: 'Placement', variant: 'info' },
    INTERNSHIP: { label: 'Internship', variant: 'coral' },
    SCHOLARSHIP: { label: 'Scholarship', variant: 'warning' },
    EXAM: { label: 'Exam', variant: 'danger' },
    EVENT: { label: 'Event', variant: 'success' },
    GENERAL: { label: 'General', variant: 'neutral' },
  };
  const config = categoryConfig[category] || { label: category, variant: 'default' as const };
  return <Badge variant={config.variant} dot={dot} size={size} className={className} {...props}>{config.label}</Badge>;
}
