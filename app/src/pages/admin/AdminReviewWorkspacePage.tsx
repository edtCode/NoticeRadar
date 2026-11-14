import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Check, X, Save, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Quote, HelpCircle } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { useExtractionWorkspace, useReviewNotice, useRejectNotice } from '../../hooks/useAdminService';
import { useAdminNotice } from '../../hooks/useAdminService';
import { StatusBadge, Button, Input, Textarea, Select, ErrorState, Skeleton, Modal, ConfirmDialog } from '../../components/ui';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { useAddToast } from '../../stores/uiStore';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, BRANCH_OPTIONS, REQUIRED_DOCUMENTS_OPTIONS } from '../../constants';
import { cn, formatDate } from '../../utils/helpers';
import type { ReviewPayload, ExtractionEvidence, ExtractedNotice } from '../../types';

export function AdminReviewWorkspacePage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const workspace = useExtractionWorkspace(noticeId!);
  const notice = useAdminNotice(noticeId!);
  const reviewMutation = useReviewNotice();
  const rejectMutation = useRejectNotice();
  const addToast = useAddToast();

  // Editable extracted payload — null-aware: a field left empty stays null, not falsy.
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(1);

  useEffect(() => {
    const w = workspace.data;
    if (w && !dirty) setDraft({ ...(w.extractedData ?? {}) } as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.data]);

  useEffect(() => {
    if (noticeId) {
      adminService.getNoticeFile(noticeId)
        .then((r) => setPdfUrl(r.signedUrl))
        .catch(() => setPdfLoadError(true));
    }
  }, [noticeId]);

  const setField = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const evidenceFor = (field: string): ExtractionEvidence | null => {
    const list = workspace.data?.evidence;
    if (!list) return null;
    return list.find((e) => e.field === field) ?? null;
  };

  if (!noticeId) return <ErrorState title="Notice not found" />;
  if (workspace.isLoading || notice.isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6 h-[75vh]">
        <div className="bg-bg-elevated border border-border rounded-lg"><Skeleton variant="rectangular" height="100%" /></div>
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={44} />)}</div>
      </div>
    );
  }

  if (workspace.isError || !workspace.data) {
    return <ErrorState icon={<AlertTriangle className="w-8 h-8" />} title="Could not load the extraction workspace" action={{ label: 'Retry', onClick: () => workspace.refetch() }} />;
  }

  const w = workspace.data;
  const extracted = w.extractedData;

  if (!extracted) {
    return (
      <div className="max-w-2xl">
        <ErrorState
          title="No extraction results yet"
          message={w.extractionStatus === 'PROCESSING' ? 'Processing is running — check the processing status page.' : w.extractionStatus === 'FAILED' ? 'Extraction failed. Retry processing first.' : 'This notice hasn\'t been processed yet.'}
          action={{ label: 'Go to Processing', onClick: () => (window.location.href = `/admin/notices/${noticeId}/processing`) }}
        />
      </div>
    );
  }

  const get = <T,>(key: string, fallback: T): T => ((draft[key] ?? extracted[key as keyof ExtractedNotice]) as T) ?? fallback;
  const str = (key: string): string => {
    const v = draft[key] ?? (extracted[key as keyof ExtractedNotice] as unknown);
    return v === null || v === undefined ? '' : String(v);
  };
  const numOrNull = (key: string): number | null => {
    const v = str(key);
    return v === '' ? null : Number(v);
  };
  const arr = (key: string): string[] => {
    const v = draft[key] ?? (extracted[key as keyof ExtractedNotice] as unknown);
    return Array.isArray(v) ? v as string[] : [];
  };

  const evidencePanels = (fieldName: string) => {
    const ev = evidenceFor(fieldName);
    if (!ev) return null;
    return (
      <div className="mt-2 p-3 bg-bg border border-border rounded-sm" aria-label={`Evidence for ${fieldName}`}>
        <p className="flex items-start gap-1.5 text-caption text-text-muted italic">
          <Quote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          “{ev.text}”
        </p>
        {ev.pageNumber !== null && <p className="mt-1.5 text-caption text-text-muted">Page: {ev.pageNumber}</p>}
      </div>
    );
  };

  const buildPayload = (): ReviewPayload => ({
    title: str('title').trim(),
    summary: str('summary') === '' ? null : str('summary').trim(),
    category: (str('category') || 'GENERAL') as never,
    deadline: str('deadline') === '' ? null : str('deadline'),
    eligibleBranches: arr('eligibleBranches'),
    minimumCPI: numOrNull('minimumCPI'),
    minimumSemester: numOrNull('minimumSemester'),
    maximumSemester: numOrNull('maximumSemester'),
    eligibleGraduationYears: arr('eligibleGraduationYears').map(Number).filter((n) => !isNaN(n)),
    requiresNoBacklogs: ((): boolean | null => {
      const v = draft['requiresNoBacklogs'];
      if (typeof v === 'boolean') return v;
      return null;
    })(),
    requiredDocuments: arr('requiredDocuments'),
    duration: str('duration') === '' ? null : str('duration'),
    applicationUrl: str('applicationUrl') === '' ? null : str('applicationUrl'),
  });

  const saveEdits = async () => {
    try {
      await reviewMutation.mutateAsync({ id: noticeId, payload: buildPayload() });
      setDirty(false);
      addToast({ type: 'success', title: 'Edits saved', message: 'The verified values now supersede the AI extraction.' });
    } catch (e) {
      addToast({ type: 'error', title: 'Save failed', message: (e as Error).message });
    }
  };

  const approve = async () => {
    try {
      await reviewMutation.mutateAsync({ id: noticeId, payload: { ...buildPayload(), decision: 'APPROVED' } });
      setApproveOpen(false);
      addToast({ type: 'success', title: 'Notice approved', message: 'It can now be published.' });
    } catch (e) {
      addToast({ type: 'error', title: 'Approve failed', message: (e as Error).message });
    }
  };

  const reject = async () => {
    try {
      await rejectMutation.mutateAsync({ id: noticeId, reviewNote: rejectNote });
      setRejectOpen(false);
      addToast({ type: 'success', title: 'Notice rejected' });
    } catch (e) {
      addToast({ type: 'error', title: 'Reject failed', message: (e as Error).message });
    }
  };

  const toggleIn = (key: string, value: string) => {
    const list = arr(key);
    setField(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <Link to="/admin/review" className="inline-flex items-center gap-1 text-body-sm text-text-muted hover:text-text mb-1">
            <ChevronLeft className="w-4 h-4" /> Review Queue
          </Link>
          <h1 className="text-h2 font-semibold text-text text-pretty">{notice.data?.title ?? w.extractedData?.title ?? 'Untitled notice'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={w.reviewStatus} type="review" size="md" />
          <StatusBadge status={w.extractionStatus} type="extraction" size="md" />
        </div>
      </div>

      {/* Split screen */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: PDF */}
        <section className="bg-bg-elevated border border-border rounded-lg overflow-hidden flex flex-col" aria-labelledby="pdf-heading">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-bg" id="pdf-heading" aria-label="PDF controls">
            <span className="text-body-sm font-medium text-text flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" /> Original PDF
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPdfZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="p-1.5 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover" aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-caption text-text-muted w-10 text-center">{Math.round(pdfZoom * 100)}%</span>
              <button onClick={() => setPdfZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))} className="p-1.5 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover" aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
              <span className="w-16 text-center text-caption text-text-muted">p.{pdfPage}</span>
            </div>
          </div>

          {pdfLoadError || !pdfUrl ? (
            <div className="p-6 text-center text-body-sm text-text-muted">Unable to retrieve the original PDF right now.</div>
          ) : (
            <div className="flex-1 overflow-auto scrollbar-thin bg-bg-hover min-h-[65vh]">
              <iframe
                title="Original notice PDF"
                src={`${pdfUrl}#page=${pdfPage}&zoom=${pdfZoom * 100}`}
                className="w-full h-[65vh] border-0"
              />
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <Button variant="secondary" onClick={() => setPdfPage((p) => Math.max(1, p - 1))} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-caption text-text-muted">Page navigation</span>
            <Button variant="secondary" onClick={() => setPdfPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </section>

        {/* RIGHT: Extracted fields */}
        <section className="bg-bg-elevated border border-border rounded-lg overflow-hidden flex flex-col" aria-labelledby="extracted-heading">
          <div className="px-4 py-2.5 border-b border-border bg-bg flex items-center justify-between" id="extracted-heading">
            <span className="text-body-sm font-medium text-text">Extracted Information</span>
            {dirty && <Badge_dirty />}
          </div>

          <div className="p-4 space-y-5 overflow-y-auto scrollbar-thin min-h-[65vh]">
            <Field label="Title">
              <Input value={str('title')} onChange={(e) => setField('title', e.target.value)} />
              {evidencePanels('title')}
            </Field>

            <Field label="Category">
              <SelectDropdown
                value={str('category')}
                placeholder="Select category"
                options={(NOTICE_CATEGORIES as readonly string[]).map((c) => ({ value: c, label: NOTICE_CATEGORY_LABELS[c] }))}
                onChange={(v) => setField('category', v)}
              />
              {evidencePanels('category')}
            </Field>

            <Field label="Summary">
              <Textarea value={str('summary')} onChange={(e) => setField('summary', e.target.value)} rows={4} />
              <p className="mt-1 text-caption text-text-muted">Empty summary stays empty — students will see the description instead.</p>
              {evidencePanels('summary')}
            </Field>

            <Field label="Deadline">
              <Input type="date" value={str('deadline')?.slice(0, 10)} onChange={(e) => setField('deadline', e.target.value === '' ? null : e.target.value)} />
              {evidencePanels('deadline')}
            </Field>

            <Field label="Eligible branches">
              <div className="flex flex-wrap gap-2">
                {[...new Set([...(BRANCH_OPTIONS as readonly string[]), ...arr('eligibleBranches')])].map((b) => (
                  <ToggleButton key={b} label={b} active={arr('eligibleBranches').includes(b)} onPress={() => toggleIn('eligibleBranches', b)} />
                ))}
              </div>
              {evidencePanels('eligibleBranches')}
            </Field>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Minimum CPI">
                <Input type="number" step="0.01" min={0} max={10} value={str('minimumCPI')} onChange={(e) => setField('minimumCPI', e.target.value === '' ? null : e.target.value)} />
                {evidencePanels('minimumCPI')}
              </Field>
              <Field label="Minimum sem">
                <Input type="number" min={1} max={8} value={str('minimumSemester')} onChange={(e) => setField('minimumSemester', e.target.value === '' ? null : e.target.value)} />
                {evidencePanels('minimumSemester')}
              </Field>
              <Field label="Maximum sem">
                <Input type="number" min={1} max={8} value={str('maximumSemester')} onChange={(e) => setField('maximumSemester', e.target.value === '' ? null : e.target.value)} />
                {evidencePanels('maximumSemester')}
              </Field>
            </div>

            <Field label="Eligible graduation years">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                  <ToggleButton key={y} label={String(y)} active={arr('eligibleGraduationYears').includes(String(y))} onPress={() => toggleIn('eligibleGraduationYears', String(y))} />
                ))}
              </div>
              {evidencePanels('eligibleGraduationYears')}
            </Field>

            <Field label="No-backlogs requirement">
              <div className="flex gap-2">
                {([
                  { key: 'unspecified', label: 'Not stated' },
                  { key: 'yes', label: 'Required' },
                  { key: 'no', label: 'Not required' },
                ] as const).map((o) => (
                  <ToggleButton
                    key={o.key}
                    label={o.label}
                    active={(() => {
                      const v = draft['requiresNoBacklogs'];
                      if (o.key === 'unspecified') return v === undefined || v === null;
                      if (o.key === 'yes') return v === true;
                      return v === false;
                    })()}
                    onPress={() => setField('requiresNoBacklogs', o.key === 'unspecified' ? null : o.key === 'yes')}
                  />
                ))}
              </div>
              {evidencePanels('requiresNoBacklogs')}
            </Field>

            <Field label="Required documents">
              <div className="flex flex-wrap gap-2">
                {REQUIRED_DOCUMENTS_OPTIONS.map((o) => (
                  <ToggleButton key={o.value} label={o.label} active={arr('requiredDocuments').includes(o.value)} onPress={() => toggleIn('requiredDocuments', o.value)} />
                ))}
              </div>
              {evidencePanels('requiredDocuments')}
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Duration">
                <Input value={str('duration')} onChange={(e) => setField('duration', e.target.value === '' ? null : e.target.value)} placeholder="e.g. 8 weeks" />
                {evidencePanels('duration')}
              </Field>
              <Field label="Application URL">
                <Input type="url" value={str('applicationUrl')} onChange={(e) => setField('applicationUrl', e.target.value === '' ? null : e.target.value)} />
                {evidencePanels('applicationUrl')}
              </Field>
            </div>

            {/* Logs */}
            {w.logs?.length > 0 && (
              <div>
                <p className="text-body-sm font-medium text-text mb-2">Processing log</p>
                <ul className="space-y-2">
                  {w.logs.slice(0, 5).map((log, i) => (
                    <li key={i} className="p-2.5 bg-bg rounded-sm text-caption flex items-start gap-2">
                      <StatusBadge status={log.status} type="extraction" size="sm" />
                      <span className="text-text-muted flex-1">{log.error_message ?? '—'}</span>
                      <span className="text-text-muted whitespace-nowrap">{log.created_at ? formatDate(log.created_at) : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Action bar */}
      <div className="sticky bottom-0 z-40 bg-bg-elevated border border-border rounded-lg shadow-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-text-muted max-w-lg">
          <HelpCircle className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
          Valid JSON is not correct information. Confirm every field against the PDF before approving.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => (window.location.href = '/admin/review')}>Return to Queue</Button>
          <Button variant="secondary" onClick={saveEdits} loading={reviewMutation.isPending} disabled={!dirty}>
            <Save className="w-4 h-4" /> Save Edits
          </Button>
          <Button variant="secondary" onClick={() => setRejectOpen(true)}>
            <X className="w-4 h-4" /> Reject Notice
          </Button>
          <Button onClick={() => setApproveOpen(true)}>
            <Check className="w-4 h-4" /> Approve Notice
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={approve}
        title="Approve this notice?"
        message="Confirm this decision only after checking every field against the original PDF. Approved notices become publishable."
        confirmText="Approve"
        variant="primary"
        loading={reviewMutation.isPending}
      />

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject this notice?" size="md">
        <div className="space-y-4">
          <p className="text-body text-text-muted">
            Rejection keeps the notice unpublished and records your review note. Provide a clear reason for the record.
          </p>
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Why is this notice being rejected?" rows={3} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={reject} loading={rejectMutation.isPending}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-text mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        'px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors',
        active ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function Badge_dirty() {
  return <span className="px-2 py-0.5 rounded-full bg-warning-soft text-warning text-caption font-medium">Unsaved edits</span>;
}