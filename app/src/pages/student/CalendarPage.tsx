import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpcomingDeadlines } from '../../hooks/useDeadlineService';
import { usePersonalEntries } from '../../hooks/usePersonalEntryService';
import { ErrorState, EmptyState, Skeleton, StatusBadge, CategoryBadge } from '../../components/ui';
import { Bell, ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { formatDate, daysUntil, cn } from '../../utils/helpers';
import { ROUTES } from '../../constants';
import type { Eligibility } from '../../types';

// A deadline can come from an institution notice or from an entry the student
// added themselves; both belong on the same calendar.
type CalendarItem = {
  id: string;
  title: string;
  category: string;
  deadline: string;
  eligibility?: Eligibility;
  href: string;
};

function buildMonth(year: number, month: number, byDate: Map<string, CalendarItem[]>) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = first.getDay();
  const cells: Array<{ date: Date | null; deadlines: CalendarItem[] }> = [];

  for (let i = 0; i < startOffset; i++) cells.push({ date: null, deadlines: [] });
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    const key = date.toISOString().slice(0, 10);
    cells.push({ date, deadlines: byDate.get(key) ?? [] });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, deadlines: [] });
  return cells;
}

export function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar');

  const deadlinesQuery = useUpcomingDeadlines({ days: 90, limit: 50 });
  const personalQuery = usePersonalEntries({ limit: 100 });

  const deadlines = deadlinesQuery.data ?? [];

  const items = useMemo<CalendarItem[]>(() => {
    const fromNotices: CalendarItem[] = deadlines.flatMap((d) =>
      d.deadline
        ? [{ id: d.id, title: d.title, category: d.category, deadline: d.deadline, eligibility: d.eligibility, href: `/student/notices/${d.id}` }]
        : []
    );
    const fromOwnEntries: CalendarItem[] = (personalQuery.data ?? []).flatMap((entry) => {
      if (!entry.deadline) return [];
      const days = daysUntil(new Date(entry.deadline));
      if (days < 0 || days > 90) return [];
      return [{
        id: entry.id,
        title: entry.title,
        category: entry.category,
        deadline: entry.deadline,
        eligibility: entry.eligibility,
        href: ROUTES.STUDENT_MY_NOTICES,
      }];
    });
    return [...fromNotices, ...fromOwnEntries];
  }, [deadlines, personalQuery.data]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const d of items) {
      const key = new Date(d.deadline).toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(d);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const cells = useMemo(() => buildMonth(cursor.year, cursor.month, byDate), [cursor, byDate]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }));
  const nextMonth = () => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }));
  const goToday = () => setCursor({ year: today.getFullYear(), month: today.getMonth() });

  const agenda = useMemo(
    () => [...items].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [items]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">Deadlines & Calendar</h1>
          <p className="text-body text-text-muted mt-1">Every deadline in the next 90 days, from published notices and the entries you added.</p>
        </div>
        <div className="flex rounded-sm border border-border overflow-hidden w-fit" role="group" aria-label="Calendar view mode">
          <button onClick={() => setView('calendar')} className={cn('px-4 py-2 text-body-sm font-medium', view === 'calendar' ? 'bg-accent text-loud-ink' : 'bg-bg-elevated text-text-muted hover:text-text')} aria-pressed={view === 'calendar'}>Calendar</button>
          <button onClick={() => setView('agenda')} className={cn('px-4 py-2 text-body-sm font-medium', view === 'agenda' ? 'bg-accent text-loud-ink' : 'bg-bg-elevated text-text-muted hover:text-text')} aria-pressed={view === 'agenda'}>Agenda</button>
        </div>
      </header>

      {/* Reminder explainer */}
      <section className="bg-bg-elevated border border-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" aria-label="Reminder schedule">
        <div className="flex items-center gap-2 text-body-sm font-medium text-text flex-shrink-0">
          <Bell className="w-4 h-4 text-accent" aria-hidden="true" /> Automatic reminders
        </div>
        <span className="text-body-sm text-text-muted">
          Oppora reminds you <strong className="text-text">7 days</strong>, <strong className="text-text">3 days</strong> and <strong className="text-text">1 day</strong> before each deadline for notices you are eligible or possibly eligible for. Reminders are sent automatically by the system and cannot currently be customised.
        </span>
      </section>

      {deadlinesQuery.isError ? (
        <ErrorState title="Could not load deadlines" action={{ label: 'Retry', onClick: () => deadlinesQuery.refetch() }} />
      ) : deadlinesQuery.isLoading || personalQuery.isLoading ? (
        <div className="bg-bg-elevated border border-border rounded-lg p-6">
          <div className="h-6 w-48 bg-border/40 rounded skeleton-shimmer mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} height={80} />)}
          </div>
        </div>
      ) : agenda.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12" />}
          title="No upcoming deadlines"
          description="When published notices get close to their deadlines, they'll appear here."
          action={{ label: 'Browse Notices', onClick: () => (window.location.href = '/student/notices') }}
        />
      ) : view === 'calendar' ? (
        <section className="bg-bg-elevated border border-border rounded-lg p-4" aria-label="Deadline calendar">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h4 font-semibold text-text">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover" aria-label="Previous month"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={goToday} className="px-3 py-1.5 rounded-sm border border-border text-body-sm font-medium text-text hover:bg-bg-hover">Today</button>
              <button onClick={nextMonth} className="p-2 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover" aria-label="Next month"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={monthLabel}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1.5 text-[10px] font-medium text-text-muted uppercase sm:py-2 sm:text-caption" role="columnheader">{d}</div>
            ))}
            {cells.map((cell, i) => {
              const isToday = cell.date && cell.date.toDateString() === today.toDateString();
              const inMonth = !!cell.date;
              return (
                <div
                  key={i}
                  role="gridcell"
                  aria-label={cell.date ? `${cell.date.getDate()} ${monthLabel}, ${cell.deadlines.length} deadlines` : undefined}
                  className={cn(
                    'min-h-[52px] p-1 rounded-sm border text-left sm:min-h-[80px] sm:p-1.5',
                    cell.date ? 'border-border bg-bg' : 'border-transparent',
                    isToday && 'border-accent ring-1 ring-accent',
                    cell.deadlines.length > 0 && 'bg-warning-soft/40',
                    !inMonth && 'opacity-0 pointer-events-none'
                  )}
                >
                  {cell.date && <span className={cn('text-caption', isToday ? 'font-bold text-accent' : 'text-text-muted')}>{cell.date.getDate()}</span>}
                  {/* Phones have no room for titles inside a 7-column grid — show a marker instead. */}
                  {cell.deadlines.length > 0 && (
                    <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-accent sm:hidden" aria-hidden="true" />
                  )}
                  <div className="mt-1 hidden space-y-1 sm:block">
                    {cell.deadlines.slice(0, 2).map((dl) => (
                      <Link
                        key={dl.id}
                        to={dl.href}
                        className="block px-1.5 py-0.5 rounded-sm bg-accent-soft hover:bg-accent hover:text-text-inverted text-caption text-accent truncate transition-colors"
                        title={dl.title}
                      >
                        {dl.title}
                      </Link>
                    ))}
                    {cell.deadlines.length > 2 && (
                      <span className="block text-caption text-text-muted px-1">+{cell.deadlines.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section aria-label="Deadline agenda">
          <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {agenda.map((item) => {
              const d = daysUntil(new Date(item.deadline));
              return (
                <li key={item.id}>
                  <Link to={item.href} className="flex items-center gap-4 px-4 py-3.5 hover:bg-bg-hover transition-colors">
                    <span className={cn(
                      'flex-shrink-0 w-14 text-center rounded-md py-1.5',
                      d <= 3 ? 'bg-danger-soft text-danger' : d <= 7 ? 'bg-warning-soft text-warning' : 'bg-info-soft text-info'
                    )}>
                      <span className="block text-body-sm font-bold">{d}</span>
                      <span className="block text-caption">days</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-text truncate">{item.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={item.category} size="sm" dot={false} />
                        {item.eligibility && <StatusBadge status={item.eligibility.status} type="eligibility" size="sm" />}
                        <span className="text-caption text-text-muted inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {formatDate(item.deadline)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}