import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ApiErrorPayload } from '../types';
import { API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '../constants';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private supabaseAuth: SupabaseClient | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach access token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401, refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorPayload>) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

        if (error.response?.data?.error) {
          error.message = error.response.data.error;
        }

        const isAuthSubmission = originalRequest?.url === '/auth/login' || originalRequest?.url === '/auth/register';
        if (error.response?.status === 401 && originalRequest && !isAuthSubmission && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch {
            // Refresh failed - clear auth and redirect to login
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('noticeradar_access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('noticeradar_refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('noticeradar_access_token', accessToken);
    localStorage.setItem('noticeradar_refresh_token', refreshToken);
  }

  private clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('noticeradar_access_token');
    localStorage.removeItem('noticeradar_refresh_token');
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error('Supabase authentication is not configured. Please sign in again.');
        }

        this.supabaseAuth ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });

        const { data, error } = await this.supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
        if (error) throw error;
        if (!data.session) throw new Error('The session could not be refreshed. Please sign in again.');

        this.setTokens(data.session.access_token, data.session.refresh_token);
        return data.session.access_token;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Public methods for auth flow
  setAuthTokens(accessToken: string, refreshToken: string): void {
    this.setTokens(accessToken, refreshToken);
  }

  clearAuthTokens(): void {
    this.clearAuth();
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  private unwrap<T>(body: unknown): T {
    if (typeof body === 'object' && body !== null && 'data' in body && !('pagination' in body)) {
      return body.data as T;
    }
    return body as T;
  }

  // Convenience methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return this.unwrap<T>(response.data);
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return this.unwrap<T>(response.data);
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return this.unwrap<T>(response.data);
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return this.unwrap<T>(response.data);
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return this.unwrap<T>(response.data);
  }

  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
    return this.unwrap<T>(response.data);
  }

  async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new ApiClient();
export default api;