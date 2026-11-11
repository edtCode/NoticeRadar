import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import noticeService from '../services/notice.service';
import type { Notice, NoticeQuery, FeedQuery, Eligibility, Paginated, SavedNoticeRow } from '../types';

export function useNotices(params?: NoticeQuery) {
  return useQuery<Paginated<Notice>>({
    queryKey: ['notices', params],
    queryFn: () => noticeService.getNotices(params),
    staleTime: 30000,
  });
}

export function useNotice(id: string) {
  return useQuery<Notice>({
    queryKey: ['notices', id],
    queryFn: () => noticeService.getNotice(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useNoticeFile(id: string) {
  return useQuery<{ signedUrl: string; fileName?: string; expiresIn: number }>({
    queryKey: ['notices', id, 'file'],
    queryFn: () => noticeService.getNoticeFile(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useFeed(params?: FeedQuery) {
  return useQuery<Paginated<Notice>>({
    queryKey: ['notices', 'feed', params],
    queryFn: () => noticeService.getFeed(params),
    staleTime: 30000,
  });
}

export function useSearchNotices(params?: NoticeQuery) {
  return useQuery<Paginated<Notice>>({
    queryKey: ['notices', 'search', params],
    queryFn: () => noticeService.searchNotices(params),
    staleTime: 30000,
  });
}

export function useEligibility(noticeId: string) {
  return useQuery<Eligibility>({
    queryKey: ['notices', noticeId, 'eligibility'],
    queryFn: () => noticeService.getEligibility(noticeId),
    enabled: !!noticeId,
    staleTime: 60000,
  });
}

export function useSaveNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noticeId: string) => noticeService.saveNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['notices', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
}

export function useUnsaveNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noticeId: string) => noticeService.unsaveNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['notices', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
}

export function useSavedNotices(params?: { page?: number; limit?: number }) {
  return useQuery<Paginated<SavedNoticeRow>>({
    queryKey: ['notices', 'saved', params],
    queryFn: () => noticeService.getSavedNotices(params),
    staleTime: 30000,
  });
}

export function useToggleSave(noticeId: string, currentlySaved: boolean) {
  const saveMutation = useSaveNotice();
  const unsaveMutation = useUnsaveNotice();

  const toggle = () => {
    if (currentlySaved) {
      unsaveMutation.mutate(noticeId);
    } else {
      saveMutation.mutate(noticeId);
    }
  };

  return {
    toggle,
    isPending: saveMutation.isPending || unsaveMutation.isPending,
    isSaved: currentlySaved,
  };
}