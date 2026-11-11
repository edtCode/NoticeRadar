import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, StatusBadge, ErrorState, EmptyState, Skeleton, Table, TableSkeleton, Pagination, ConfirmDialog, CategoryBadge } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { Upload, FilePlus2, Search, X, AlertTriangle } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { formatDateTime, formatDate } from '../../utils/helpers';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, PAGINATION } from '../../constants';
import type { Notice } from '../../types';

type StatusTab = 'all' | 'drafts' | 'published' | 'archived';

const TABS: Array<{ key: StatusTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Archived' },
];

export function AdminNoticesPage() {
  const addToast = useAddToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get('status') as StatusTab) || 'all';

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState('');
  const limit = PAGINATION.DEFAULT_LIMIT;
  const [confirmArchive, setConfirmArchive] = useState<Notice | null>(null);

  const params = useMemo(() => {
    const base: Record<string, string | number> = { page, limit };
    if (search) base.search = search;
    if (category) base.category = category;
    switch (tabFromUrl) {
      case 'drafts': { base.status = 'DRAFT'; break; }
      case 'published': { base.status = 'PUBLISHED'; break; }
      case 'archived': { base.status = 'ARCHIVED'; break; }
      default: break;
    }
    return base;
  }, [tabFromUrl, page, search, category, limit]);

  const noticesQuery = useQuery({
    queryKey: ['admin', 'notices', params],
    queryFn: () => adminService.getNotices(params),
    placeholderData: keepPreviousData,
  });

  const notices: Notice[] = noticesQuery.data?.data ?? [];
  const pagination = noticesQuery.data?.pagination;

  const setTab = (key: StatusTab) => {
    const next = new URLSearchParams();
    if (key !== 'all') next.set('status', key);
    setSearchParams(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Notices"
        description="Create, process, review and publish your institution's notices."
        actions={
          <>
            <Link to="/admin/notices/upload" className="btn-primary h-10 px-4 inline-flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Notice</Link>
            <Link to="/admin/notices/create" className="btn-secondary h-10 px-4 inline-flex items-center gap-2"><FilePlus2 className="w-4 h-4" /> Create Manually</Link>
          </>
        }
      />

      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            placeholder="Search by title…"
            className="w-full h-10 pl-9 pr-8 bg-bg-elevated border border-border rounded-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Search notices"
          />
          {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text" aria-label="Clear"><X className="w-4 h-4" /></button>}
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="h-10 px-3 bg-bg-elevated border border-border rounded-sm text-body-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{NOTICE_CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <nav className="border-b border-border overflow-x-auto" aria-label="Notice status tabs">
        <ul className="flex gap-1 min-w-max" role="tablist">
          {TABS.map((t) => (
            <li key={t.key} role="presentation">
              <button
                role="tab"
                aria-selected={tabFromUrl === t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-body-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tabFromUrl === t.key ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'}`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {noticesQuery.isError ? (
        <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load notices" action={{ label: 'Retry', onClick: () => noticesQuery.refetch() }} />
      ) : noticesQuery.isLoading ? (
        <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden"><TableSkeleton rows={8} columns={7} /></div>
      ) : notices.length === 0 ? (
        <EmptyState
          title="No notices here"
          description="Try a different tab, or upload a notice to get started."
          action={{ label: 'Upload Notice', onClick: () => (window.location.href = '/admin/notices/upload') }}
        />
      ) : (
        <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden">
          <Table
            data={notices}
            keyExtractor={(n) => n.id}
            hoverable
            columns={[
              {
                key: 'title', header: 'Title', render: (n) => (
                  <div className="max-w-[260px]">
                    <p className="font-medium text-text truncate">{n.title}</p>
                    {n.file_name && <p className="text-caption text-text-muted mt-0.5 truncate">{n.file_name}</p>}
                  </div>
                ),
              },
              { key: 'category', header: 'Category', render: (n) => <CategoryBadge category={n.category} size="sm" dot={false} /> },
              { key: 'created', header: 'Created', render: (n) => <span className="text-body-sm text-text-muted">{formatDateTime(n.created_at)}</span> },
              { key: 'deadline', header: 'Deadline', render: (n) => <span className="text-body-sm text-text-muted">{n.deadline ? formatDate(n.deadline) : '—'}</span> },
              { key: 'extraction', header: 'Extraction', render: (n) => <StatusBadge status={n.extraction_status} type="extraction" size="sm" /> },
              { key: 'review', header: 'Review', render: (n) => <StatusBadge status={n.review_status} type="review" size="sm" /> },
              { key: 'publication', header: 'Publication', render: (n) => <StatusBadge status={n.status} type="notice" size="sm" /> },
              {
                key: 'actions', header: 'Actions', align: 'right', render: (n) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {n.extraction_status === 'FAILED' || n.extraction_status === 'OCR_REQUIRED' ? (
                      <Link to={`/admin/notices/${n.id}/processing`} className="btn-danger-ghost btn-sm">Fix</Link>
                    ) : n.review_status === 'PENDING_REVIEW' || n.review_status === 'NOT_REVIEWED' ? (
                      <Link to={`/admin/notices/${n.id}/review`} className="btn-primary btn-sm">Review</Link>
                    ) : n.review_status === 'APPROVED' && n.status === 'DRAFT' ? (
                      <Link to={`/admin/notices/${n.id}/publish`} className="btn-primary btn-sm">Publish</Link>
                    ) : (
                      <Link to={`/admin/notices/${n.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                    )}
                    <button onClick={() => setConfirmArchive(n)} className="btn-ghost btn-sm text-danger" aria-label={`Archive ${n.title}`}>Archive</button>
                  </div>
                ),
              },
            ]}
          />
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} pageSize={limit} total={pagination.total} onPageChange={setPage} />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmArchive}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => {
          if (!confirmArchive) return;
          adminService.deleteNotice(confirmArchive.id)
            .then(() => {
              addToast({ type: 'success', title: 'Notice archived' });
              setConfirmArchive(null);
              noticesQuery.refetch();
            })
            .catch((e: Error) => {
              addToast({ type: 'error', title: 'Archive failed', message: e.message });
              setConfirmArchive(null);
            });
        }}
        title="Archive this notice?"
        message={`"${confirmArchive?.title}" will move to Archived notices and students will no longer see it.`}
        confirmText="Archive"
        variant="danger"
      />
    </div>
  );
}