// Application constants

export const APP_NAME = 'Oppora';
export const APP_DESCRIPTION = 'Never miss an important college notice again';

// Production builds must never point at localhost: a deployed site whose env
// var is missing (or left at a dev value) would send every request to the
// visitor's own machine.
const PRODUCTION_API_BASE_URL = 'https://noticeradar.onrender.com/api/v1';
const DEVELOPMENT_API_BASE_URL = 'http://localhost:4000/api/v1';
const DEFAULT_API_BASE_URL = import.meta.env.PROD ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL;

const RAW_API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const isLocalhostUrl = (url: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(url);

// Every API route is mounted under /api/v1. Accept a bare host
// ("https://api.example.com") and append the prefix, so a deployment can't
// silently send requests to "/auth/register" and get a 404 instead of an answer.
const withApiPrefix = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_BASE_URL;
  if (import.meta.env.PROD && isLocalhostUrl(trimmed)) return PRODUCTION_API_BASE_URL;
  return /\/api\/v\d+$/.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
};

export const API_BASE_URL = withApiPrefix(RAW_API_BASE_URL);
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const ROUTES = {
  // Public
  HOME: '/',
  FEATURES: '/features',
  HOW_IT_WORKS: '/how-it-works',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  // Student
  ONBOARDING: '/onboarding',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_NOTICES: '/student/notices',
  STUDENT_NOTICE_DETAIL: (id: string) => `/student/notices/${id}`,
  STUDENT_SAVED: '/student/saved',
  STUDENT_CALENDAR: '/student/calendar',
  STUDENT_SEARCH: '/student/search',
  STUDENT_NOTIFICATIONS: '/student/notifications',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_MY_NOTICES: '/student/my-notices',
  STUDENT_HELP: '/student/help',

  // Gmail / email intelligence
  STUDENT_GMAIL_CONNECT: '/student/gmail-connect',
  STUDENT_ANNOUNCEMENTS: '/student/announcements',
  STUDENT_ANNOUNCEMENT_DETAIL: (id: string) => `/student/announcements/${id}`,

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_NOTICES: '/admin/notices',
  ADMIN_UPLOAD: '/admin/notices/upload',
  ADMIN_CREATE: '/admin/notices/create',
  ADMIN_EDIT: (id: string) => `/admin/notices/${id}/edit`,
  ADMIN_PROCESSING: (id: string) => `/admin/notices/${id}/processing`,
  ADMIN_REVIEW_QUEUE: '/admin/review',
  ADMIN_REVIEW: (id: string) => `/admin/notices/${id}/review`,
  ADMIN_PUBLISH: (id: string) => `/admin/notices/${id}/publish`,

  // System
  ACCESS_DENIED: '/403',
  NOT_FOUND: '/404',
  SERVER_ERROR: '/500',
} as const;

export const NOTICE_CATEGORIES = [
  'PLACEMENT',
  'INTERNSHIP',
  'SCHOLARSHIP',
  'EXAM',
  'EVENT',
  'GENERAL',
] as const;

export const NOTICE_CATEGORY_LABELS: Record<string, string> = {
  PLACEMENT: 'Placement',
  INTERNSHIP: 'Internship',
  SCHOLARSHIP: 'Scholarship',
  EXAM: 'Examination',
  EVENT: 'Event',
  GENERAL: 'General',
};

export const NOTICE_CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PLACEMENT: { bg: 'var(--color-info-soft)', text: 'var(--color-info)', dot: 'var(--color-info)' },
  INTERNSHIP: { bg: 'var(--color-accent-soft)', text: 'var(--color-accent)', dot: 'var(--color-accent)' },
  SCHOLARSHIP: { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', dot: 'var(--color-warning)' },
  EXAM: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', dot: 'var(--color-danger)' },
  EVENT: { bg: 'var(--color-success-soft)', text: 'var(--color-success)', dot: 'var(--color-success)' },
  GENERAL: { bg: 'var(--color-border)', text: 'var(--color-text-muted)', dot: 'var(--color-text-muted)' },
};

export const NOTICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export const EXTRACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  OCR_REQUIRED: 'OCR Required',
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  NOT_REVIEWED: 'Not Reviewed',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const ELIGIBILITY_STATUS_LABELS: Record<string, string> = {
  ELIGIBLE: 'Eligible',
  NOT_ELIGIBLE: 'Not Eligible',
  POSSIBLY_ELIGIBLE: 'Possibly Eligible',
};

export const ELIGIBILITY_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  ELIGIBLE: { bg: 'var(--color-success-soft)', text: 'var(--color-success)', dot: 'var(--color-success)' },
  NOT_ELIGIBLE: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', dot: 'var(--color-danger)' },
  POSSIBLY_ELIGIBLE: { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', dot: 'var(--color-warning)' },
};

export const INTEREST_OPTIONS = [
  { value: 'internships', label: 'Internships' },
  { value: 'placements', label: 'Placements' },
  { value: 'scholarships', label: 'Scholarships' },
  { value: 'research', label: 'Research' },
  { value: 'technical', label: 'Technical Opportunities' },
  { value: 'academic', label: 'Academic Announcements' },
  { value: 'events', label: 'Events' },
] as const;

export const REQUIRED_DOCUMENTS_OPTIONS = [
  { value: 'resume', label: 'Resume/CV' },
  { value: 'transcript', label: 'Academic Transcript' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'recommendation', label: 'Recommendation Letter' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'id_proof', label: 'Identity Proof' },
  { value: 'caste_certificate', label: 'Caste Certificate' },
  { value: 'income_certificate', label: 'Income Certificate' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'other', label: 'Other' },
] as const;

export const BRANCH_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical',
  'Civil',
  'Chemical',
  'Biotechnology',
  'Aerospace',
  'Other',
] as const;

export const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

export const GRADUATION_YEAR_RANGE = {
  min: new Date().getFullYear(),
  max: new Date().getFullYear() + 6,
};

export const CPI_RANGE = { min: 0, max: 10, step: 0.01 };

export const BACKLOGS_RANGE = { min: 0, max: 20 };

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['application/pdf'],
  ACCEPTED_EXTENSIONS: ['.pdf'],
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

export const DEBOUNCE_DELAY = 300;

export const TOAST_DURATION = 5000;

export const NOTIFICATION_TYPES = {
  DEADLINE_REMINDER_7: 'deadline_reminder_7',
  DEADLINE_REMINDER_3: 'deadline_reminder_3',
  DEADLINE_REMINDER_1: 'deadline_reminder_1',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'noticeradar_auth_token',
  REFRESH_TOKEN: 'noticeradar_refresh_token',
  USER_PREFERENCES: 'noticeradar_preferences',
  SIDEBAR_COLLAPSED: 'noticeradar_sidebar_collapsed',
  THEME: 'noticeradar_theme',
} as const;