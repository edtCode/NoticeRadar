import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge, CategoryBadge, ErrorState, EmptyState, Table, TableSkeleton, Pagination, Button } from '../../components/ui';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import { PAGINATION } from '../../constants';
import type { Notice } from '../../types';

export function AdminReviewQueuePage() {
  const [page, setPage] = useState(1);
  const limit = PAGINATION.DEFAULT_LIMIT;

  // Pending review uses the dedicated endpoint; other tabs use admin notices with filters.
  const pendingQuery = useQuery({
    queryKey: ['admin', 'notices', 'pending-review', { page, limit }],
    queryFn: () => adminService.getPendingReview({ page, limit }),
    placeholderData: keepPreviousData,
  });

  const activeQuery = pendingQuery;
  const notices: Notice[] = activeQuery.data?.data ?? [];
  const pagination = activeQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Notices awaiting manual verification. Nothing is published without approval."
        actions={<Link to="/admin/notices" className="btn-secondary h-10 px-4 inline-flex items-center">All notices</Link>}
      />

      {activeQuery.isError ? (
        <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load the queue" action={{ label: 'Retry', onClick: () => activeQuery.refetch() }} />
      ) : activeQuery.isLoading ? (
        <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden"><TableSkeleton rows={6} columns={6} /></div>
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12" />}
          title="Nothing waiting for review"
          description="Notices land here after a PDF is processed. You will see them the moment extraction completes."
        />
      ) : (
        <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden">
          <Table
            data={notices}
            keyExtractor={(n) => n.id}
            hoverable
            columns={[
              { key: 'title', header: 'Notice', render: (n) => <span className="block max-w-[280px] truncate font-medium text-text">{n.title}</span> },
              { key: 'category', header: 'Category', render: (n) => <CategoryBadge category={n.category} size="sm" dot={false} /> },
              { key: 'created', header: 'Created', render: (n) => <span className="text-body-sm text-text-muted">{formatDateTime(n.created_at)}</span> },
              { key: 'extraction', header: 'Extraction', render: (n) => <StatusBadge status={n.extraction_status} type="extraction" size="sm" /> },
              { key: 'review', header: 'Review', render: (n) => <StatusBadge status={n.review_status} type="review" size="sm" /> },
              {
                key: 'action', header: 'Action', align: 'right', render: (n) => {
                  const canReview = n.review_status === 'PENDING_REVIEW' || n.review_status === 'NOT_REVIEWED';
                  return (
                    <Link to={canReview ? `/admin/notices/${n.id}/review` : `/admin/notices/${n.id}/edit`} className="btn-secondary btn-sm">
                      {canReview ? 'Open Review' : 'View'}
                    </Link>
                  );
                },
              },
            ]}
          />
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} pageSize={limit} total={pagination.total} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}