import api from './api';
import type {
  Notice,
  NoticeQuery,
  FeedQuery,
  Paginated,
  Eligibility,
  SavedNoticeRow,
  UpcomingDeadline,
  NoticeFiltersState,
} from '../types';

export const noticeService = {
  // Public notices
  async getNotices(params?: NoticeQuery): Promise<Paginated<Notice>> {
    return api.get<Paginated<Notice>>('/notices', params as Record<string, unknown> | undefined);
  },

  async getNotice(id: string): Promise<Notice> {
    return api.get<Notice>(`/notices/${id}`);
  },

  async getNoticeFile(id: string): Promise<{ signedUrl: string; fileName?: string; expiresIn: number }> {
    return api.get<{ signedUrl: string; fileName?: string; expiresIn: number }>(`/notices/${id}/file`);
  },

  // Personalised feed
  async getFeed(params?: FeedQuery): Promise<Paginated<Notice>> {
    return api.get<Paginated<Notice>>('/notices/feed', params as Record<string, unknown> | undefined);
  },

  // Search
  async searchNotices(params?: NoticeQuery): Promise<Paginated<Notice>> {
    return api.get<Paginated<Notice>>('/notices/search', params as Record<string, unknown> | undefined);
  },

  // Eligibility
  async getEligibility(noticeId: string): Promise<Eligibility> {
    const result = await api.get<{ noticeId: string; eligibility: Eligibility }>(`/notices/${noticeId}/eligibility`);
    return result.eligibility;
  },

  // Saved notices
  async saveNotice(noticeId: string): Promise<{ id: string; notice_id: string; created_at: string }> {
    return api.post<{ id: string; notice_id: string; created_at: string }>(`/notices/${noticeId}/save`);
  },

  async unsaveNotice(noticeId: string): Promise<void> {
    return api.delete<void>(`/notices/${noticeId}/save`);
  },

  async getSavedNotices(params?: { page?: number; limit?: number }): Promise<Paginated<SavedNoticeRow>> {
    return api.get<Paginated<SavedNoticeRow>>('/notices/saved', params);
  },
};

export default noticeService;