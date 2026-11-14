import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, BookmarkCheck, ExternalLink, FileText, Calendar, GraduationCap,
  ClipboardList, ImageIcon, Clock, ChevronLeft, Download, BookOpenCheck,
} from 'lucide-react';
import { useNotice, useEligibility, useSavedNotices, useSaveNotice, useUnsaveNotice } from '../../hooks/useNoticeService';
import { EligibilityReasons } from '../../components/notices/EligibilityReasons';
import { Button, Badge, StatusBadge, CategoryBadge, ErrorState, Skeleton } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils/helpers';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-b-0">
      <dt className="text-body-sm text-text-muted flex-shrink-0">{label}</dt>
      <dd className="min-w-0 break-words text-right text-body-sm text-text">{value}</dd>
    </div>
  );
}

export function NoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const [savePendingLocal, setSavePendingLocal] = useState(false);

  const noticeQuery = useNotice(noticeId!);
  const eligibilityQuery = useEligibility(noticeId!);
  const savedQuery = useSavedNotices({ page: 1, limit: 50 });
  const saveMutation = useSaveNotice();
  const unsaveMutation = useUnsaveNotice();

  if (!noticeId) return <ErrorState title="Notice not found" />;

  const notice = noticeQuery.data;
  const eligibility = eligibilityQuery.data ?? notice?.eligibility;
  const isSaved = savedQuery.data?.data.some((r) => r.notice_id === noticeId) ?? false;
  const noticeEligibility = eligibility?.status
    ? eligibility
    : notice?.eligibility;

  if (noticeQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton variant="rectangular" height={24} width={200} />
        <Skeleton variant="text" lines={2} />
        <div className="bg-bg-elevated border border-border rounded-lg p-6 space-y-4">
          <Skeleton height={28} width="70%" />
          <Skeleton variant="text" lines={4} />
          <Skeleton variant="rectangular" height={120} />
        </div>
      </div>
    );
  }

  if (noticeQuery.isError || !notice) {
    return (
      <ErrorState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Notice unavailable"
        message="Could not load this notice. It may have been archived or the link is broken."
        action={{ label: 'Back to all notices', onClick: () => history.back() }}
      />
    );
  }

  const toggleSave = () => {
    setSavePendingLocal(true);
    const mutation = isSaved ? unsaveMutation : saveMutation;
    mutation.mutate(noticeId, { onSettled: () => setSavePendingLocal(false) });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/student/notices" className="inline-flex items-center gap-1 text-body-sm text-text-muted hover:text-text transition-colors">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> All notices
      </Link>

      {/* Header */}
      <header className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={notice.category} />
          {notice.status === 'PUBLISHED' && <Badge variant="success" size="sm">Published</Badge>}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-h1 font-semibold text-text text-pretty">{notice.title}</h1>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant={isSaved ? 'secondary' : 'ghost'}
              onClick={toggleSave}
              disabled={savePendingLocal || saveMutation.isPending || unsaveMutation.isPending}
              aria-pressed={isSaved}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save Notice'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-body-sm text-text-muted">
          {notice.published_at && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" /> Published {formatDate(notice.published_at)}
            </span>
          )}
          {notice.deadline ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-warning">
              <Clock className="w-4 h-4" aria-hidden="true" /> Deadline {formatDate(notice.deadline)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" /> No deadline specified
            </span>
          )}
        </div>
      </header>

      {/* AI summary */}
      {notice.summary && (
        <section className="bg-info-soft border border-info rounded-lg p-5" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="flex items-center gap-2 text-body-sm font-semibold text-info mb-2">
            <BookOpenCheck className="w-4 h-4" aria-hidden="true" /> AI-assisted summary
          </h2>
          <p className="text-body text-text">{notice.summary}</p>
          <p className="mt-3 text-caption text-text-muted italic">
            AI-assisted summary — verify important details against the official notice.
          </p>
        </section>
      )}

      {/* Description */}
      {notice.description && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-h4 font-semibold text-text mb-3">Description</h2>
          <p className="text-body text-text-muted whitespace-pre-line">{notice.description}</p>
        </section>
      )}

      {/* Key information */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="keyinfo-heading">
        <h2 id="keyinfo-heading" className="text-h4 font-semibold text-text mb-4">Key Information</h2>
        <dl>
          <Row label="Minimum CPI" value={notice.minimum_cpi ?? null} />
          <Row label="Minimum semester" value={notice.minimum_semester ?? null} />
          <Row label="Maximum semester" value={notice.maximum_semester ?? null} />
          <Row
            label="Eligible branches"
            value={notice.eligible_branches?.length ? notice.eligible_branches.join(', ') : null}
          />
          <Row
            label="Graduation years"
            value={notice.eligible_graduation_years?.length ? notice.eligible_graduation_years.join(', ') : null}
          />
          <Row
            label="Backlogs"
            value={notice.requires_no_backlogs === true ? 'No active backlogs required' : notice.requires_no_backlogs === false ? 'Backlog restriction not stated' : null}
          />
          <Row label="Duration" value={notice.duration} />
        </dl>

        {notice.application_url && (
          <div className="mt-4">
            <a href={notice.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent hover:underline break-all">
              <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Application link
            </a>
          </div>
        )}
        {notice.source_url && (
          <div className="mt-2">
            <a href={notice.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-text hover:underline break-all">
              <ExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> Original source website
            </a>
          </div>
        )}
      </section>

      {/* Eligibility */}
      {noticeEligibility && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="eligibility-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 id="eligibility-heading" className="text-h4 font-semibold text-text">Your Eligibility Analysis</h2>
            <StatusBadge status={noticeEligibility.status} type="eligibility" />
          </div>
          <EligibilityReasons eligibility={noticeEligibility} />
          <p className="mt-4 pt-4 border-t border-border text-caption text-text-muted">
            This is a rule-based assessment using your student profile and the extracted notice requirements. Final eligibility is determined by the recruiting organisation or issuing authority.
          </p>
        </section>
      )}

      {/* Required documents */}
      {notice.required_documents?.length > 0 && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="flex items-center gap-2 text-h4 font-semibold text-text mb-4">
            <ClipboardList className="w-5 h-5" aria-hidden="true" /> Required Documents
          </h2>
          <p className="text-caption text-text-muted mb-3">A checklist of what the notice asks applicants to carry. Nothing here is tracked by Oppora — use it as information.</p>
          <ul className="space-y-2">
            {notice.required_documents.map((doc, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2.5 bg-bg rounded-sm">
                <span className="mt-0.5 w-4 h-4 rounded-sm border border-border-strong flex-shrink-0" aria-hidden="true" />
                <span className="text-body-sm text-text">{doc}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Original PDF */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="pdf-heading">
        <h2 id="pdf-heading" className="flex items-center gap-2 text-h4 font-semibold text-text mb-3">
          <FileText className="w-5 h-5" aria-hidden="true" /> Original Notice PDF
        </h2>
        {notice.file_path ? (
          <div className="flex flex-wrap gap-3">
            <a
              href={`/student/notices/${notice.id}/file`}
              className="btn-secondary h-10 px-4 inline-flex items-center gap-2"
              onClick={async (e) => {
                e.preventDefault();
                const { noticeService } = await import('../../services/notice.service');
                const res = await noticeService.getNoticeFile(notice.id);
                window.open(res.signedUrl, '_blank', 'noopener');
              }}
            >
              <ImageIcon className="w-4 h-4" aria-hidden="true" /> Open Original PDF
            </a>
            <a
              href={`/student/notices/${notice.id}/download`}
              className="btn-secondary h-10 px-4 inline-flex items-center gap-2"
              onClick={async (e) => {
                e.preventDefault();
                const { noticeService } = await import('../../services/notice.service');
                const res = await noticeService.getNoticeFile(notice.id);
                triggerDownload(res.signedUrl, notice.file_name || 'notice.pdf');
              }}
            >
              <Download className="w-4 h-4" aria-hidden="true" /> Download PDF
            </a>
          </div>
        ) : (
          <p className="text-body-sm text-text-muted">No PDF is attached to this notice.</p>
        )}
      </section>
    </div>
  );
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}