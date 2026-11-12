import api from './api';
import type { PersonalEntry, PersonalEntryFileResult, PersonalEntryPayload } from '../types';

export const personalEntryService = {
  async list(params?: { upcoming?: number; limit?: number }): Promise<PersonalEntry[]> {
    return api.get<PersonalEntry[]>('/me/entries', params);
  },

  async create(payload: PersonalEntryPayload): Promise<PersonalEntry> {
    return api.post<PersonalEntry>('/me/entries', payload);
  },

  async update(id: string, payload: Partial<PersonalEntryPayload>): Promise<PersonalEntry> {
    return api.patch<PersonalEntry>(`/me/entries/${id}`, payload);
  },

  async remove(id: string): Promise<{ id: string }> {
    return api.delete<{ id: string }>(`/me/entries/${id}`);
  },

  async uploadFile(id: string, file: File, onProgress?: (progress: number) => void): Promise<PersonalEntryFileResult> {
    return api.upload<PersonalEntryFileResult>(`/me/entries/${id}/file`, file, onProgress);
  },

  async getFileUrl(id: string): Promise<{ signedUrl: string; expiresIn: number }> {
    return api.get<{ signedUrl: string; expiresIn: number }>(`/me/entries/${id}/file`);
  },
};

export default personalEntryService;
