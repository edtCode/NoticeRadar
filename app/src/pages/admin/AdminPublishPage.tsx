import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAdminNotice, usePublishNotice } from '../../hooks/useAdminService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button, StatusBadge, Badge, CategoryBadge, ErrorState, Skeleton, Modal, ConfirmDialog } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { AlertTriangle, Send, ChevronLeft, FileText, Rocket } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-border last:border-b-0">
      <dt className="text-body-sm text-text-muted flex-shrink-0">{label}</dt>
      <dd className="min-w-0 break-words text-right text-body-sm text-text">{value}</dd>
    </div>
  );
}

export function AdminPublishPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const noticeQuery = useAdminNotice(noticeId!);
  const publishMutation = usePublishNotice();
  const addToast = useAddToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!noticeId) return <ErrorState title="Notice not found" />;
  if (noticeQuery.isLoading) {
    return <div className="max-w-3xl space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} height={20} />)}</div>;
  }
  if (noticeQuery.isError || !noticeQuery.data) {
    return <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load this notice" action={{ label: 'Retry', onClick: () => noticeQuery.refetch() }} />;
  }

  const notice = noticeQuery.data;
  const approved = notice.review_status === 'APPROVED';
  const published = notice.status === 'PUBLISHED';

  const doPublish = async () => {
    try {
      await publishMutation.mutateAsync(noticeId);
      addToast({ type: 'success', title: 'Notice published', message: 'Students can now see this notice in their feeds.' });
      setConfirmOpen(false);
    } catch (e) {
      addToast({ type: 'error', title: 'Publish failed', message: (e as Error).message || 'The backend requires review_status APPROVED.' });
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/admin/notices" className="inline-flex items-center gap-1 text-body-sm text-text-muted hover:text-text">
        <ChevronLeft className="w-4 h-4" /> All notices
      </Link>

      <PageHeader
        title="Publish Notice"
        description="Final preview before students see this notice. Publishing requires an approved review."
        actions={<StatusBadge status={notice.review_status} type="review" size="md" />}
      />

      {!approved && !published && (
        <div className="bg-warning-soft border border-warning rounded-lg p-4 flex items-start gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-warning">This notice is not approved yet</p>
            <p className="text-body-sm text-text mt-1">The backend refuses publication unless the review status is APPROVED. Open the review workspace to verify and approve it first.</p>
            <Link to={`/admin/notices/${noticeId}/review`} className="btn-secondary mt-3 inline-flex items-center gap-2">
              <FileText className="w-4 h-4" /> Go to review
            </Link>
          </div>
        </div>
      )}

      {published && (
        <div className="bg-success-soft border border-success rounded-lg p-4 flex items-center gap-3" role="status">
          <Rocket className="w-5 h-5 text-success" aria-hidden="true" />
          <p className="text-body-sm text-text">This notice is already published to students.</p>
        </div>
      )}

      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="preview-heading">
        <h2 id="preview-heading" className="text-h4 font-semibold text-text mb-4">Preview</h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={notice.category} />
          <Badge variant="success" size="sm">Published</Badge>
        </div>
        <h3 className="text-h2 font-semibold text-text text-pretty">{notice.title}</h3>
        {notice.summary && <p className="mt-3 text-body text-text-muted">{notice.summary}</p>}
        <dl className="mt-5">
          <Row label="Deadline" value={notice.deadline ? formatDate(notice.deadline) : null} />
          <Row label="Eligible branches" value={notice.eligible_branches?.length ? notice.eligible_branches.join(', ') : null} />
          <Row label="Minimum CPI" value={notice.minimum_cpi ?? null} />
          <Row label="Semester range" value={notice.minimum_semester !== null && notice.minimum_semester !== undefined && notice.maximum_semester !== null && notice.maximum_semester !== undefined ? `${notice.minimum_semester} – ${notice.maximum_semester}` : null} />
          <Row label="Graduation years" value={notice.eligible_graduation_years?.length ? notice.eligible_graduation_years.join(', ') : null} />
          <Row label="Backlogs" value={notice.requires_no_backlogs === true ? 'Zero backlogs required' : notice.requires_no_backlogs === false ? 'No restriction' : null} />
          <Row label="Required documents" value={notice.required_documents?.length ? notice.required_documents.join(', ') : null} />
          <Row label="Duration" value={notice.duration} />
          <Row label="Application URL" value={notice.application_url ? <a href={notice.application_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">{notice.application_url}</a> : null} />
          <Row label="Original source" value={notice.source_url ? <a href={notice.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">{notice.source_url}</a> : null} />
        </dl>
        {notice.description && (
          <div className="mt-5">
            <p className="text-body-sm font-medium text-text mb-2">Description</p>
            <p className="text-body-sm text-text-muted whitespace-pre-line">{notice.description}</p>
          </div>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={() => history.back()}>Back</Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!approved || published || publishMutation.isPending}
        >
          <Send className="w-4 h-4" /> {published ? 'Published' : 'Publish Notice'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doPublish}
        title="Are you sure you want to publish this approved notice?"
        message="Published notices become visible to students according to their profiles. This is the last step of the pipeline — you've verified the extracted information against the PDF."
        confirmText="Yes, publish"
        variant="primary"
        loading={publishMutation.isPending}
      />
    </div>
  );
}