import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { PageHeader, SectionHeader } from '../../components/common/PageHeader';
import { Button, StatusBadge, CategoryBadge, ErrorState, TableSkeleton, Skeleton, Table } from '../../components/ui';
import { Upload, FilePlus2, ClipboardList, FileText, AlertTriangle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useAuthStore } from '../../stores/authStore';
import { AnimatedNumber } from '../../components/motion';
import type { Notice } from '../../types';

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const recentQuery = useQuery({
    queryKey: ['admin', 'notices', { dashboard: true }],
    queryFn: () => adminService.getNotices({ page: 1, limit: 8 }),
    staleTime: 15_000,
  });

  const notices = recentQuery.data?.data ?? [];
  const pagination = recentQuery.data?.pagination;

  const draftCount = pagination?.total ? notices.filter((n) => n.status === 'DRAFT').length : null;
  const pendingReview = notices.filter((n) => n.review_status === 'PENDING_REVIEW' || n.review_status === 'NOT_REVIEWED').length;
  const failed = notices.filter((n) => n.extraction_status === 'FAILED' || n.extraction_status === 'OCR_REQUIRED').length;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description={`${today} · ${user ? 'Administrator' : ''}`}
        actions={
          <>
            <Link to="/admin/notices/upload" className="btn-primary h-10 px-4 inline-flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Notice
            </Link>
            <Link to="/admin/notices/create" className="btn-secondary h-10 px-4 inline-flex items-center gap-2">
              <FilePlus2 className="w-4 h-4" /> Create Manually
            </Link>
          </>
        }
      />

      {/* Statistics — only what this page's data honestly supports */}
      <section aria-label="Notice statistics">
        {recentQuery.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-signal p-5">
                <Skeleton height={12} width={100} className="mb-3" />
                <Skeleton height={28} width={64} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <StatCard icon={<FileText className="w-5 h-5" />} label="Notices (this page)" value={notices.length} tone="accent" />
            <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Awaiting review" value={pendingReview} tone="warning" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Failed / OCR needed" value={failed} tone="danger" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved" value={notices.filter((n) => n.review_status === 'APPROVED').length} tone="success" />
          </div>
        )}
        <p className="mt-2 text-caption text-text-muted">
          Counts are drawn from the most recent notices{pagination?.total ? ` of ${pagination.total} total` : ' currently loaded'} — a dedicated summary endpoint can widen them later. Navigate{' '}
          <Link to="/admin/notices" className="text-accent hover:underline">All Notices</Link> for complete management.
        </p>
      </section>

      {/* Recent notices */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-heading" className="text-h3 font-semibold text-text">Recent Notices</h2>
          <Link to="/admin/notices" className="text-body-sm text-accent hover:underline inline-flex items-center gap-1">
            All notices <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {recentQuery.isError ? (
          <ErrorState title="Could not load notices" action={{ label: 'Retry', onClick: () => recentQuery.refetch() }} />
        ) : recentQuery.isLoading ? (
          <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden"><TableSkeleton rows={5} columns={6} /></div>
        ) : notices.length === 0 ? (
          <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
            <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-h4 font-semibold text-text mb-1">No notices yet</h3>
            <p className="text-body-sm text-text-muted mb-4">Upload your first official PDF or create a notice manually to get the pipeline running.</p>
            <Link to="/admin/notices/upload" className="btn-primary">Upload Notice</Link>
          </div>
        ) : (
          <div className="bg-bg-elevated border border-border rounded-lg overflow-hidden">
            <Table
              columns={[
                {
                  key: 'title', header: 'Title', render: (n) => (
                    <div className="max-w-[280px]">
                      <p className="font-medium text-text truncate">{n.title}</p>
                      <p className="text-caption text-text-muted mt-0.5">{n.category}</p>
                    </div>
                  ),
                },
                { key: 'created', header: 'Created', render: (n) => <span className="text-body-sm text-text-muted">{formatDate(n.created_at)}</span> },
                { key: 'deadline', header: 'Deadline', render: (n) => <span className="text-body-sm text-text-muted">{n.deadline ? formatDate(n.deadline) : '—'}</span> },
                { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} type="notice" size="sm" /> },
                { key: 'extraction', header: 'Extraction', render: (n) => <StatusBadge status={n.extraction_status} type="extraction" size="sm" /> },
                { key: 'review', header: 'Review', render: (n) => <StatusBadge status={n.review_status} type="review" size="sm" /> },
                {
                  key: 'action', header: '', align: 'right', render: (n) => (
                    <Link to={`/admin/notices/${n.id}/edit`} className="btn-secondary btn-sm">View</Link>
                  ),
                },
              ]}
              data={notices}
              keyExtractor={(n) => n.id}
              hoverable
            />
          </div>
        )}
      </section>

      {/* Processing activity */}
      <section aria-labelledby="processing-heading">
        <SectionHeader title="Processing activity" description="Latest extraction states across recently uploaded PDFs." />
        {recentQuery.isLoading ? (
          <Skeleton height={120} />
        ) : (() => {
          const processing = notices.filter((n) => n.extraction_status === 'PROCESSING' || n.extraction_status === 'PENDING' || n.extraction_status === 'FAILED' || n.extraction_status === 'OCR_REQUIRED').slice(0, 4);
          if (processing.length === 0) {
            return (
              <div className="card-signal p-4 flex items-center gap-3 text-body-sm text-text-muted">
                <Clock className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                Nothing processing right now among the latest notices.
              </div>
            );
          }
          return (
            <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
              {processing.map((n: Notice) => (
                <li key={n.id} className="flex items-center gap-4 px-4 py-3">
                  <StatusBadge status={n.extraction_status} type="extraction" size="sm" />
                  <span className="min-w-0 flex-1 text-body-sm text-text truncate">{n.title}</span>
                  <Link to={`/admin/notices/${n.id}/processing`} className="btn-ghost btn-sm flex-shrink-0">Processing</Link>
                </li>
              ))}
            </ul>
          );
        })()}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'accent' | 'success' | 'warning' | 'danger' }) {
  const tones = {
    accent: 'bg-accent text-loud-ink',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div className="card-signal card-signal-hover p-5">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${tones[tone]}`} aria-hidden="true">{icon}</div>
      <p className="text-h2 font-semibold text-text">
        <AnimatedNumber value={value} placeholder="0" duration={800} />
      </p>
      <p className="text-body-sm text-text-muted">{label}</p>
    </div>
  );
}