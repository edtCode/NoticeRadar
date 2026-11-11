import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/admin.service';
import type { Notice, CreateNoticePayload, Paginated, ProcessResult, ExtractionWorkspace, ReviewPayload, UploadedFileInfo, ExtractionStatus } from '../types';

export function useAdminNotices(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  category?: string;
}) {
  return useQuery<Paginated<Notice>>({
    queryKey: ['admin', 'notices', params],
    queryFn: () => adminService.getNotices(params),
    staleTime: 30000,
  });
}

export function useAdminNotice(id: string) {
  return useQuery<Notice>({
    queryKey: ['admin', 'notices', id],
    queryFn: () => adminService.getNotice(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNoticePayload) => adminService.createNotice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateNoticePayload> }) =>
      adminService.updateNotice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
    },
  });
}

export function usePublishNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.publishNotice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
    },
  });
}

export function useUploadNoticeFile() {
  return useMutation<UploadedFileInfo, Error, { noticeId: string; file: File; onProgress?: (progress: number) => void }>({
    mutationFn: ({ noticeId, file, onProgress }) => adminService.uploadFile(noticeId, file, onProgress),
  });
}

export function useProcessNotice() {
  const queryClient = useQueryClient();

  return useMutation<ProcessResult, Error, string>({
    mutationFn: (id) => adminService.processNotice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id, 'extraction'] });
    },
  });
}

export function useRetryProcessing() {
  const queryClient = useQueryClient();

  return useMutation<ProcessResult, Error, string>({
    mutationFn: (id) => adminService.retryProcessing(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id, 'extraction'] });
    },
  });
}

export function usePendingReview(params?: { page?: number; limit?: number }) {
  return useQuery<Paginated<Notice>>({
    queryKey: ['admin', 'notices', 'pending-review', params],
    queryFn: () => adminService.getPendingReview(params),
    staleTime: 30000,
  });
}

export function useExtractionWorkspace(id: string) {
  return useQuery<ExtractionWorkspace>({
    queryKey: ['admin', 'notices', id, 'extraction'],
    queryFn: () => adminService.getExtractionWorkspace(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useReviewNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewPayload }) => adminService.reviewNotice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id, 'extraction'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', 'pending-review'] });
    },
  });
}

export function useRejectNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote?: string }) => adminService.rejectNotice(id, reviewNote),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notices', 'pending-review'] });
    },
  });
}