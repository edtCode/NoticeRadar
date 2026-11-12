import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { PersonalEntry } from '../../types';
import { Badge, CategoryBadge, StatusBadge } from '../ui';
import { cn, daysUntil, formatDate, truncate } from '../../utils/helpers';

// The student's own entry, shown next to institution notices in All Notices so
// everything they track lives in one place.
export function PersonalEntryCard({ entry }: { entry: PersonalEntry }) {
  const deadline = entry.deadline ? new Date(entry.deadline) : null;
  const daysLeft = deadline ? daysUntil(deadline) : null;
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;

  return (
    <article
      className={cn(
        'flex flex-col p-5 bg-bg-elevated rounded-lg card-signal card-signal-hover hover:border-border-strong transition-colors',
        urgent ? 'border-l-4 border-l-danger' : 'border-[1.5px] border-ink'
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <CategoryBadge category={entry.category} size="sm" />
        {entry.eligibility && <StatusBadge status={entry.eligibility.status} type="eligibility" size="sm" />}
        <Badge variant="neutral" size="sm">Added by you</Badge>
        {urgent && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-loud animate-blink-dot" aria-label="Urgent deadline" />
        )}
      </div>

      <h3 className="text-h4 font-semibold text-text text-pretty">{entry.title}</h3>

      {entry.description && (
        <p className="mt-2 text-body-sm text-text-muted">{truncate(entry.description, 180)}</p>
      )}

      {entry.eligibility?.status === 'NOT_ELIGIBLE' && entry.eligibility.reasons.length > 0 && (
        <p className="mt-2 text-body-sm text-danger">{entry.eligibility.reasons[0]}</p>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-caption text-text-muted whitespace-nowrap">
            {entry.deadline ? formatDate(entry.deadline) : entry.event_date ? formatDate(entry.event_date) : 'No date'}
          </span>
          {deadline && daysLeft !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-caption font-medium whitespace-nowrap',
                urgent ? 'text-danger' : daysLeft < 0 ? 'text-text-muted line-through' : 'text-warning'
              )}
            >
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {daysLeft < 0 ? 'Closed' : daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
            </span>
          )}
        </div>
        <Link to="/student/my-notices" className="btn-secondary btn-sm flex-shrink-0">
          Manage
        </Link>
      </div>
    </article>
  );
}
