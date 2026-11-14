import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Bell, AlertTriangle, BellRing, ChevronRight, Info } from 'lucide-react';
import { notificationService } from '../../services/notification.service';
import { useMarkNotificationRead, useUnreadCount } from '../../hooks/useNotificationService';
import { Pagination, ErrorState, EmptyState, Skeleton, Badge } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { formatDateTime, formatRelativeTime, cn } from '../../utils/helpers';
import { PAGINATION } from '../../constants';
import type { AppNotification } from '../../types';

export function NotificationsPage() {
  const [searchParams] = useSearchParams();
  const pageFromUrl = Number(searchParams.get('page') ?? '1');
  const [page, setPage] = useState(pageFromUrl || 1);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const addToast = useAddToast();
  const markReadMutation = useMarkNotificationRead();
  const unreadQuery = useUnreadCount();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', { page, limit }],
    queryFn: () => notificationService.getNotifications({ page, limit }),
    placeholderData: keepPreviousData,
  });

  const notifications: AppNotification[] = notificationsQuery.data?.data ?? [];
  const unread = notifications.filter((n) => !n.read_at).length;

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id, {
      onError: () => addToast({ type: 'error', title: 'Could not mark as read', message: 'Try again.' }),
    });
  };

  const typeLabel = (type: string) => {
    if (type.includes('_7')) return '7-day reminder';
    if (type.includes('_3')) return '3-day reminder';
    if (type.includes('_1')) return '1-day reminder';
    return 'Reminder';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">Notifications</h1>
          <p className="text-body text-text-muted mt-1">
            {unread > 0 ? `${unread} unread of ${notifications.length} reminders on this page.` : 'Everything on this page has been read.'}
          </p>
        </div>
        {typeof unreadQuery.data?.unread === 'number' && unreadQuery.data.unread > 0 && (
          <Badge variant="danger" size="md" dot>
            {unreadQuery.data.unread} unread total
          </Badge>
        )}
      </header>

      <div className="flex items-start gap-2 p-3 bg-info-soft border border-info rounded-sm" role="note">
        <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-body-sm text-text-muted">
          These are deadline reminders generated automatically by the system — no custom reminder settings exist yet. Reminders arrive 7, 3 and 1 days before deadlines for notices you are eligible or possibly eligible for.
        </p>
      </div>

      {notificationsQuery.isError ? (
        <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load notifications" action={{ label: 'Retry', onClick: () => notificationsQuery.refetch() }} />
      ) : notificationsQuery.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={88} />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No notifications yet"
          description="Deadline reminders will appear here automatically as your deadlines approach."
        />
      ) : (
        <>
          <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {notifications.map((n) => {
              const isUnread = !n.read_at;
              return (
                <li
                  key={n.id}
                  className={cn('flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap sm:gap-4', isUnread && 'bg-accent-soft/30')}
                >
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isUnread ? 'bg-accent' : 'bg-border'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isUnread && <BellRing className="w-4 h-4 text-accent" aria-hidden="true" />}
                      <span className="text-body font-medium text-text">{n.title}</span>
                      <Badge variant="neutral" size="sm">{typeLabel(n.type)}</Badge>
                    </div>
                    <p className="text-body-sm text-text-muted">{n.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-caption text-text-muted">
                      <span>Received {n.created_at ? formatRelativeTime(n.created_at) : ''} · {n.created_at ? formatDateTime(n.created_at) : ''}</span>
                      {n.notice_id && (
                        <Link to={`/student/notices/${n.notice_id}`} className="inline-flex items-center gap-1 text-accent font-medium hover:underline">
                          Open notice <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markReadMutation.isPending}
                      className="btn-secondary btn-sm ml-auto flex-shrink-0 sm:ml-0"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {notificationsQuery.data?.pagination && notificationsQuery.data.pagination.total > limit && (
            <Pagination page={page} pageSize={limit} total={notificationsQuery.data.pagination.total} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}