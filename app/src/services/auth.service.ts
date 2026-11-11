import api from './api';
import type {
  LoginResponse,
  RegisterResponse,
  AuthUser,
  StudentProfileResponse,
  StudentProfileRecord,
  StudentProfilePayload,
  StudentProfileUpdatePayload,
  Institution,
  Department,
} from '../types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', { email, password });
  },

  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    return api.post<RegisterResponse>('/auth/register', { name, email, password });
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    api.clearAuthTokens();
  },

  async getMe(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/me');
  },

  // Student profile
  async getStudentProfile(): Promise<StudentProfileResponse> {
    return api.get<StudentProfileResponse>('/students/profile');
  },

  async createStudentProfile(payload: StudentProfilePayload): Promise<StudentProfileRecord> {
    return api.post<StudentProfileRecord>('/students/profile', payload);
  },

  async updateStudentProfile(payload: StudentProfileUpdatePayload): Promise<StudentProfileResponse> {
    return api.patch<StudentProfileResponse>('/students/profile', payload);
  },

  // Institutions & Departments (for onboarding)
  async getInstitutions(): Promise<Institution[]> {
    return api.get<Institution[]>('/institutions');
  },

  async getDepartments(institutionId: string): Promise<Department[]> {
    return api.get<Department[]>(`/institutions/${institutionId}/departments`);
  },
};

export default authService;