import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, StatusBadge, ErrorState, Skeleton } from '../../components/ui';
import { useProcessNotice, useRetryProcessing } from '../../hooks/useAdminService';
import { useAddToast } from '../../stores/uiStore';
import { CheckCircle2, Circle, Loader2, AlertTriangle, Clock, FileText, ScanLine, HelpCircle, ChevronLeft } from 'lucide-react';
import { cn, formatDate } from '../../utils/helpers';
import type { ExtractionStatus } from '../../types';

const TIMELINE_STEPS = [
  { label: 'PDF uploaded', key: 'uploaded' },
  { label: 'PDF text extraction', key: 'text' },
  { label: 'AI information extraction', key: 'ai' },
  { label: 'Structured data validation', key: 'validation' },
  { label: 'Awaiting admin review', key: 'review' },
] as const;

export function AdminProcessingPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const [pollPaused, setPollPaused] = useState(false);

  const addToast = useAddToast();
  const processMutation = useProcessNotice();
  const retryMutation = useRetryProcessing();

  const noticeQuery = useQuery({
    queryKey: ['admin', 'notices', noticeId],
    queryFn: () => adminService.getNotice(noticeId!),
    enabled: !!noticeId,
    refetchInterval: pollPaused ? false : 5000,
  });

  const notice = noticeQuery.data;
  const status: ExtractionStatus | undefined = notice?.extraction_status;

  // Auto-pause polling once it's in a terminal state
  useEffect(() => {
    if (status && status !== 'PROCESSING' && status !== 'PENDING') setPollPaused(true);
  }, [status]);

  if (!noticeId) return <ErrorState title="Notice not found" />;
  if (noticeQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height={32} width={280} />
        <div className="bg-bg-elevated border border-border rounded-lg p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} />)}
        </div>
      </div>
    );
  }
  if (noticeQuery.isError || !notice) {
    return <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load the notice" action={{ label: 'Retry', onClick: () => noticeQuery.refetch() }} />;
  }

  const stepIndex = (() => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PROCESSING': return 2;
      case 'COMPLETED': return 5;
      case 'FAILED': return 2;
      case 'OCR_REQUIRED': return 1;
      default: return 0;
    }
  })();

  const startProcess = () => {
    if (status === 'FAILED' || status === 'OCR_REQUIRED') {
      retryMutation.mutate(noticeId, {
        onSuccess: () => { setPollPaused(false); addToast({ type: 'info', title: 'Reprocessing started' }); },
        onError: (e) => addToast({ type: 'error', title: 'Retry failed', message: e.message }),
      });
    } else {
      processMutation.mutate(noticeId, {
        onSuccess: () => { setPollPaused(false); addToast({ type: 'info', title: 'Processing started' }); },
        onError: (e) => addToast({ type: 'error', title: 'Could not start processing', message: e.message }),
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/admin/notices" className="inline-flex items-center gap-1 text-body-sm text-text-muted hover:text-text">
        <ChevronLeft className="w-4 h-4" /> All notices
      </Link>

      <PageHeader
        title="AI Processing"
        description={notice.title}
        actions={<StatusBadge status={status ?? 'PENDING'} type="extraction" size="md" />}
      />

      {/* Timeline */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-h4 font-semibold text-text mb-6">Processing timeline</h2>
        <ol className="space-y-1">
          {TIMELINE_STEPS.map((step, i) => {
            const isDone = i + 1 < stepIndex;
            const isCurrent = i + 1 === stepIndex && !(status === 'FAILED' && i === 2);
            const isError = status === 'FAILED' && i === 2 && step.key === 'ai';

            return (
              <li key={step.key} className="flex items-start gap-4 relative">
                {i < TIMELINE_STEPS.length - 1 && (
                  <span className={cn('absolute left-[15px] top-8 w-0.5 h-8', isDone ? 'bg-success' : 'bg-border')} aria-hidden="true" />
                )}
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                    isError ? 'bg-danger-soft text-danger' : isDone ? 'bg-success text-text-inverted' : isCurrent ? 'bg-accent text-loud-ink animate-pulse-soft' : 'bg-bg text-text-muted'
                  )}
                >
                  {isError ? (
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  ) : isCurrent ? (
                    (status === 'PROCESSING')
                      ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      : <Clock className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Circle className="w-3 h-3" aria-hidden="true" />
                  )}
                </span>
                <div className="pb-6">
                  <p className={cn('text-body font-medium', isDone || isCurrent || isError ? 'text-text' : 'text-text-muted')}>{step.label}</p>
                  {isError && (notice.extraction_error ?? null) && (
                    <p className="mt-1 text-body-sm text-danger">{notice.extraction_error}</p>
                  )}
                  {status === 'OCR_REQUIRED' && i === 0 && (
                    <p className="mt-1 text-body-sm text-warning">This PDF looks like a scan. OCR ran on the image-only pages but could not read usable text — check that the scan is clear and upright, then retry.</p>
                  )}
                  {status === 'COMPLETED' && i === 4 && (
                    <p className="mt-1 text-body-sm text-success">Extraction complete — the notice is ready for your review.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {(status === 'PENDING' || status === 'PROCESSING') && (
          <p className="flex items-center gap-2 text-caption text-text-muted pt-2" role="status">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> This page checks for updates every few seconds.
          </p>
        )}
      </section>

      {/* Error detail */}
      {status === 'FAILED' && notice.extraction_error && (
        <div className="bg-danger-soft border border-danger rounded-lg p-4 flex items-start gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-danger">Extraction failed</p>
            <p className="text-body-sm text-text mt-1">{notice.extraction_error}</p>
            {notice.extracted_at && <p className="text-caption text-text-muted mt-1">Attempt ended {formatDate(notice.extracted_at)}</p>}
          </div>
        </div>
      )}

      {/* OCR warning */}
      {status === 'OCR_REQUIRED' && (
        <div className="bg-warning-soft border border-warning rounded-lg p-4 flex items-start gap-3" role="alert">
          <ScanLine className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-warning">Scanned PDF — text could not be read</p>
            <p className="text-body-sm text-text mt-1">
              The extraction found no readable text layer, and OCR could not read the scanned pages either. Check that the scan is clear and upright, then retry. You can also open the original PDF and confirm the pages are not blank.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <section className="flex flex-wrap gap-3">
        {status === 'COMPLETED' ? (
          <>
            <Link to={`/admin/notices/${noticeId}/review`} className="btn-primary h-10 px-4 inline-flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Open Review
            </Link>
            <Button variant="secondary" onClick={() => adminService.getNoticeFile(noticeId).then((r) => window.open(r.signedUrl, '_blank', 'noopener'))}>
              <FileText className="w-4 h-4" /> View Original PDF
            </Button>
            <Link to={`/admin/notices/${noticeId}/edit`} className="btn-secondary h-10 px-4 inline-flex items-center">Edit Notice</Link>
          </>
        ) : (
          <>
            <Button onClick={startProcess} loading={processMutation.isPending || retryMutation.isPending} disabled={status === 'PROCESSING'}>
              {status === 'FAILED' || status === 'OCR_REQUIRED' ? 'Retry Failed Processing' : 'Process Notice'}
            </Button>
            <Button variant="secondary" onClick={() => adminService.getNoticeFile(noticeId).then((r) => window.open(r.signedUrl, '_blank', 'noopener'))}>
              <FileText className="w-4 h-4" /> View Original PDF
            </Button>
          </>
        )}
      </section>
    </div>
  );
}