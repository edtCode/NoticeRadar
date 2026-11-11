import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Save, AlertTriangle, ArrowLeft } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageHeader, SectionHeader } from '../../components/common/PageHeader';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { SelectDropdown } from '../../components/ui/Dropdown';
import { Button, ErrorState, Badge } from '../../components/ui';
import { useCreateNotice, useUpdateNotice, useAdminNotice } from '../../hooks/useAdminService';
import { useAddToast } from '../../stores/uiStore';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, BRANCH_OPTIONS, SEMESTER_OPTIONS, REQUIRED_DOCUMENTS_OPTIONS } from '../../constants';
import type { CreateNoticePayload, Notice } from '../../types';

interface NoticeFormState {
  title: string;
  description: string;
  summary: string;
  category: string;
  applicationUrl: string;
  sourceUrl: string;
  deadline: string;

  eligibleBranches: string[];
  minimumCpi: string;
  minimumSemester: string;
  maximumSemester: string;
  eligibleGraduationYears: string[];
  requiresNoBacklogs: boolean | null;
  requiredDocuments: string[];
  duration: string;
}

function noticeToEditState(n: Notice): NoticeFormState {
  return {
    title: n.title,
    description: n.description ?? '',
    summary: n.summary ?? '',
    category: n.category,
    applicationUrl: n.application_url ?? '',
    sourceUrl: n.source_url ?? '',
    deadline: n.deadline ? n.deadline.slice(0, 10) : '',
    eligibleBranches: n.eligible_branches ?? [],
    minimumCpi: n.minimum_cpi === null || n.minimum_cpi === undefined ? '' : String(n.minimum_cpi),
    minimumSemester: n.minimum_semester === null || n.minimum_semester === undefined ? '' : String(n.minimum_semester),
    maximumSemester: n.maximum_semester === null || n.maximum_semester === undefined ? '' : String(n.maximum_semester),
    eligibleGraduationYears: (n.eligible_graduation_years ?? []).map(String),
    requiresNoBacklogs: n.requires_no_backlogs ?? null,
    requiredDocuments: n.required_documents ?? [],
    duration: n.duration ?? '',
  };
}

const emptyState: NoticeFormState = {
  title: '', description: '', summary: '', category: '', applicationUrl: '', sourceUrl: '', deadline: '',
  eligibleBranches: [], minimumCpi: '', minimumSemester: '', maximumSemester: '',
  eligibleGraduationYears: [], requiresNoBacklogs: null, requiredDocuments: [], duration: '',
};

export function AdminCreateNoticePage() {
  return <NoticeForm mode="create" />;
}

export function AdminEditNoticePage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const noticeQuery = useAdminNotice(noticeId!);

  if (!noticeId) return <ErrorState title="Notice not found" />;
  if (noticeQuery.isLoading) {
    return (
      <div className="space-y-4"><div className="h-8 w-64 bg-border/40 rounded skeleton-shimmer" /><div className="h-96 bg-border/20 rounded-lg skeleton-shimmer" /></div>
    );
  }
  if (noticeQuery.isError || !noticeQuery.data) {
    return <ErrorState title="Could not load notice" action={{ label: 'Retry', onClick: () => noticeQuery.refetch() }} />;
  }
  return <NoticeForm mode="edit" notice={noticeQuery.data} />;
}

function NoticeForm({ mode, notice }: { mode: 'create' | 'edit'; notice?: Notice }) {
  const navigate = useNavigate();
  const addToast = useAddToast();
  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();

  const [form, setForm] = useState<NoticeFormState>(notice ? noticeToEditState(notice) : emptyState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backlogsChoice, setBacklogsChoice] = useState<'unspecified' | 'yes' | 'no'>(
    notice ? (notice.requires_no_backlogs === null ? 'unspecified' : notice.requires_no_backlogs ? 'yes' : 'no') : 'unspecified'
  );
  const [branchInput, setBranchInput] = useState('');

  const set = <K extends keyof NoticeFormState>(key: K, value: NoticeFormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const mutation = mode === 'create' ? createMutation : updateMutation;

  const togglePick = (field: 'eligibleBranches' | 'requiredDocuments' | 'eligibleGraduationYears', value: string) => {
    const list = form[field];
    set(field, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Choose a category';
    if (form.minimumCpi && (isNaN(Number(form.minimumCpi)) || Number(form.minimumCpi) < 0 || Number(form.minimumCpi) > 10)) errs.minimumCpi = 'CPI must be between 0 and 10';
    if (form.minimumSemester && (Number(form.minimumSemester) < 1 || Number(form.minimumSemester) > 8)) errs.minimumSemester = 'Semester must be 1–8';
    if (form.maximumSemester && (Number(form.maximumSemester) < 1 || Number(form.maximumSemester) > 8)) errs.maximumSemester = 'Semester must be 1–8';
    if (form.minimumSemester && form.maximumSemester && Number(form.minimumSemester) > Number(form.maximumSemester)) errs.maximumSemester = 'Maximum semester must be ≥ minimum';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!validate()) return;
    const payload: CreateNoticePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as CreateNoticePayload['category'],
      summary: form.summary.trim() || null,
      applicationUrl: form.applicationUrl || null,
      sourceUrl: form.sourceUrl || null,
      deadline: form.deadline ? `${form.deadline}T23:59:59.000Z` : null,
      eligibleBranches: form.eligibleBranches,
      minimumCPI: form.minimumCpi === '' ? null : Number(form.minimumCpi),
      minimumSemester: form.minimumSemester === '' ? null : Number(form.minimumSemester),
      maximumSemester: form.maximumSemester === '' ? null : Number(form.maximumSemester),
      eligibleGraduationYears: form.eligibleGraduationYears.map(Number),
      requiresNoBacklogs: form.requiresNoBacklogs,
      requiredDocuments: form.requiredDocuments,
      duration: form.duration.trim() || null,
      ...(mode === 'create' ? { status } : {}),
    };
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (notice) {
        const { status: _status, ...updatePayload } = payload;
        await updateMutation.mutateAsync({ id: notice.id, payload: updatePayload });
      }
      addToast({ type: 'success', title: mode === 'create' ? 'Notice created as draft' : 'Changes saved', message: 'The notice is stored securely in the database.' });
      navigate('/admin/notices');
    } catch (e) {
      addToast({ type: 'error', title: 'Save failed', message: (e as Error).message || 'Try again.' });
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={mode === 'create' ? 'Create Notice' : 'Edit Notice'}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Notices', href: '/admin/notices' }, { label: mode === 'create' ? 'Create' : 'Edit' }]}
        actions={
          mode === 'edit' && notice?.file_path ? (
            <Button variant="secondary" onClick={() => adminService.getNoticeFile(notice.id).then((r) => window.open(r.signedUrl, '_blank', 'noopener'))}>
              <FileText className="w-4 h-4" /> View PDF
            </Button>
          ) : undefined
        }
      />

      {mode === 'edit' && notice && (
        <div className="mb-5">
          <Badge variant="info" size="sm">{notice.status}</Badge>{' '}
          <Badge variant="warning" size="sm">{notice.review_status}</Badge>{' '}
          <Badge variant="neutral" size="sm">{notice.extraction_status}</Badge>
        </div>
      )}

      <div className="space-y-6">
        {/* General information */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="general-heading">
          <h2 id="general-heading" className="text-h4 font-semibold text-text mb-4">General information</h2>
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="Notice title exactly as students should read it" />
            <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} rows={5} placeholder="The full notice text students would need." />
            <Textarea label="Summary (optional)" value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} placeholder="A concise summary based only on the source notice." />
            <SelectDropdown
              value={form.category}
              placeholder="Select category"
              options={(NOTICE_CATEGORIES as readonly string[]).map((c) => ({ value: c, label: NOTICE_CATEGORY_LABELS[c] }))}
              onChange={(v) => set('category', v)}
            />
            {errors.category && <p className="text-body-sm text-danger" role="alert">{errors.category}</p>}
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Application URL (optional)" type="url" value={form.applicationUrl} onChange={(e) => set('applicationUrl', e.target.value)} placeholder="https://…" />
              <Input label="Source URL (optional)" type="url" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://…" />
            </div>
            <div className="sm:max-w-xs">
              <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Eligibility requirements */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="elig-heading">
          <h2 id="elig-heading" className="text-h4 font-semibold text-text mb-1">Eligibility requirements</h2>
          <p className="text-body-sm text-text-muted mb-4">Leave a field empty when the notice doesn't specify it — empty is stored as unknown, not as a restriction.</p>
          <div className="space-y-5">
            {/* Branches multi-select */}
            <div>
              <p className="text-body-sm font-medium text-text mb-2">Eligible branches</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.eligibleBranches.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-loud-ink text-body-sm">
                    {b}
                    <button onClick={() => togglePick('eligibleBranches', b)} className="hover:text-danger" aria-label={`Remove ${b}`}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <SelectDropdown
                  value={branchInput}
                  placeholder="Add branch…"
                  options={(BRANCH_OPTIONS as readonly string[]).filter((b) => !form.eligibleBranches.includes(b)).map((b) => ({ value: b, label: b }))}
                  onChange={(v) => { togglePick('eligibleBranches', v); setBranchInput(''); }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Minimum CPI" type="number" step="0.01" min={0} max={10} value={form.minimumCpi} onChange={(e) => set('minimumCpi', e.target.value)} error={errors.minimumCpi} placeholder="—" />
              <Input label="Minimum semester" type="number" min={1} max={8} value={form.minimumSemester} onChange={(e) => set('minimumSemester', e.target.value)} error={errors.minimumSemester} placeholder="—" />
              <Input label="Maximum semester" type="number" min={1} max={8} value={form.maximumSemester} onChange={(e) => set('maximumSemester', e.target.value)} error={errors.maximumSemester} placeholder="—" />
            </div>

            {/* Graduation years */}
            <div>
              <p className="text-body-sm font-medium text-text mb-2">Eligible graduation years</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => togglePick('eligibleGraduationYears', String(year))}
                    className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${form.eligibleGraduationYears.includes(String(year)) ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
                    aria-pressed={form.eligibleGraduationYears.includes(String(year))}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Backlog requirement checkbox */}
            <fieldset>
              <legend className="text-body-sm font-medium text-text mb-2">No-backlogs requirement</legend>
              <div className="flex gap-2">
                {([
                  { key: 'unspecified', label: 'Not specified' },
                  { key: 'yes', label: 'Required (zero backlogs)' },
                  { key: 'no', label: 'Not required' },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { setBacklogsChoice(opt.key); set('requiresNoBacklogs', opt.key === 'unspecified' ? null : opt.key === 'yes'); }}
                    className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${backlogsChoice === opt.key ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
                    aria-pressed={backlogsChoice === opt.key}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Required documents */}
            <div>
              <p className="text-body-sm font-medium text-text mb-2">Required documents</p>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_DOCUMENTS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => togglePick('requiredDocuments', opt.value)}
                    className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${form.requiredDocuments.includes(opt.value) ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
                    aria-pressed={form.requiredDocuments.includes(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Duration & summary */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="text-h4 font-semibold text-text mb-1">Duration</h2>
          <p className="text-body-sm text-text-muted mb-4">Programme duration as stated in the notice, e.g. “8 weeks” — free text.</p>
          <Input
            label="Duration"
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="e.g. 8 weeks, May–July 2027"
          />
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="ghost" onClick={() => navigate('/admin/notices')}><ArrowLeft className="w-4 h-4" /> Back to Notice Management</Button>
          <div className="flex gap-3">
            {mode === 'create' && (
              <Button variant="secondary" loading={mutation.isPending} onClick={() => handleSave('DRAFT')}>
                <Save className="w-4 h-4" /> Save as Draft
              </Button>
            )}
            {mode === 'edit' && (
              <Button loading={mutation.isPending} onClick={() => handleSave('DRAFT')}>
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
