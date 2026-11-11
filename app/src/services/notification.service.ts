import api from './api';
import type { AppNotification, Paginated } from '../types';

export const notificationService = {
  async getNotifications(params?: { page?: number; limit?: number }): Promise<Paginated<AppNotification>> {
    return api.get<Paginated<AppNotification>>('/notifications', params);
  },

  async markAsRead(id: string): Promise<AppNotification> {
    return api.patch<AppNotification>(`/notifications/${id}/read`);
  },

  async getUnreadCount(): Promise<{ unread: number }> {
    return api.get<{ unread: number }>('/notifications/unread-count');
  },
};

export default notificationService;