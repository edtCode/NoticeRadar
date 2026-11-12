import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Bookmark, CalendarClock, Target, ChevronRight, Inbox, AlertTriangle, Clock, FilePlus2,
} from 'lucide-react';
import { noticeService } from '../../services/notice.service';
import { deadlineService } from '../../services/deadline.service';
import { useAuthStore } from '../../stores/authStore';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { CategoryBadge, StatusBadge, Button, ErrorState, NoticeCardSkeleton, DashboardStatCardSkeleton } from '../../components/ui';
import { useSaveNotice, useUnsaveNotice, useSavedNotices } from '../../hooks/useNoticeService';
import { usePersonalEntries } from '../../hooks/usePersonalEntryService';
import { AnimatedNumber } from '../../components/motion';
import { formatDate, daysUntil } from '../../utils/helpers';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, ROUTES } from '../../constants';
import type { Notice, NoticeCategory, UpcomingDeadline } from '../../types';
import { useAddToast } from '../../stores/uiStore';

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const addToast = useAddToast();
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const feedQuery = useQuery({
    queryKey: ['notices', 'feed', { limit: 6, category: categoryFilter || undefined }],
    queryFn: () => noticeService.getFeed({ limit: 6, category: (categoryFilter || undefined) as NoticeCategory }),
    staleTime: 30_000,
  });

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines', 'upcoming', { days: 30 }],
    queryFn: () => deadlineService.getUpcomingDeadlines({ days: 30, limit: 5 }),
    staleTime: 60_000,
  });

  const savedQuery = useSavedNotices({ page: 1, limit: 1 });
  const personalQuery = usePersonalEntries({ limit: 4 });

  const saveMutation = useSaveNotice();
  const unsaveMutation = useUnsaveNotice();

  const savedIds = new Set(savedQuery.data?.data.map((r) => r.notice_id) ?? []);

  const handleSave = (id: string) => {
    if (savedIds.has(id)) {
      unsaveMutation.mutate(id);
    } else {
      saveMutation.mutate(id, { onError: () => addToast({ type: 'error', title: 'Could not save notice', message: 'Please try again.' }) });
    }
  };

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  const feedNotices = feedQuery.data?.data ?? [];
  const eligibleCount = feedNotices.filter((n: Notice) => n.eligibility?.status === 'ELIGIBLE').length;
  const deadlines = deadlinesQuery.data ?? [];
  const savedTotal = savedQuery.data?.pagination?.total;

  // Deadlines the student added themselves belong on the dashboard too.
  const ownDeadlines: DeadlineRow[] = (personalQuery.data ?? [])
    .filter((entry) => {
      if (!entry.deadline) return false;
      const days = daysUntil(new Date(entry.deadline));
      return days >= 0 && days <= 30;
    })
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      deadline: entry.deadline,
      eligibility: entry.eligibility,
      href: ROUTES.STUDENT_MY_NOTICES,
    }));

  const deadlineRows: DeadlineRow[] = [
    ...deadlines.map((item: UpcomingDeadline) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      deadline: item.deadline,
      eligibility: item.eligibility,
      href: `/student/notices/${item.id}`,
    })),
    ...ownDeadlines,
  ]
    .sort((a, b) => new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime())
    .slice(0, 5);
  const deadlineCount = deadlines.length + ownDeadlines.length;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <header>
        <h1 className="text-h1 font-semibold text-text">Good {greeting}, {firstName}!</h1>
        <p className="text-body text-text-muted mt-1">
          Here are the latest announcements and opportunities from your institution.
        </p>
        {user && (
          <p className="text-caption text-text-muted mt-1">
            {user.name} · Update your details any time from{' '}
            <Link to={ROUTES.STUDENT_PROFILE} className="text-accent hover:underline">your profile</Link>.
          </p>
        )}
      </header>

      {/* Stats — only counts that can be computed honestly */}
      <section aria-label="Overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {feedQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <DashboardStatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard icon={<FileText className="w-5 h-5" />} label="Notices on your radar" value={feedQuery.data ? feedQuery.data.pagination.total ?? feedNotices.length : null} tone="accent" />
              <StatCard icon={<Target className="w-5 h-5" />} label="Eligible in your feed" value={eligibleCount} tone="success" />
              <StatCard icon={<Bookmark className="w-5 h-5" />} label="Saved notices" value={typeof savedTotal === 'number' ? savedTotal : null} tone="info" />
              <StatCard icon={<CalendarClock className="w-5 h-5" />} label="Deadlines in 30 days" value={deadlinesQuery.data && personalQuery.data ? deadlineCount : null} tone="warning" />
            </>
          )}
        </div>
        <p className="mt-2 text-caption text-text-muted">Counts cover the current feed results, your saved notices and the next 30 days of deadlines.</p>
      </section>

      {/* Category shortcuts */}
      <section aria-label="Categories">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter feed by category">
          <span className="text-body-sm text-text-muted font-medium">Browse:</span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${categoryFilter === '' ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
            aria-pressed={categoryFilter === ''}
          >
            All
          </button>
          {NOTICE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${categoryFilter === c ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
              aria-pressed={categoryFilter === c}
            >
              {NOTICE_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </section>

      {/* Recommended for you */}
      <section aria-labelledby="recommended-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recommended-heading" className="text-h3 font-semibold text-text">Recommended for You</h2>
          <Link to={ROUTES.STUDENT_NOTICES} className="text-body-sm text-accent hover:underline inline-flex items-center gap-1">
            All notices <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {feedQuery.isError ? (
          <ErrorState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Could not load your feed"
            message={feedQuery.error instanceof Error ? feedQuery.error.message : 'There was a problem reaching the notice service. Retry, or check your connection.'}
            action={{ label: 'Retry', onClick: () => feedQuery.refetch() }}
          />
        ) : feedQuery.isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <NoticeCardSkeleton key={i} />)}
          </div>
        ) : feedNotices.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 bg-bg-elevated border border-border rounded-lg">
            <Inbox className="w-12 h-12 text-text-muted mb-4" aria-hidden="true" />
            <h3 className="text-h4 font-semibold text-text mb-1">Nothing on your radar yet</h3>
            <p className="text-body text-text-muted max-w-sm mb-4">
              No published notices match your profile and filters right now. New notices appear here as your administrators publish them.
            </p>
            <Link to={ROUTES.STUDENT_NOTICES} className="btn-secondary">Browse all notices</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 stagger">
            {feedNotices.map((notice: Notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                saved={savedIds.has(notice.id)}
                onSave={handleSave}
                onUnsave={handleSave}
                savePending={saveMutation.isPending || unsaveMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming deadlines */}
      <section aria-labelledby="deadlines-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="deadlines-heading" className="text-h3 font-semibold text-text">Upcoming Deadlines</h2>
          <Link to={ROUTES.STUDENT_CALENDAR} className="text-body-sm text-accent hover:underline inline-flex items-center gap-1">
            View calendar <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {deadlinesQuery.isError ? (
          <ErrorState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Could not load deadlines"
            message={deadlinesQuery.error instanceof Error ? deadlinesQuery.error.message : undefined}
            action={{ label: 'Retry', onClick: () => deadlinesQuery.refetch() }}
          />
        ) : deadlinesQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-border/40 rounded-md skeleton-shimmer" />)}</div>
        ) : deadlineRows.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-bg-elevated border border-border rounded-lg text-body-sm text-text-muted">
            <Clock className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            No deadlines in the next 30 days. Saved opportunities will appear here as their deadlines approach.
          </div>
        ) : (
          <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {deadlineRows.map((item) => {
              const d = item.deadline ? daysUntil(new Date(item.deadline)) : null;
              return (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-bg-hover transition-colors group"
                  >
                    <span
                      className={`flex-shrink-0 w-12 text-center rounded-md px-1 py-1.5 text-caption font-semibold ${
                        d !== null && d <= 3 ? 'bg-danger-soft text-danger' : d !== null && d <= 7 ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'
                      }`}
                    >
                      {d !== null ? `${d}d` : '—'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-text group-hover:text-accent truncate">{item.title}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <CategoryBadge category={item.category} size="sm" dot={false} />
                        {item.eligibility && <StatusBadge status={item.eligibility.status} type="eligibility" size="sm" dot={false} />}
                        <span className="text-caption text-text-muted">{item.deadline ? formatDate(item.deadline) : ''}</span>
                      </span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0 group-hover:text-accent" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Notices and events the student tracks themselves */}
      <section aria-labelledby="personal-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="personal-heading" className="text-h3 font-semibold text-text">My notices &amp; events</h2>
          <Link to={ROUTES.STUDENT_MY_NOTICES} className="text-body-sm text-accent hover:underline inline-flex items-center gap-1">
            <FilePlus2 className="w-4 h-4" aria-hidden="true" /> Add or manage
          </Link>
        </div>

        {personalQuery.isError ? (
          <ErrorState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Could not load your entries"
            message={personalQuery.error instanceof Error ? personalQuery.error.message : undefined}
            action={{ label: 'Retry', onClick: () => personalQuery.refetch() }}
          />
        ) : personalQuery.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-border/40 rounded-md skeleton-shimmer" />)}</div>
        ) : (personalQuery.data ?? []).length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-bg-elevated border border-border rounded-lg">
            <p className="text-body-sm text-text-muted">
              Got a notice by email or on a noticeboard that is not published here? Add it yourself with its details or the original PDF.
            </p>
            <Link to={ROUTES.STUDENT_MY_NOTICES} className="btn-secondary h-9 px-3 inline-flex items-center gap-2 flex-shrink-0">
              <FilePlus2 className="w-4 h-4" aria-hidden="true" /> Add an entry
            </Link>
          </div>
        ) : (
          <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {(personalQuery.data ?? []).map((entry) => {
              const remaining = entry.deadline ? daysUntil(new Date(entry.deadline)) : null;
              return (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`flex-shrink-0 w-12 text-center rounded-md px-1 py-1.5 text-caption font-semibold ${
                    remaining !== null && remaining <= 3 ? 'bg-danger-soft text-danger' : remaining !== null && remaining <= 7 ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'
                  }`}>
                    {remaining !== null ? `${remaining}d` : '—'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-medium text-text truncate">{entry.title}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <CategoryBadge category={entry.category} size="sm" dot={false} />
                      {entry.eligibility && <StatusBadge status={entry.eligibility.status} type="eligibility" size="sm" dot={false} />}
                      <span className="text-caption text-text-muted">{entry.deadline ? formatDate(entry.deadline) : 'No deadline'}</span>
                    </span>
                  </span>
                  <Link to={ROUTES.STUDENT_MY_NOTICES} className="text-body-sm text-accent hover:underline flex-shrink-0">Open</Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

type DeadlineRow = {
  id: string;
  title: string;
  category: string;
  deadline: string | null;
  eligibility?: Notice['eligibility'];
  href: string;
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | null; tone: 'accent' | 'success' | 'warning' | 'info' }) {
  const tones = {
    accent: 'bg-accent text-loud-ink',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
  };
  return (
    <div className="card-signal card-signal-hover p-5">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${tones[tone]}`} aria-hidden="true">{icon}</div>
      <p className="text-h2 font-semibold text-text">
        <AnimatedNumber value={value} placeholder="—" duration={900} />
      </p>
      <p className="text-body-sm text-text-muted">{label}</p>
    </div>
  );
}