import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import type {
  StudentProfileResponse,
  StudentProfilePayload,
  StudentProfileUpdatePayload,
  Institution,
  Department,
  InstitutionSearchResult,
  InstitutionRequestPayload,
  InstitutionRequestRecord,
} from '../types';

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useRegister() {
  const { register } = useAuthStore();

  return useMutation({
    mutationFn: ({ name, email, password, institutionId }: { name: string; email: string; password: string; institutionId?: string }) =>
      register(name, email, password, institutionId),
  });
}

export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
  });
}

export function useStudentProfile() {
  return useQuery<StudentProfileResponse>({
    queryKey: ['students', 'profile'],
    queryFn: () => authService.getStudentProfile(),
    staleTime: 60000,
  });
}

export function useCreateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StudentProfilePayload) => authService.createStudentProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StudentProfileUpdatePayload) => authService.updateStudentProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', 'profile'] });
    },
  });
}

export function useInstitutions() {
  return useQuery<Institution[]>({
    queryKey: ['institutions'],
    queryFn: () => authService.getInstitutions(),
    staleTime: 300000, // 5 minutes
  });
}

export function useInstitutionSearch(query: string, enabled = true) {
  return useQuery<InstitutionSearchResult[]>({
    queryKey: ['institutions', 'search', query],
    queryFn: () => authService.searchInstitutions(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60000,
    retry: 1,
  });
}

export function useRequestInstitution() {
  return useMutation<InstitutionRequestRecord, Error, InstitutionRequestPayload>({
    mutationFn: (payload: InstitutionRequestPayload) => authService.requestInstitution(payload),
  });
}

export function useDepartments(institutionId: string) {
  return useQuery<Department[]>({
    queryKey: ['institutions', institutionId, 'departments'],
    queryFn: () => authService.getDepartments(institutionId),
    enabled: !!institutionId,
    staleTime: 300000,
  });
}