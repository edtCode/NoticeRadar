import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailService } from '../services/email.service';
import type { EmailAnnouncementQuery, EmailAnnouncement } from '../types/email';

export function useGmailStatus() {
  return useQuery({
    queryKey: ['email', 'gmail', 'status'],
    queryFn: () => emailService.getGmailStatus(),
    staleTime: 60_000
  });
}

export function useSyncGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: { fullSync?: boolean; maxResults?: number }) =>
      emailService.syncGmail(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['email', 'gmail', 'status'] });
    }
  });
}

export function useAnnouncements(params?: EmailAnnouncementQuery) {
  return useQuery({
    queryKey: ['email', 'announcements', params],
    queryFn: () => emailService.getAnnouncements(params),
    staleTime: 60_000,
    placeholderData: (previous) => previous
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['email', 'announcements', id],
    queryFn: () => emailService.getAnnouncement(id),
    enabled: !!id,
    staleTime: 60_000
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['email', 'announcements', 'unread-count'],
    queryFn: () => emailService.getUnreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000
  });
}

export function useBookmarkAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emailService.toggleBookmark(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['email', 'announcements'] });
      const previous = queryClient.getQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements']
      );

      queryClient.setQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((a) =>
              a.id === id ? { ...a, is_bookmarked: !a.is_bookmarked } : a
            )
          };
        }
      );

      return { previous };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['email', 'announcements'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['email', 'announcements'] });
    }
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emailService.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['email', 'announcements'] });
      const previous = queryClient.getQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements']
      );

      queryClient.setQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((a) =>
              a.id === id ? { ...a, is_read: true } : a
            )
          };
        }
      );

      return { previous };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['email', 'announcements'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['email', 'announcements'] });
    }
  });
}

export function useDismissAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emailService.dismiss(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['email', 'announcements'] });
      const previous = queryClient.getQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements']
      );

      queryClient.setQueryData<{ data: EmailAnnouncement[]; pagination: unknown }>(
        ['email', 'announcements'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((a) => a.id !== id)
          };
        }
      );

      return { previous };
    },
    onError: (_err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['email', 'announcements'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['email', 'announcements'] });
    }
  });
}
