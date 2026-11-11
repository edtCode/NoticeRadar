import type {
  UserRole,
  NoticeCategory,
  NoticeStatus,
  ExtractionStatus,
  ReviewStatus,
  EligibilityStatus,
  AuthUser,
  SessionTokens,
  LoginResponse,
  RegisterResponse,
  Institution,
  Department,
  StudentProfileRecord,
  StudentProfileResponse,
  StudentProfilePayload,
  StudentProfileUpdatePayload,
  Pagination,
  Paginated,
  Eligibility,
  ExtractionEvidence,
  Notice,
  NoticeQuery,
  FeedQuery,
  SavedNoticeRow,
  SavedNotice,
  NoticeSummaryRow,
  UpcomingDeadline,
  AppNotification,
  ProcessingLog,
  ExtractedNotice,
  ExtractionWorkspace,
  ReviewPayload,
  CreateNoticePayload,
  UploadedFileInfo,
  FileLink,
  ProcessResult,
  ApiErrorPayload,
  NoticeFiltersState,
} from './index';

// Re-export all types for convenience
export type {
  UserRole,
  NoticeCategory,
  NoticeStatus,
  ExtractionStatus,
  ReviewStatus,
  EligibilityStatus,
  AuthUser,
  SessionTokens,
  LoginResponse,
  RegisterResponse,
  Institution,
  Department,
  StudentProfileRecord,
  StudentProfileResponse,
  StudentProfilePayload,
  StudentProfileUpdatePayload,
  Pagination,
  Paginated,
  Eligibility,
  ExtractionEvidence,
  Notice,
  NoticeQuery,
  FeedQuery,
  SavedNoticeRow,
  SavedNotice,
  NoticeSummaryRow,
  UpcomingDeadline,
  AppNotification,
  ProcessingLog,
  ExtractedNotice,
  ExtractionWorkspace,
  ReviewPayload,
  CreateNoticePayload,
  UploadedFileInfo,
  FileLink,
  ProcessResult,
  ApiErrorPayload,
  NoticeFiltersState,
};

// Additional UI-specific types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'secondary';
  loading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showTotal?: boolean;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export type { Toast as ToastType };