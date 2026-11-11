import { cn } from '../../utils/helpers';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines,
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  } as React.CSSProperties;

  if (variant === 'circular') {
    return (
      <div
        className={cn('rounded-full bg-border skeleton-shimmer', className)}
        style={{ ...baseStyle, width: baseStyle.width || '1rem', height: baseStyle.height || '1rem' }}
        {...props}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <div
        className={cn('rounded-sm bg-border skeleton-shimmer', className)}
        style={baseStyle}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3 p-3', className)} {...props}>
        <div className="h-4 bg-border rounded-sm skeleton-shimmer w-3/4" />
        <div className="h-4 bg-border rounded-sm skeleton-shimmer w-1/2" />
        <div className="h-4 bg-border rounded-sm skeleton-shimmer w-5/6" />
        <div className="h-4 bg-border rounded-sm skeleton-shimmer w-1/3" />
      </div>
    );
  }

  // Text variant - multiple lines
  if (lines && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-border rounded-sm skeleton-shimmer"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  // Single line text
  return (
    <div
      className={cn('h-4 bg-border rounded-sm skeleton-shimmer', className)}
      style={{ ...baseStyle, width: baseStyle.width || '100%' }}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse" role="table">
        <thead>
          <tr className="bg-bg text-text-muted text-body-sm font-medium uppercase tracking-wide">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 w-20 bg-border rounded-sm skeleton-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div className="h-4 w-24 bg-border rounded-sm skeleton-shimmer" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-border skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-border rounded-sm skeleton-shimmer" />
          <div className="h-3 w-24 bg-border rounded-sm skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-border rounded-sm skeleton-shimmer" />
        <div className="h-4 w-3/4 bg-border rounded-sm skeleton-shimmer" />
        <div className="h-4 w-1/2 bg-border rounded-sm skeleton-shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-border rounded-sm skeleton-shimmer" />
        <div className="h-8 w-24 bg-border rounded-sm skeleton-shimmer" />
      </div>
    </div>
  );
}

export function NoticeCardSkeleton() {
  return (
    <article className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-3 w-24 bg-border rounded-sm mb-2 skeleton-shimmer" />
          <div className="h-4 w-full bg-border rounded-sm skeleton-shimmer" />
          <div className="h-4 w-3/4 bg-border rounded-sm mt-1 skeleton-shimmer" />
        </div>
        <div className="w-20 h-6 bg-border rounded-full skeleton-shimmer flex-shrink-0" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-border rounded-sm skeleton-shimmer" />
        <div className="h-4 w-full bg-border rounded-sm skeleton-shimmer" />
        <div className="h-4 w-1/2 bg-border rounded-sm skeleton-shimmer" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-20 h-6 bg-border rounded-sm skeleton-shimmer" />
          <div className="w-24 h-6 bg-border rounded-sm skeleton-shimmer" />
        </div>
        <div className="w-24 h-8 bg-border rounded-sm skeleton-shimmer" />
      </div>
    </article>
  );
}

export function DashboardStatCardSkeleton() {
  return (
    <div className="p-5">
      <div className="h-4 w-24 bg-border rounded-sm mb-2 skeleton-shimmer" />
      <div className="h-10 w-16 bg-border rounded-sm skeleton-shimmer" />
      <div className="h-3 w-20 bg-border rounded-sm mt-3 skeleton-shimmer" />
    </div>
  );
}
