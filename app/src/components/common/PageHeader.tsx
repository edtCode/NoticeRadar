import { type ReactNode } from 'react';
import { cn } from '../../utils/helpers';
import { Button } from '../ui';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-8', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-muted" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 &&                <span className="text-text-muted/50" aria-hidden="true">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-text transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-text font-medium" aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold text-text text-balance">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-body text-text-muted text-pretty">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4', className)}>
      <div>
        <h2 className="text-h3 font-semibold text-text">{title}</h2>
        {description && <p className="text-body-sm text-text-muted mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}