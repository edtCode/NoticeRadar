import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, SlidersHorizontal, LayoutGrid, List, AlertTriangle, Inbox, X } from 'lucide-react';
import { noticeService } from '../../services/notice.service';
import { useSavedNotices, useSaveNotice, useUnsaveNotice } from '../../hooks/useNoticeService';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { Pagination, ErrorState, EmptyState, NoticeCardSkeleton, TableSkeleton, Button } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, PAGINATION } from '../../constants';
import { cn } from '../../utils/helpers';
import type { EligibilityStatus, Notice } from '../../types';

type TabKey = 'all' | 'recommended' | 'eligible' | 'possibly' | 'not_eligible' | 'saved';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All Notices' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'eligible', label: 'Eligible' },
  { key: 'possibly', label: 'Possibly Eligible' },
  { key: 'not_eligible', label: 'Not Eligible' },
  { key: 'saved', label: 'Saved' },
];

const ELIGIBILITY_BY_TAB: Partial<Record<TabKey, EligibilityStatus>> = {
  eligible: 'ELIGIBLE',
  possibly: 'POSSIBLY_ELIGIBLE',
  not_eligible: 'NOT_ELIGIBLE',
};

export function AllNoticesPage() {
  const [tab, setTab] = useState<TabKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState('');
  const [publishedFrom, setPublishedFrom] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [sort, setSort] = useState<'recent' | 'deadline'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const addToast = useAddToast();
  const saveMutation = useSaveNotice();
  const unsaveMutation = useUnsaveNotice();
  const savedQuery = useSavedNotices({ page: 1, limit: 50 });
  const savedIds = useMemo(() => new Set(savedQuery.data?.data.map((r) => r.notice_id) ?? []), [savedQuery.data]);

  useEffect(() => { setPage(1); }, [tab, search, category, publishedFrom, deadlineFrom, sort]);

  const isSavedTab = tab === 'saved';
  const eligibility = ELIGIBILITY_BY_TAB[tab];

  const noticesQuery = useQuery({
    queryKey: ['notices', tab, { page, limit, search, category, publishedFrom, deadlineFrom, sort, eligibility }],
    queryFn: () =>
      noticeService.getFeed({
        page,
        limit,
        search: search || undefined,
        category: (category || undefined) as never,
        publishedFrom: publishedFrom || undefined,
        deadlineFrom: deadlineFrom || undefined,
        sort,
        eligibility,
      }),
    placeholderData: keepPreviousData,
    enabled: !isSavedTab,
  });

  const savedListQuery = useQuery({
    queryKey: ['notices', 'saved', { full: true }],
    queryFn: () => noticeService.getSavedNotices({ page, limit }),
    enabled: isSavedTab,
  });

  const handleSave = (id: string) => {
    if (savedIds.has(id)) unsaveMutation.mutate(id);
    else saveMutation.mutate(id, { onError: () => addToast({ type: 'error', title: 'Could not save notice' }) });
  };

  const activeFilterCount = [category, publishedFrom, deadlineFrom].filter(Boolean).length;

  const notices: Notice[] = isSavedTab
    ? (savedListQuery.data?.data.flatMap((row) => (row.notices ? [{ ...row.notices, eligibility: undefined }] as unknown as Notice[] : [])) ?? [])
    : (noticesQuery.data?.data ?? []);
  const isLoading = isSavedTab ? savedListQuery.isLoading : noticesQuery.isLoading;
  const isError = isSavedTab ? savedListQuery.isError : noticesQuery.isError;
  const pagination = isSavedTab ? savedListQuery.data?.pagination : noticesQuery.data?.pagination;
  const refetch = isSavedTab ? savedListQuery.refetch : noticesQuery.refetch;

  // client-side saved-tab filtering by search/category since the API shape returns denormalized rows
  const filteredNotices = useMemo(() => {
    if (!isSavedTab) return notices;
    return notices.filter((n) => {
      if (search && !(`${n.title} ${n.summary ?? ''}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (category && n.category !== category) return false;
      return true;
    });
  }, [isSavedTab, notices, search, category]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">All Notices</h1>
          <p className="text-body text-text-muted mt-1">Everything published by your institution.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search notices…"
              className="w-full h-10 pl-9 pr-8 bg-bg-elevated border border-border rounded-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search notices"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text" aria-label="Clear search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'recent' | 'deadline')}
            className="h-10 px-3 bg-bg-elevated border border-border rounded-sm text-body-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Sort notices"
          >
            <option value="recent">Most recent</option>
            <option value="deadline">By deadline</option>
          </select>
          <div className="flex rounded-sm border border-border overflow-hidden" role="group" aria-label="View mode">
            <button onClick={() => setView('grid')} className={cn('p-2.5', view === 'grid' ? 'bg-accent text-loud-ink' : 'bg-bg-elevated text-text-muted hover:text-text')} aria-pressed={view === 'grid'} aria-label="Grid view">
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setView('list')} className={cn('p-2.5', view === 'list' ? 'bg-accent text-loud-ink' : 'bg-bg-elevated text-text-muted hover:text-text')} aria-pressed={view === 'list'} aria-label="List view">
              <List className="w-5 h-5" />
            </button>
          </div>
          <Button variant="secondary" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="bg-bg-elevated border border-border rounded-lg p-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="filter-category" className="block text-body-sm font-medium text-text mb-1.5">Category</label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">All categories</option>
              {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{NOTICE_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-published" className="block text-body-sm font-medium text-text mb-1.5">Published from</label>
            <input
              id="filter-published" type="date" value={publishedFrom} onChange={(e) => setPublishedFrom(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="filter-deadline" className="block text-body-sm font-medium text-text mb-1.5">Deadline from</label>
            <input
              id="filter-deadline" type="date" value={deadlineFrom} onChange={(e) => setDeadlineFrom(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          {activeFilterCount > 0 && (
            <div className="sm:col-span-3">
              <Button variant="ghost" onClick={() => { setCategory(''); setPublishedFrom(''); setDeadlineFrom(''); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <nav className="border-b border-border overflow-x-auto" aria-label="Notice tabs">
        <ul className="flex gap-1 min-w-max" role="tablist">
          {TABS.map((t) => (
            <li key={t.key} role="presentation">
              <button
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2.5 text-body-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'
                )}
              >
                {t.label}
                {t.key === 'saved' && savedQuery.data ? <span className="ml-1.5 text-caption">({savedQuery.data.pagination?.total ?? ''})</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Results */}
      {isError ? (
        <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load notices" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : isLoading ? (
        view === 'grid' ? (
          <div className="grid md:grid-cols-2 gap-4 stagger">{Array.from({ length: 6 }).map((_, i) => <NoticeCardSkeleton key={i} />)}</div>
        ) : (
          <TableSkeleton rows={5} columns={3} />
        )
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-12 h-12" />}
          title={isSavedTab ? "You haven't saved any notices yet" : 'No notices found'}
          description={isSavedTab ? 'Save opportunities you care about and find them here later.' : 'Try changing your search, category or date filters.'}
          action={isSavedTab ? { label: 'Explore Notices', onClick: () => setTab('all') } : undefined}
        />
      ) : view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filteredNotices.map((notice) => (
            <NoticeCard
              key={`${notice.id}-${isSavedTab}`}
              notice={notice}
              saved={savedIds.has(notice.id)}
              onSave={handleSave}
              onUnsave={handleSave}
              savePending={saveMutation.isPending || unsaveMutation.isPending}
              showEligibility={!isSavedTab}
            />
          ))}
        </div>
      ) : (
        <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
          {filteredNotices.map((notice) => (
            <li key={`${notice.id}-list-${isSavedTab}`}>
              <NoticeCard notice={notice} saved={savedIds.has(notice.id)} onSave={handleSave} onUnsave={handleSave} savePending={saveMutation.isPending || unsaveMutation.isPending} showEligibility={!isSavedTab} compact />
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.total > limit && (
        <Pagination page={page} pageSize={limit} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}
