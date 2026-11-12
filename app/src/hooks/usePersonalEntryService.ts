import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import personalEntryService, { type PersonalEntryCriteria } from '../services/personalEntry.service';
import type { Eligibility, PersonalEntry, PersonalEntryDraft, PersonalEntryPayload } from '../types';

const ENTRIES_KEY = ['personal-entries'] as const;

export function usePersonalEntries(params?: { upcoming?: number; limit?: number }) {
  return useQuery<PersonalEntry[]>({
    queryKey: [...ENTRIES_KEY, params ?? {}],
    queryFn: () => personalEntryService.list(params),
    staleTime: 30_000,
  });
}

export function useCreatePersonalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PersonalEntryPayload) => personalEntryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}

export function useUpdatePersonalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PersonalEntryPayload> }) =>
      personalEntryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}

export function useDeletePersonalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personalEntryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}

export function useExtractPersonalEntryDraft() {
  return useMutation<PersonalEntryDraft, Error, { file: File } | { text: string }>({
    mutationFn: (source) =>
      'file' in source ? personalEntryService.extractFromFile(source.file) : personalEntryService.extractFromText(source.text),
  });
}

export function usePreviewPersonalEntryEligibility() {
  return useMutation<Eligibility, Error, PersonalEntryCriteria>({
    mutationFn: (criteria) => personalEntryService.previewEligibility(criteria),
  });
}

export function useUploadPersonalEntryFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file, onProgress }: { id: string; file: File; onProgress?: (progress: number) => void }) =>
      personalEntryService.uploadFile(id, file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}
