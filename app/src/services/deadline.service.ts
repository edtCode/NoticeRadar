import api from './api';
import type { UpcomingDeadline } from '../types';

export const deadlineService = {
  async getUpcomingDeadlines(params?: { days?: number; limit?: number }): Promise<UpcomingDeadline[]> {
    return api.get<UpcomingDeadline[]>('/deadlines/upcoming', params);
  },
};

export default deadlineService;