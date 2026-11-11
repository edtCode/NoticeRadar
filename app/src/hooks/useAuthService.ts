import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import type { StudentProfileResponse, StudentProfilePayload, StudentProfileUpdatePayload, Institution, Department } from '../types';

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
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
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

export function useDepartments(institutionId: string) {
  return useQuery<Department[]>({
    queryKey: ['institutions', institutionId, 'departments'],
    queryFn: () => authService.getDepartments(institutionId),
    enabled: !!institutionId,
    staleTime: 300000,
  });
}