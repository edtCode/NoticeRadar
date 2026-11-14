import { type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/helpers';
import { ChevronDown } from 'lucide-react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  dense?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  emptyAction,
  onRowClick,
  striped = false,
  hoverable = true,
  dense = false,
  sortBy,
  sortOrder,
  onSort,
  className,
}: TableProps<T>) {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Wide tables keep a readable column width on phones and scroll inside their
  // wrapper instead of squeezing every cell into the viewport.
  const tableStyle = { minWidth: columns.length >= 5 ? 640 : undefined };

  if (loading) {
    return (
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse" role="table" style={tableStyle}>
          <thead>
            <tr className="bg-bg text-text-muted text-body-sm font-medium uppercase tracking-wide">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn('px-4 py-3', alignStyles[col.align || 'left'])}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t border-border">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', alignStyles[col.align || 'left'])}>
                    <div className="h-4 bg-border rounded-sm skeleton-shimmer w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-muted mb-4">{emptyMessage}</p>
        {emptyAction && (
          <button onClick={emptyAction.onClick} className="btn-primary btn-sm">
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full border-collapse" role="table" style={tableStyle}>
        <thead>
          <tr className="bg-bg text-text-muted text-body-sm font-medium uppercase tracking-wide">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3',
                  alignStyles[col.align || 'left'],
                  col.sortable && 'cursor-pointer select-none hover:text-text'
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    <span className="text-accent" aria-hidden="true">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowKey = keyExtractor(row);
            const isClickable = !!onRowClick;

            return (
              <tr
                key={rowKey}
                className={cn(
                  'border-t border-border',
                  striped && index % 2 === 1 && 'bg-bg-hover',
                  hoverable && 'hover:bg-bg-hover card-signal-hover',
                  isClickable && 'cursor-pointer'
                )}
                onClick={() => isClickable && onRowClick(row)}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-body',
                      dense && 'py-2',
                      alignStyles[col.align || 'left']
                    )}
                  >
                    {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showTotal?: boolean;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showTotal = true,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
      {showTotal && total > 0 && (
        <p className="text-body-sm text-text-muted">
          Showing {start} to {end} of {total} results
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 px-3 bg-bg-elevated border border-border rounded-sm text-body-sm text-text focus-visible:ring-2 focus-visible:ring-accent cursor-pointer disabled:bg-bg-hover disabled:text-text-muted disabled:cursor-not-allowed"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        )}

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
            aria-label="Previous page"
          >
            <ChevronDown className="w-5 h-5 rotate-180" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-8 h-8 rounded-sm text-body-sm font-medium transition-colors',
                  page === pageNum
                    ? 'bg-accent text-text-inverted'
                    : 'text-text hover:bg-bg-hover'
                )}
                aria-current={page === pageNum ? 'page' : undefined}
                aria-label={`Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="w-8 h-8 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover disabled:opacity-50 disabled:pointer-events-none transition-colors"
            aria-label="Next page"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}
