import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CalendarPlus, CheckCircle2, FileText, Inbox, Loader2, Paperclip, Sparkles, Trash2, Upload } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button, CategoryBadge, ErrorState, StatusBadge } from '../../components/ui';
import { EligibilityReasons } from '../../components/notices';
import { useAddToast } from '../../stores/uiStore';
import {
  usePersonalEntries,
  useCreatePersonalEntry,
  useDeletePersonalEntry,
  useUploadPersonalEntryFile,
  useExtractPersonalEntryDraft,
  usePreviewPersonalEntryEligibility,
} from '../../hooks/usePersonalEntryService';
import personalEntryService from '../../services/personalEntry.service';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, FILE_UPLOAD } from '../../constants';
import { formatDate, daysUntil } from '../../utils/helpers';
import { formatBytes } from '../../utils/format';
import type { Eligibility, NoticeCategory, PersonalEntry, PersonalEntryDraft } from '../../types';

const entrySchema = z.object({
  title: z.string().trim().min(1, 'Give this notice a title').max(200, 'Title is too long'),
  description: z.string().trim().max(5000, 'Description is too long').optional(),
  category: z.enum(NOTICE_CATEGORIES),
  deadline: z.string().optional(),
  eventDate: z.string().optional(),
  branches: z.string().optional(),
  minimumCPI: z.string().optional(),
  requiresNoBacklogs: z.boolean().optional(),
});

type EntryForm = z.infer<typeof entrySchema>;

const parseBranches = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((branch) => branch.trim())
    .filter(Boolean);

const toIso = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

// The extractor only knows the day; a deadline is read as end of day and an
// event as the start of the day until the student adjusts it.
const toDateTimeInput = (date: string | null, time: string) => (date ? `${date}T${time}` : '');

export function MyNoticesPage() {
  const addToast = useAddToast();
  const entriesQuery = usePersonalEntries();
  const createMutation = useCreatePersonalEntry();
  const uploadMutation = useUploadPersonalEntryFile();
  const deleteMutation = useDeletePersonalEntry();
  const extractMutation = useExtractPersonalEntryDraft();
  const previewMutation = usePreviewPersonalEntryEligibility();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extractionNote, setExtractionNote] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'GENERAL',
      deadline: '',
      eventDate: '',
      branches: '',
      minimumCPI: '',
      requiresNoBacklogs: false,
    },
  });

  const applyDraft = (draft: PersonalEntryDraft) => {
    setValue('title', draft.title, { shouldValidate: true, shouldDirty: true });
    setValue('description', draft.description, { shouldValidate: true, shouldDirty: true });
    setValue('category', draft.category, { shouldDirty: true });
    setValue('deadline', toDateTimeInput(draft.deadline, '23:59'), { shouldDirty: true });
    setValue('eventDate', toDateTimeInput(draft.eventDate, '09:00'), { shouldDirty: true });
    setValue('branches', draft.eligibleBranches.join(', '), { shouldDirty: true });
    setValue('minimumCPI', draft.minimumCPI === null ? '' : String(draft.minimumCPI), { shouldDirty: true });
    setValue('requiresNoBacklogs', draft.requiresNoBacklogs === true, { shouldDirty: true });

    setEligibility(draft.eligibility ?? null);
    setEligibilityChecked(true);

    const unclear = draft.ambiguousFields.join(', ');
    setExtractionNote(
      draft.ambiguousFields.length
        ? `Filled from your document. Double-check ${unclear} — it was not clear from the text.`
        : 'Filled from your document. Have a quick look, then save.'
    );
  };

  const runExtraction = async (source: { file: File } | { text: string }) => {
    setExtractionNote(null);
    setEligibility(null);
    setEligibilityChecked(false);
    try {
      const draft = await extractMutation.mutateAsync(source);
      applyDraft(draft);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not read that document',
        message: error instanceof Error ? error.message : 'Try another PDF, or paste the text instead.',
      });
    }
  };

  const onFileChange = (selected: File | null) => {
    setFileError(null);
    setProgress(0);
    setExtractionNote(null);
    setEligibility(null);
    setEligibilityChecked(false);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!FILE_UPLOAD.ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Only PDF files are accepted.');
      setFile(null);
      return;
    }
    if (selected.size > FILE_UPLOAD.MAX_SIZE) {
      setFileError(`File is larger than ${formatBytes(FILE_UPLOAD.MAX_SIZE)}.`);
      setFile(null);
      return;
    }
    setFile(selected);
    void runExtraction({ file: selected });
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const entry = await createMutation.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        category: data.category as NoticeCategory,
        deadline: toIso(data.deadline),
        eventDate: toIso(data.eventDate),
        eligibleBranches: parseBranches(data.branches),
        minimumCPI: data.minimumCPI ? Number(data.minimumCPI) : null,
        requiresNoBacklogs: data.requiresNoBacklogs ? true : null,
      });

      if (file) {
        try {
          await uploadMutation.mutateAsync({ id: entry.id, file, onProgress: setProgress });
        } catch (error) {
          addToast({
            type: 'warning',
            title: 'Saved without the PDF',
            message: error instanceof Error ? error.message : 'The entry was saved but the PDF could not be attached.',
          });
        }
      }

      reset();
      onFileChange(null);
      setPastedText('');
      setExtractionNote(null);
      setEligibility(null);
      setEligibilityChecked(false);
      addToast({ type: 'success', title: 'Added to your radar', message: 'It now appears in your tracked notices and deadlines.' });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not save this entry',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  });

  const openFile = async (entry: PersonalEntry) => {
    try {
      const { signedUrl } = await personalEntryService.getFileUrl(entry.id);
      window.open(signedUrl, '_blank', 'noopener');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not open the PDF',
        message: error instanceof Error ? error.message : 'Try again in a moment.',
      });
    }
  };

  // Keep the verdict honest while the student corrects the criteria the
  // extractor filled in.
  const [branchesValue, minimumCPIValue, requiresNoBacklogsValue] = watch([
    'branches',
    'minimumCPI',
    'requiresNoBacklogs',
  ]);

  useEffect(() => {
    if (!eligibilityChecked) return;

    const timer = setTimeout(() => {
      previewMutation.mutate(
        {
          eligibleBranches: parseBranches(branchesValue),
          minimumCPI: minimumCPIValue ? Number(minimumCPIValue) : null,
          requiresNoBacklogs: requiresNoBacklogsValue === true,
        },
        { onSuccess: (result) => setEligibility(result) }
      );
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchesValue, minimumCPIValue, requiresNoBacklogsValue, eligibilityChecked]);

  const entries = entriesQuery.data ?? [];
  const busy = createMutation.isPending || uploadMutation.isPending || extractMutation.isPending;

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="My Notices & Events"
        description="Track anything your institution has not published yet — add the details yourself, or attach the original PDF."
      />

      {/* Add form */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="add-entry-heading">
        <h2 id="add-entry-heading" className="text-h4 font-semibold text-text mb-4 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5" aria-hidden="true" /> Add a notice or event
        </h2>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="rounded-md border border-dashed border-border p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-body-sm font-medium text-text">Autofill from your document</p>
                <p className="text-caption text-text-muted">
                  Upload the PDF or paste its text — we read the title, category, deadline and event date so you do not have
                  to type them.
                </p>
              </div>
            </div>

            <label
              htmlFor="personal-file"
              className="flex items-center gap-3 p-3 bg-bg-elevated border border-border rounded-md cursor-pointer hover:border-border-strong transition-colors"
            >
              <Paperclip className="w-5 h-5 text-text-muted" aria-hidden="true" />
              <span className="text-body-sm text-text-muted truncate">
                {file ? `${file.name} · ${formatBytes(file.size)}` : 'Choose a PDF up to 5 MB'}
              </span>
            </label>
            <input
              id="personal-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            {fileError && <p className="text-body-sm text-danger" role="alert">{fileError}</p>}
            {extractMutation.isPending && (
              <p className="text-caption text-text-muted flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Reading your document…
              </p>
            )}

            <div className="space-y-2">
              <Textarea
                name="pasted-text"
                label="Or paste the notice text"
                rows={3}
                placeholder="Paste a paragraph with the details — dates, eligibility, venue, links."
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  loading={extractMutation.isPending}
                  disabled={pastedText.trim().length < 20}
                  onClick={() => runExtraction({ text: pastedText })}
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" /> Extract details
                </Button>
              </div>
            </div>

            {extractionNote && (
              <p className="text-body-sm text-text-muted flex items-start gap-2" role="status">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                {extractionNote}
              </p>
            )}
          </div>

          {eligibility && (
            <div className="rounded-md border border-border bg-bg p-4 space-y-2" aria-live="polite">
              <p className="text-body-sm font-medium text-text">Are you eligible?</p>
              <EligibilityReasons eligibility={eligibility} compact />
              <p className="text-caption text-text-muted">
                Based on the requirements read from this notice and the profile you set up. If the details above are wrong,
                correct them and this answer updates.
              </p>
            </div>
          )}

          <Input
            label="Title"
            placeholder="e.g. TCS campus drive — shortlist"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              error={errors.category?.message}
              options={NOTICE_CATEGORIES.map((category) => ({
                value: category,
                label: NOTICE_CATEGORY_LABELS[category] ?? category,
              }))}
              {...register('category')}
            />
            <Input label="Deadline" type="datetime-local" error={errors.deadline?.message} {...register('deadline')} />
            <Input label="Event date (optional)" type="datetime-local" error={errors.eventDate?.message} {...register('eventDate')} />
          </div>

          <Textarea
            label="Details (optional)"
            rows={3}
            placeholder="Eligibility, venue, links — anything you want to keep with this entry."
            error={errors.description?.message}
            {...register('description')}
          />

          <fieldset className="rounded-md border border-border p-4">
            <legend className="px-1 text-body-sm font-medium text-text">Who can apply (optional)</legend>
            <p className="text-caption text-text-muted mb-3">
              Filled from your document when it states them — this is what decides your eligible / not eligible badge.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Eligible branches"
                placeholder="CSE, IT — leave empty for all branches"
                error={errors.branches?.message}
                {...register('branches')}
              />
              <Input
                label="Minimum CPI"
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g. 7.0"
                error={errors.minimumCPI?.message}
                {...register('minimumCPI')}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-body-sm text-text">
              <input type="checkbox" className="h-4 w-4" {...register('requiresNoBacklogs')} />
              No active backlogs allowed
            </label>
          </fieldset>

          {file && (
            <p className="text-caption text-text-muted">
              {uploadMutation.isPending ? `Attaching ${file.name} — ${progress}%` : `${file.name} will be attached when you save.`}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={busy} className="h-10">
              <Upload className="w-4 h-4" aria-hidden="true" /> Save entry
            </Button>
          </div>
        </form>
      </section>

      {/* Tracked entries */}
      <section aria-labelledby="tracked-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="tracked-heading" className="text-h3 font-semibold text-text">Tracked by you</h2>
          {entries.length > 0 && <span className="text-caption text-text-muted">{entries.length} item{entries.length === 1 ? '' : 's'}</span>}
        </div>

        {entriesQuery.isError ? (
          <ErrorState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Could not load your entries"
            message={entriesQuery.error instanceof Error ? entriesQuery.error.message : undefined}
            action={{ label: 'Retry', onClick: () => entriesQuery.refetch() }}
          />
        ) : entriesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 bg-border/40 rounded-md skeleton-shimmer" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 bg-bg-elevated border border-border rounded-lg">
            <Inbox className="w-10 h-10 text-text-muted mb-3" aria-hidden="true" />
            <h3 className="text-h4 font-semibold text-text mb-1">Nothing tracked yet</h3>
            <p className="text-body text-text-muted max-w-sm">
              Anything you add here stays private to your account and shows up in your deadlines.
            </p>
          </div>
        ) : (
          <ul className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {entries.map((entry) => {
              const remaining = entry.deadline ? daysUntil(new Date(entry.deadline)) : null;
              return (
                <li key={entry.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-body font-medium text-text">{entry.title}</p>
                      <CategoryBadge category={entry.category} size="sm" dot={false} />
                      {entry.eligibility && (
                        <StatusBadge status={entry.eligibility.status} type="eligibility" size="sm" />
                      )}
                      {entry.source !== 'MANUAL' && (
                        <span className="text-caption px-2 py-0.5 rounded-full bg-info-soft text-info">
                          {entry.source === 'UPLOAD' ? 'From PDF' : 'From email'}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-text-muted mt-1">
                      {entry.deadline ? `Deadline ${formatDate(entry.deadline)}` : 'No deadline'}
                      {remaining !== null && remaining >= 0 && ` · ${remaining}d left`}
                      {entry.event_date && ` · Event ${formatDate(entry.event_date)}`}
                    </p>
                    {entry.description && <p className="text-body-sm text-text-muted mt-1 line-clamp-2">{entry.description}</p>}
                    {entry.eligibility?.status === 'NOT_ELIGIBLE' && entry.eligibility.reasons.length > 0 && (
                      <p className="text-caption text-danger mt-1">{entry.eligibility.reasons[0]}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {entry.file_name && (
                      <Button variant="ghost" className="h-9" onClick={() => openFile(entry)}>
                        <FileText className="w-4 h-4" aria-hidden="true" /> PDF
                      </Button>
                    )}
                    {confirmingId === entry.id ? (
                      <>
                        <Button
                          variant="ghost"
                          className="h-9 text-danger"
                          loading={deleteMutation.isPending}
                          onClick={async () => {
                            try {
                              await deleteMutation.mutateAsync(entry.id);
                              addToast({ type: 'success', title: 'Entry removed' });
                            } catch (error) {
                              addToast({
                                type: 'error',
                                title: 'Could not remove entry',
                                message: error instanceof Error ? error.message : 'Please try again.',
                              });
                            } finally {
                              setConfirmingId(null);
                            }
                          }}
                        >
                          Confirm
                        </Button>
                        <Button variant="ghost" className="h-9" onClick={() => setConfirmingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="h-9" aria-label={`Remove ${entry.title}`} onClick={() => setConfirmingId(entry.id)}>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {uploadMutation.isPending && (
          <p className="mt-3 text-caption text-text-muted flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Attaching PDF…
          </p>
        )}
      </section>
    </div>
  );
}
