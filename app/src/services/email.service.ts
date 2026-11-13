import api from "./api";
import type {
  EmailAnnouncement,
  EmailAnnouncementQuery,
  PaginatedEmailAnnouncements,
  GmailConnectStatus,
  SyncResult
} from "../types/email";

export const emailService = {
  // ---- Gmail connection ----

  async getGmailAuthUrl(): Promise<{ authUrl: string; state: string }> {
    return api.get<{ authUrl: string; state: string }>("/email/gmail/auth-url");
  },

  async getGmailStatus(): Promise<GmailConnectStatus> {
    return api.get<GmailConnectStatus>("/email/gmail/status");
  },

  async disconnectGmail(): Promise<{ message: string }> {
    return api.delete<{ message: string }>("/email/gmail/disconnect");
  },

  // ---- Sync ----

  async syncGmail(params?: {
    fullSync?: boolean;
    maxResults?: number;
  }): Promise<SyncResult> {
    return api.post<SyncResult>("/email/gmail/sync", params);
  },

  // ---- Announcements ----

  async getAnnouncements(params?: EmailAnnouncementQuery): Promise<PaginatedEmailAnnouncements> {
    return api.get<PaginatedEmailAnnouncements>("/email/announcements", params);
  },

  async getAnnouncement(id: string): Promise<EmailAnnouncement> {
    return api.get<EmailAnnouncement>(`/email/announcements/${id}`);
  },

  async toggleBookmark(id: string): Promise<EmailAnnouncement> {
    return api.patch<EmailAnnouncement>(`/email/announcements/${id}/bookmark`);
  },

  async markRead(id: string): Promise<EmailAnnouncement> {
    return api.patch<EmailAnnouncement>(`/email/announcements/${id}/read`);
  },

  async dismiss(id: string): Promise<EmailAnnouncement> {
    return api.patch<EmailAnnouncement>(`/email/announcements/${id}/dismiss`);
  },

  async getUnreadCount(): Promise<{ unread: number }> {
    return api.get<{ unread: number }>("/email/announcements/unread-count");
  }
};

export default emailService;
