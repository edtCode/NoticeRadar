import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSavedNotices, useUnsaveNotice } from '../../hooks/useNoticeService';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { EmptyState, ErrorState, Skeleton, NoticeCardSkeleton, Pagination } from '../../components/ui';
import { AlertTriangle, Bookmark, Search, X } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { useAddToast } from '../../stores/uiStore';
import { ROUTES } from '../../constants';
import { PAGINATION } from '../../constants';
import type { Notice } from '../../types';

export function SavedNoticesPage() {
  const [page, setPage] = useState(1);
  const limit = PAGINATION.DEFAULT_LIMIT;
  const savedQuery = useSavedNotices({ page, limit });
  const unsaveMutation = useUnsaveNotice();
  const addToast = useAddToast();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);

  const notices = useMemo(() => {
    const rows = savedQuery.data?.data ?? [];
    return rows.flatMap((row) => (row.notices ? [row.notices as unknown as Notice] : []));
  }, [savedQuery.data]);

  const filtered = useMemo(() => {
    if (!search) return notices;
    const q = search.toLowerCase();
    return notices.filter((n) => `${n.title} ${n.summary ?? ''}`.toLowerCase().includes(q));
  }, [notices, search]);

  const handleUnsave = (id: string) => {
    unsaveMutation.mutate(id, {
      onSuccess: () => addToast({ type: 'success', title: 'Saved notice removed' }),
      onError: () => addToast({ type: 'error', title: 'Could not remove saved notice', message: 'Try again.' }),
    });
  };

  if (savedQuery.isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <Skeleton height={32} width={220} />
          <Skeleton height={16} width={280} className="mt-2" />
        </header>
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {Array.from({ length: 4 }).map((_, i) => <NoticeCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (savedQuery.isError) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-h1 font-semibold text-text">Saved Notices</h1>
        </header>
        <ErrorState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="Could not load your saved notices"
          action={{ label: 'Retry', onClick: () => savedQuery.refetch() }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">Saved Notices</h1>
          <p className="text-body text-text-muted mt-1">
            {notices.length === 0
              ? 'Nothing bookmarked yet.'
              : `${notices.length} saved opportunit${notices.length === 1 ? 'y' : 'ies'}.`}
          </p>
        </div>
        {notices.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search saved notices…"
              className="w-full sm:w-72 h-10 pl-9 pr-8 bg-bg-elevated border border-border rounded-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search saved notices"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text" aria-label="Clear search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </header>

      {notices.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-12 h-12" />}
          title="You haven't saved any notices yet."
          description="Bookmark internships, placements and scholarships you care about so they're easy to find later."
          action={{ label: 'Explore Notices', onClick: () => (window.location.href = ROUTES.STUDENT_NOTICES) }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-12 h-12" />} title="No matching saved notices" description={`Nothing saved matches "${search}".`} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {filtered.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              saved
              onUnsave={handleUnsave}
              onSave={() => undefined}
              showEligibility={false}
            />
          ))}
        </div>
      )}
      {savedQuery.data?.pagination && savedQuery.data.pagination.total > limit && (
        <Pagination page={page} pageSize={limit} total={savedQuery.data.pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}
