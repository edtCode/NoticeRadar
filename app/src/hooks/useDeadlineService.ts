import { useQuery } from '@tanstack/react-query';
import deadlineService from '../services/deadline.service';
import type { UpcomingDeadline } from '../types';

export function useUpcomingDeadlines(params?: { days?: number; page?: number; limit?: number }) {
  return useQuery<UpcomingDeadline[]>({
    queryKey: ['deadlines', 'upcoming', params],
    queryFn: () => deadlineService.getUpcomingDeadlines(params),
    staleTime: 60000,
  });
}