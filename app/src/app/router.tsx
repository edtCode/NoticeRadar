import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui';
import { useStudentProfile } from '../hooks/useAuthService';

function RequireAuth({ roles }: { roles?: Array<'STUDENT' | 'ADMIN'> }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restored = useAuthStore((s) => s.sessionRestored);
  const location = useLocation();

  if (!restored) return <FullPageSpinner />;
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.ACCESS_DENIED} replace />;
  }
  return <Outlet />;
}

export function firstStudentProfileRecord(resp?: { student_profiles?: unknown } | null) {
  const sp = resp?.student_profiles;
  return Array.isArray(sp) ? sp[0] : (sp ?? null);
}

// Every student endpoint (feed, deadlines, saved notices) refuses to answer
// until the academic profile exists, so send new students to onboarding
// instead of showing empty pages full of request errors.
function RequireStudentProfile() {
  const profileQuery = useStudentProfile();

  if (profileQuery.isLoading) return <FullPageSpinner />;

  if (profileQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
        <div className="max-w-lg w-full">
          <ErrorState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Could not load your profile"
            message="Your academic profile drives the feed, so we need it before loading the dashboard."
            action={{ label: 'Retry', onClick: () => profileQuery.refetch() }}
          />
        </div>
      </div>
    );
  }

  if (!firstStudentProfileRecord(profileQuery.data)) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <Outlet />;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Spinner size="lg" />
    </div>
  );
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restored = useAuthStore((s) => s.sessionRestored);
  if (!restored) return <FullPageSpinner />;
  if (isAuthenticated && user?.role === 'ADMIN') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (isAuthenticated && user) return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
  return <Navigate to={ROUTES.LOGIN} replace />;
}

import { AccessDeniedPage, NotFoundPage, ServerErrorPage } from '../pages/public/SystemPages';
import { LandingPage } from '../pages/public/LandingPage';
import { FeaturesPage } from '../pages/public/FeaturesPage';
import { HowItWorksPage } from '../pages/public/HowItWorksPage';
import { PrivacyPolicyPage } from '../pages/public/PrivacyPolicyPage';
import { TermsPage } from '../pages/public/TermsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { OnboardingPage } from '../pages/auth/OnboardingPage';
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { AllNoticesPage } from '../pages/student/AllNoticesPage';
import { NoticeDetailPage } from '../pages/student/NoticeDetailPage';
import { SavedNoticesPage } from '../pages/student/SavedNoticesPage';
import { CalendarPage } from '../pages/student/CalendarPage';
import { SearchPage } from '../pages/student/SearchPage';
import { NotificationsPage } from '../pages/student/NotificationsPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { MyNoticesPage } from '../pages/student/MyNoticesPage';
import { HelpPage } from '../pages/student/HelpPage';
import { GmailConnectPage } from '../pages/student/GmailConnectPage';
import { AnnouncementsPage } from '../pages/student/AnnouncementsPage';
import { AnnouncementDetailPage } from '../pages/student/AnnouncementDetailPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminNoticesPage } from '../pages/admin/AdminNoticesPage';
import { AdminUploadPage } from '../pages/admin/AdminUploadPage';
import { AdminCreateNoticePage, AdminEditNoticePage } from '../pages/admin/AdminCreateNoticePage';
import { AdminProcessingPage } from '../pages/admin/AdminProcessingPage';
import { AdminReviewQueuePage } from '../pages/admin/AdminReviewQueuePage';
import { AdminReviewWorkspacePage } from '../pages/admin/AdminReviewWorkspacePage';
import { AdminPublishPage } from '../pages/admin/AdminPublishPage';
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { AdminLayout } from '../layouts/AdminLayout';

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Legacy path kept as a permanent redirect so old links keep working. */}
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected — any authenticated role */}
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/role" element={<RoleRedirect />} />
      </Route>

      {/* Student portal */}
      <Route element={<RequireAuth roles={['STUDENT']} />}>
        <Route element={<RequireStudentProfile />}>
          <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/notices" element={<AllNoticesPage />} />
          <Route path="/student/my-notices" element={<MyNoticesPage />} />
          <Route path="/student/notices/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/student/saved" element={<SavedNoticesPage />} />
          <Route path="/student/calendar" element={<CalendarPage />} />
          <Route path="/student/search" element={<SearchPage />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/help" element={<HelpPage />} />
          <Route path="/student/gmail-connect" element={<GmailConnectPage />} />
          <Route path="/student/announcements" element={<AnnouncementsPage />} />
          <Route path="/student/announcements/:id" element={<AnnouncementDetailPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admin portal */}
      <Route element={<RequireAuth roles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/notices" element={<AdminNoticesPage />} />
          <Route path="/admin/notices/upload" element={<AdminUploadPage />} />
          <Route path="/admin/notices/create" element={<AdminCreateNoticePage />} />
          <Route path="/admin/notices/:noticeId/edit" element={<AdminEditNoticePage />} />
          <Route path="/admin/notices/:noticeId/processing" element={<AdminProcessingPage />} />
          <Route path="/admin/review" element={<AdminReviewQueuePage />} />
          <Route path="/admin/notices/:noticeId/review" element={<AdminReviewWorkspacePage />} />
          <Route path="/admin/notices/:noticeId/publish" element={<AdminPublishPage />} />
        </Route>
      </Route>

      {/* System */}
      <Route path="/403" element={<AccessDeniedPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* Role-aware fallbacks */}
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}