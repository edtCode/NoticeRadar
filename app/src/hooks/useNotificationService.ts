import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notification.service';
import type { AppNotification, Paginated } from '../types';

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery<Paginated<AppNotification>>({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 30000,
  });
}

export function useUnreadCount() {
  return useQuery<{ unread: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<AppNotification, Error, string>({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useNotificationService() {
  const { data: unreadData } = useUnreadCount();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const refetchUnreadCount = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  };

  return {
    unreadCount: unreadData?.unread ?? 0,
    markAsRead,
    refetchUnreadCount,
  };
}