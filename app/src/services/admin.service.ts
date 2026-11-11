import api from './api';
import type {
  Notice,
  CreateNoticePayload,
  Paginated,
  ProcessResult,
  ExtractionWorkspace,
  ReviewPayload,
  UploadedFileInfo,
  ExtractionStatus,
} from '../types';

export const adminService = {
  // Notice management
  async getNotices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    category?: string;
  }): Promise<Paginated<Notice>> {
    return api.get<Paginated<Notice>>('/admin/notices', params);
  },

  async getNotice(id: string): Promise<Notice> {
    return api.get<Notice>(`/admin/notices/${id}`);
  },

  async createNotice(payload: CreateNoticePayload): Promise<Notice> {
    return api.post<Notice>('/admin/notices', payload);
  },

  async updateNotice(id: string, payload: Partial<CreateNoticePayload>): Promise<Notice> {
    return api.patch<Notice>(`/admin/notices/${id}`, payload);
  },

  async deleteNotice(id: string): Promise<void> {
    return api.delete<void>(`/admin/notices/${id}`);
  },

  async publishNotice(id: string): Promise<Notice> {
    return api.post<Notice>(`/admin/notices/${id}/publish`);
  },

  // File upload
  async uploadFile(noticeId: string, file: File, onProgress?: (progress: number) => void): Promise<UploadedFileInfo> {
    return api.upload<UploadedFileInfo>(`/admin/notices/${noticeId}/file`, file, onProgress);
  },

  async getNoticeFile(id: string): Promise<{ signedUrl: string; fileName?: string; expiresIn: number }> {
    return api.get<{ signedUrl: string; fileName?: string; expiresIn: number }>(`/admin/notices/${id}/file`);
  },

  // Processing
  async processNotice(id: string): Promise<ProcessResult> {
    return api.post<ProcessResult>(`/admin/notices/${id}/process`);
  },

  async retryProcessing(id: string): Promise<ProcessResult> {
    return api.post<ProcessResult>(`/admin/notices/${id}/retry`);
  },

  // Review queue
  async getPendingReview(params?: { page?: number; limit?: number }): Promise<Paginated<Notice>> {
    return api.get<Paginated<Notice>>('/admin/notices/pending-review', params);
  },

  // Extraction workspace
  async getExtractionWorkspace(id: string): Promise<ExtractionWorkspace> {
    return api.get<ExtractionWorkspace>(`/admin/notices/${id}/extraction`);
  },

  async reviewNotice(id: string, payload: ReviewPayload): Promise<Notice> {
    return api.patch<Notice>(`/admin/notices/${id}/review`, payload);
  },

  async rejectNotice(id: string, reviewNote?: string): Promise<Notice> {
    return api.post<Notice>(`/admin/notices/${id}/reject`, { reviewNote });
  },
};

export default adminService;