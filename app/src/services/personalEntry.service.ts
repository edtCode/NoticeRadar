import api from './api';
import type { Eligibility, PersonalEntry, PersonalEntryDraft, PersonalEntryFileResult, PersonalEntryPayload } from '../types';

export type PersonalEntryCriteria = {
  eligibleBranches: string[];
  minimumCPI: number | null;
  requiresNoBacklogs: boolean;
};

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

  // Reads a PDF (or pasted text) and returns the fields to prefill the form.
  async extractFromFile(file: File): Promise<PersonalEntryDraft> {
    return api.upload<PersonalEntryDraft>('/me/entries/extract', file);
  },

  async extractFromText(text: string): Promise<PersonalEntryDraft> {
    return api.post<PersonalEntryDraft>('/me/entries/extract', { text });
  },

  // Re-checks eligibility for criteria the student edited after extraction.
  async previewEligibility(criteria: PersonalEntryCriteria): Promise<Eligibility> {
    return api.post<Eligibility>('/me/entries/eligibility', criteria);
  },

  async getFileUrl(id: string): Promise<{ signedUrl: string; expiresIn: number }> {
    return api.get<{ signedUrl: string; expiresIn: number }>(`/me/entries/${id}/file`);
  },
};

export default personalEntryService;
