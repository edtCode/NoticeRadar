import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import type { Notice } from '../../types';
import { CategoryBadge, StatusBadge } from '../ui';
import { Button } from '../ui';
import { cn } from '../../utils/helpers';
import { formatDate, truncate, daysUntil } from '../../utils/helpers';

export interface NoticeCardProps {
  notice: Notice;
  saved?: boolean;
  onSave?: (noticeId: string) => void;
  onUnsave?: (noticeId: string) => void;
  savePending?: boolean;
  showEligibility?: boolean;
  compact?: boolean;
}

export function NoticeCard({ notice, saved, onSave, onUnsave, savePending, showEligibility = true, compact }: NoticeCardProps) {
  const deadline = notice.deadline ? new Date(notice.deadline) : null;
  const daysLeft = deadline ? daysUntil(deadline) : null;
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;

  return (
    <article className={cnSignalCard(urgent, compact)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={notice.category} size="sm" />
          {showEligibility && notice.eligibility && (
            <StatusBadge status={notice.eligibility.status} type="eligibility" size="sm" />
          )}
          {urgent && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-danger animate-blink-dot" aria-label="Urgent deadline" />
          )}
        </div>
        {onSave && onUnsave && (
          <button
            type="button"
            onClick={() => (saved ? onUnsave(notice.id) : onSave(notice.id))}
            disabled={savePending}
            className="p-1.5 rounded-sm text-text-muted hover:text-accent hover:bg-bg-hover transition-colors disabled:opacity-50"
            aria-label={saved ? `Unsave ${notice.title}` : `Save ${notice.title}`}
            aria-pressed={saved}
          >
            {saved ? <BookmarkCheck className="w-5 h-5 text-accent animate-check-pop" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
      </div>

      <Link to={`/student/notices/${notice.id}`} className="group">
        <h3 className="text-h4 font-semibold text-text group-hover:text-accent transition-colors text-pretty">
          {compact ? truncate(notice.title, 70) : notice.title}
        </h3>
      </Link>

      {notice.summary && (
        <p className="mt-2 text-body-sm text-text-muted flex-none">
          {truncate(notice.summary, compact ? 100 : 180)}
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-caption tnum text-text-muted whitespace-nowrap">
            {notice.published_at ? formatDate(notice.published_at) : '—'}
          </span>
          {deadline && daysLeft !== null && (
            <span
              className={`inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap ${
                urgent ? 'text-danger' : daysLeft < 0 ? 'text-text-muted line-through' : 'text-warning'
              }`}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {daysLeft < 0 ? 'Closed' : daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
            </span>
          )}
        </div>
        <Link
          to={`/student/notices/${notice.id}`}
          className="btn-secondary btn-sm flex-shrink-0"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}

function cnSignalCard(urgent: boolean, compact?: boolean): string {
  return cn(
    'card-signal card-signal-hover flex flex-col',
    compact ? 'p-4' : 'p-5',
    urgent && 'ring-1 ring-danger/40'
  );
}
