import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search as SearchIcon, SlidersHorizontal, X, AlertTriangle, Inbox } from 'lucide-react';
import { noticeService } from '../../services/notice.service';
import { useSavedNotices, useSaveNotice, useUnsaveNotice } from '../../hooks/useNoticeService';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { Pagination, ErrorState, EmptyState, NoticeCardSkeleton, Button } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, PAGINATION } from '../../constants';
import type { Notice } from '../../types';

const EXAMPLES = ['Summer internship', 'Scholarship 2026', 'Examination timetable', 'Software engineering internship', 'Research opportunity'];

export function SearchPage() {
  const [raw, setRaw] = useState('');
  const query = useDebouncedValue(raw, 300);
  const [category, setCategory] = useState('');
  const [publishedFrom, setPublishedFrom] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [page, setPage] = useState(1);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const addToast = useAddToast();
  const saveMutation = useSaveNotice();
  const unsaveMutation = useUnsaveNotice();
  const savedQuery = useSavedNotices({ page: 1, limit: 50 });
  const savedIds = useMemo(() => new Set(savedQuery.data?.data.map((r) => r.notice_id) ?? []), [savedQuery.data]);

  const hasQuery = query.trim().length > 0;

  const resultsQuery = useQuery({
    queryKey: ['notices', 'search', { query, category, publishedFrom, deadlineFrom, page, limit }],
    queryFn: () =>
      noticeService.searchNotices({
        search: query || undefined,
        category: (category || undefined) as never,
        publishedFrom: publishedFrom || undefined,
        deadlineFrom: deadlineFrom || undefined,
        page,
        limit,
      }),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
  });

  const results: Notice[] = resultsQuery.data?.data ?? [];
  const activeFilterCount = [category, publishedFrom, deadlineFrom].filter(Boolean).length;

  const handleSave = (id: string) => {
    if (savedIds.has(id)) unsaveMutation.mutate(id);
    else saveMutation.mutate(id, { onError: () => addToast({ type: 'error', title: 'Could not save notice' }) });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-h1 font-semibold text-text">Search Notices</h1>
        <p className="text-body text-text-muted mt-1">Traditional database search across titles, descriptions, categories and summaries.</p>
      </header>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); setPage(1); }}
        className="flex flex-col sm:flex-row gap-2"
        role="search"
      >
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" aria-hidden="true" />
          <input
            type="search"
            value={raw}
            onChange={(e) => { setRaw(e.target.value); }}
            placeholder="Search internships, scholarships, examinations and college notices…"
            className="w-full h-11 pl-10 pr-10 bg-bg-elevated border border-border rounded-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Search query"
          />
          {raw && (
            <button type="button" onClick={() => setRaw('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text" aria-label="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-11">Search</Button>
        <Button type="button" variant="secondary" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-bg-elevated border border-border rounded-lg p-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="sf-category" className="block text-body-sm font-medium text-text mb-1.5">Category</label>
            <select id="sf-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">All categories</option>
              {NOTICE_CATEGORIES.map((c) => <option key={c} value={c}>{NOTICE_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sf-published" className="block text-body-sm font-medium text-text mb-1.5">Published from</label>
            <input id="sf-published" type="date" value={publishedFrom} onChange={(e) => { setPublishedFrom(e.target.value); setPage(1); }} className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text" />
          </div>
          <div>
            <label htmlFor="sf-deadline" className="block text-body-sm font-medium text-text mb-1.5">Deadline from</label>
            <input id="sf-deadline" type="date" value={deadlineFrom} onChange={(e) => { setDeadlineFrom(e.target.value); setPage(1); }} className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text" />
          </div>
        </div>
      )}

      {!hasQuery ? (
        <div className="rounded-lg border border-border bg-bg-elevated p-6">
          <h2 className="text-body-sm font-semibold text-text mb-3">Try one of these:</h2>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => { setRaw(ex); setSubmitted(true); }} className="px-3 py-1.5 rounded-full border border-border text-body-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <p className="mt-4 text-caption text-text-muted">Search matches words in the notice database — it doesn't interpret questions or eligibility rules.</p>
        </div>
      ) : resultsQuery.isError ? (
        <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Search failed" message="Could not reach the search service." action={{ label: 'Retry', onClick: () => resultsQuery.refetch() }} />
      ) : resultsQuery.isLoading || resultsQuery.isFetching ? (
        <div className="grid md:grid-cols-2 gap-4 stagger">{Array.from({ length: 4 }).map((_, i) => <NoticeCardSkeleton key={i} />)}</div>
      ) : results.length === 0 ? (
        <EmptyState icon={<Inbox className="w-12 h-12" />} title={`No results for "${query}"`} description="Try different words, or check your filters. Search matches exact words in titles, descriptions and summaries." />
      ) : (
        <>
          {submitted && (
            <p className="text-body-sm text-text-muted" role="status">
              {resultsQuery.data?.pagination?.total ?? results.length} result{(resultsQuery.data?.pagination?.total ?? results.length) === 1 ? '' : 's'} for “{query}”
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4 stagger">
            {results.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} saved={savedIds.has(notice.id)} onSave={handleSave} onUnsave={handleSave} savePending={saveMutation.isPending || unsaveMutation.isPending} />
            ))}
          </div>
          {resultsQuery.data?.pagination && resultsQuery.data.pagination.total > limit && (
            <Pagination page={page} pageSize={limit} total={resultsQuery.data.pagination.total} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
