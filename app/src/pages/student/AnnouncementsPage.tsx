import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, SlidersHorizontal, Filter, Clock, Mail, Bookmark,
  AlertTriangle, Inbox, ExternalLink, ChevronRight
} from 'lucide-react';
import { emailService } from '../../services/email.service';
import {
  useAnnouncements,
  useBookmarkAnnouncement,
  useMarkAnnouncementRead,
  useDismissAnnouncement,
  useUnreadCount
} from '../../hooks/useEmailService';
import {
  Button, Badge, ErrorState, EmptyState,
  Pagination
} from '../../components/ui';
import { Spinner } from '../../components/ui/Spinner';
import { useAddToast } from '../../stores/uiStore';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { ROUTES } from '../../constants';
import type { EmailAnnouncement, EmailAnnouncementQuery } from '../../types/email';

const CATEGORY_LABELS: Record<string, string> = {
  internship: 'Internship',
  summer_internship: 'Summer Internship',
  winter_internship: 'Winter Internship',
  full_time_placement: 'Full-Time Placement',
  off_campus_placement: 'Off-Campus Placement',
  on_campus_placement: 'On-Campus Placement',
  graduate_hiring: 'Graduate Hiring',
  job_opportunity: 'Job Opening',
  apprenticeship: 'Apprenticeship',
  recruitment_drive: 'Recruitment Drive',
  referral_opportunity: 'Referral',
  hackathon: 'Hackathon',
  coding_competition: 'Coding Competition',
  technical_fest: 'Technical Fest',
  workshop: 'Workshop',
  webinar: 'Webinar',
  seminar: 'Seminar',
  technical_conference: 'Technical Conference',
  project_competition: 'Project Competition',
  developer_event: 'Developer Event',
  scholarship: 'Scholarship',
  fellowship: 'Fellowship',
  research_opportunity: 'Research Opportunity',
  student_ambassador: 'Student Ambassador',
  leadership_program: 'Leadership Program',
  training_program: 'Training Program',
  certification_program: 'Certification Program',
  entrepreneurship_program: 'Entrepreneurship Program',
  incubation_program: 'Incubation Program',
  academic_notice: 'Academic Notice',
  examination_notice: 'Examination Notice',
  registration_notice: 'Registration Notice',
  department_notice: 'Department Notice',
  administrative_notice: 'Administrative Notice',
  holiday_notice: 'Holiday Notice',
  fee_notice: 'Fee Notice',
  result_announcement: 'Result Announcement',
  general_event: 'General Event',
  club_activity: 'Club Activity',
  cultural_fest: 'Cultural Fest',
  sports_event: 'Sports Event',
  important_announcement: 'Important Announcement',
  other: 'Other',
  irrelevant: 'Irrelevant'
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

export function AnnouncementsPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [category, setCategory] = useState('');
  const [importance, setImportance] = useState('');
  const [sort, setSort] = useState<'recent' | 'deadline'>('recent');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const addToast = useAddToast();

  const unreadQuery = useUnreadCount();
  const bookmarkMutation = useBookmarkAnnouncement();
  const readMutation = useMarkAnnouncementRead();
  const dismissMutation = useDismissAnnouncement();

  const query: EmailAnnouncementQuery = {
    page,
    limit,
    search: search || undefined,
    category: category || undefined,
    importance: (importance as any) || undefined,
    sort
  };

  const announcementsQuery = useAnnouncements(query);

  const announcements: EmailAnnouncement[] = announcementsQuery.data?.data ?? [];
  const isLoading = announcementsQuery.isLoading;
  const isError = announcementsQuery.isError;
  const pagination = announcementsQuery.data?.pagination;
  const unread = unreadQuery.data?.unread ?? 0;

  const activeFilterCount = [category, importance, search].filter(Boolean).length;

  const handleSave = (id: string) => {
    bookmarkMutation.mutate(id, {
      onError: () => addToast({ type: 'error', title: 'Could not update bookmark' })
    });
  };

  const handleRead = (id: string) => {
    readMutation.mutate(id, {
      onError: () => addToast({ type: 'error', title: 'Could not mark as read' })
    });
  };

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id, {
      onSuccess: () => addToast({ type: 'success', title: 'Dismissed' }),
      onError: () => addToast({ type: 'error', title: 'Could not dismiss' })
    });
  };

  const categoryOptions = useMemo(() => {
    const cats = new Set(announcements.map((a) => a.primary_category));
    return Array.from(cats).sort();
  }, [announcements]);

  if (isError) {
    return (
      <ErrorState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Could not load announcements"
        action={{ label: 'Retry', onClick: () => announcementsQuery.refetch() }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Spinner size="lg" />
        <p className="text-body text-text-muted">Loading your announcements…</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="w-12 h-12" />}
        title={activeFilterCount > 0 ? 'No announcements match your filters' : 'No announcements yet'}
        description={
          activeFilterCount > 0
            ? 'Try clearing some filters to see more announcements.'
            : 'Connect your Gmail account and sync to start discovering opportunities from your inbox.'
        }
        action={
          activeFilterCount > 0
            ? { label: 'Clear filters', onClick: () => { setSearchInput(''); setCategory(''); setImportance(''); } }
            : { label: 'Connect Gmail', onClick: () => navigate(ROUTES.STUDENT_GMAIL_CONNECT) }
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">Announcements</h1>
          <p className="text-body text-text-muted mt-1">
            Opportunities extracted from your connected Gmail inbox.
            {unread > 0 && <span className="ml-2 inline-flex items-center gap-1 text-accent font-medium">
              {unread} unread
            </span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search announcements…"
              className="w-full h-10 pl-9 pr-8 bg-bg-elevated border border-border rounded-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Search announcements"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'recent' | 'deadline')}
            className="h-10 px-3 bg-bg-elevated border border-border rounded-sm text-body-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Sort announcements"
          >
            <option value="recent">Newest first</option>
            <option value="deadline">Nearest deadline first</option>
          </select>
          <Button variant="secondary" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>
      </header>

      {showFilters && (
        <div className="bg-bg-elevated border border-border rounded-lg p-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="filter-category" className="block text-body-sm font-medium text-text mb-1.5">
              Category
            </label>
            <select
              id="filter-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-importance" className="block text-body-sm font-medium text-text mb-1.5">
              Importance
            </label>
            <select
              id="filter-importance"
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              className="w-full h-10 px-3 bg-bg border border-border rounded-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">All importance</option>
              {Object.entries(IMPORTANCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <div className="sm:col-span-3">
              <Button variant="ghost" onClick={() => { setSearchInput(''); setCategory(''); setImportance(''); setPage(1); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5 stagger">
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            isSaved={announcement.is_bookmarked}
            isRead={announcement.is_read}
            onSave={() => handleSave(announcement.id)}
            onRead={() => handleRead(announcement.id)}
            onDismiss={() => handleDismiss(announcement.id)}
            savePending={bookmarkMutation.isPending}
            readPending={readMutation.isPending}
            dismissPending={dismissMutation.isPending}
          />
        ))}
      </div>

      {pagination && pagination.total > limit && (
        <Pagination page={page} pageSize={limit} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}

function AnnouncementCard({
  announcement,
  isSaved,
  isRead,
  onSave,
  onRead,
  onDismiss,
  savePending,
  readPending,
  dismissPending
}: {
  announcement: EmailAnnouncement;
  isSaved: boolean;
  isRead: boolean;
  onSave: () => void;
  onRead: () => void;
  onDismiss: () => void;
  savePending: boolean;
  readPending: boolean;
  dismissPending: boolean;
}) {
  const deadline = announcement.important_dates?.applicationDeadline?.normalizedDate
    ? announcement.important_dates.applicationDeadline.normalizedDate.slice(0, 10)
    : null;
  const eventStart = announcement.important_dates?.eventStartDate?.normalizedDate
    ? announcement.important_dates.eventStartDate.normalizedDate.slice(0, 10)
    : null;
  const cpi = announcement.eligibility_details?.minimumCPI ?? null;
  const cgpa = announcement.eligibility_details?.minimumCGPA ?? null;
  const branches = (announcement.eligibility_details?.branches ?? []).slice(0, 3);
  const confidence = announcement.extraction_confidence ?? null;

  const daysUntil = (dateString: string | null) => {
    if (!dateString) return null;
    const d = new Date(dateString).getTime();
    const now = Date.now();
    return Math.round((d - now) / (86400 * 1000));
  };

  const remainingDays = daysUntil(deadline);
  const urgency = remainingDays !== null && remainingDays <= 3 ? 'danger' : remainingDays !== null && remainingDays <= 7 ? 'warning' : null;

  return (
    <article
      className={`card-signal rounded-lg border border-border bg-bg p-4 transition-colors hover:border-border-strong ${isRead ? 'bg-bg/50' : ''}`}
    >
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <Badge variant="info" size="sm">
          {CATEGORY_LABELS[announcement.primary_category] ?? announcement.primary_category}
        </Badge>
        <Badge
          variant={urgency === 'danger' ? 'danger' : urgency === 'warning' ? 'warning' : 'neutral'}
          size="sm"
        >
          {IMPORTANCE_LABELS[announcement.importance] ?? announcement.importance}
        </Badge>
        {confidence != null && (
          <span className="text-caption text-text-muted">
            AI {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      <Link to={ROUTES.STUDENT_ANNOUNCEMENT_DETAIL(announcement.id)} className="block">
        <h3 className="text-body font-medium text-text mb-1 line-clamp-2">{announcement.title}</h3>
        <p className="text-body-sm text-text-muted line-clamp-2">{announcement.description}</p>
      </Link>

      <div className="mt-3 space-y-1.5 text-xs text-text-muted">
        {announcement.organization_name && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3" aria-hidden="true" />
            <span className="font-medium">{announcement.organization_name}</span>
          </div>
        )}
        {deadline && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span className={`${urgency ? 'font-medium ' + (urgency === 'danger' ? 'text-danger' : 'text-warning') : ''}`}>
              Deadline {deadline}{remainingDays !== null ? ` (${remainingDays}d)` : ''}
            </span>
          </div>
        )}
        {eventStart && (
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3" aria-hidden="true" />
            <span>Event {eventStart}</span>
          </div>
        )}
        {cpi != null && (
          <div className="flex items-center gap-1.5">
            <span>Min CPI {cpi}</span>
          </div>
        )}
        {branches.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span>{branches.join(', ')}${branches.length === 3 ? '…' : ''}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onSave(); onRead(); }}
            disabled={savePending || readPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-body-sm transition-colors disabled:opacity-50"
          >
            {isSaved ? <Bookmark className="w-3 h-3 fill-accent" /> : <Bookmark className="w-3 h-3" />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
        {announcement.links?.applicationLink && (
          <a
            href={announcement.links.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            Apply <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        )}
        <button
          onClick={onDismiss}
          disabled={dismissPending}
          className="text-xs text-danger hover:bg-danger-soft px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
