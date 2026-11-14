import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, X, CheckCircle2, AlertTriangle, ImageIcon } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { PageHeader, SectionHeader } from '../../components/common/PageHeader';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button, ErrorState } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { NOTICE_CATEGORIES, NOTICE_CATEGORY_LABELS, FILE_UPLOAD, ROUTES } from '../../constants';
import { formatBytes } from '../../utils/format';
import { cn } from '../../utils/helpers';

export function AdminUploadPage() {
  return <UploadFlow />;
}

function UploadFlow() {
  const navigate = useNavigate();
  const addToast = useAddToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [createdNoticeTitle, setCreatedNoticeTitle] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'creating' | 'uploading'>('idle');

  // Basic info form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [deadline, setDeadline] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateFile = (f: File): string | null => {
    if (!FILE_UPLOAD.ACCEPTED_TYPES.includes(f.type)) return 'Only PDF files are accepted.';
    if (f.size > FILE_UPLOAD.MAX_SIZE) return `File is larger than ${formatBytes(FILE_UPLOAD.MAX_SIZE)}.`;
    return null;
  };

  const onFileChange = (f: File | null) => {
    setError(null);
    if (!f) { setFile(null); return; }
    const problem = validateFile(f);
    if (problem) { setError(problem); setFile(null); return; }
    setFile(f);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!category) errs.category = 'Choose a category';
    if (applicationUrl && !/^https?:\/\//.test(applicationUrl)) errs.applicationUrl = 'Must be a valid URL starting with http(s)://';
    if (sourceUrl && !/^https?:\/\//.test(sourceUrl)) errs.sourceUrl = 'Must be a valid URL starting with http(s)://';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validateForm()) { setError('Fix the highlighted fields before uploading.'); return; }
    if (!file) { setError('Attach the official PDF before uploading.'); return; }

    try {
      setUploadState('creating');
      const notice = await adminService.createNotice({
        title: title.trim(),
        description: description.trim(),
        category: category as never,
        applicationUrl: applicationUrl || null,
        sourceUrl: sourceUrl || null,
        deadline: deadline || null,
        status: 'DRAFT',
      });

      setUploadState('uploading');
      const { notice: updatedNotice } = await (async () => {
        const result = await adminService.uploadFile(notice.id, file, setProgress);
        return { notice: result };
      })();

      setNoticeId(notice.id);
      setCreatedNoticeTitle(notice.title);
      addToast({ type: 'success', title: 'PDF uploaded', message: 'The notice was created and the file is attached.' });
      // go to processing
      navigate(`/admin/notices/${notice.id}/processing`);
    } catch (e) {
      const message = (e as Error).message || 'Upload failed';
      setError(message);
      setUploadState('idle');
      addToast({ type: 'error', title: 'Upload failed', message });
    }
  };

  if (noticeId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-h1 font-semibold text-text mb-2">PDF uploaded successfully</h1>
        <p className="text-body text-text-muted mb-8">“{createdNoticeTitle}” is ready for AI processing.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate(`${ROUTES.ADMIN_EDIT(noticeId)}/processing`)} className="h-10">Process PDF</Button>
          <Button variant="secondary" onClick={() => navigate(`${ROUTES.ADMIN_NOTICES}`)} className="h-10">Return to notices</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Upload Notice"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Notices', href: '/admin/notices' }, { label: 'Upload' }]}
        description="Create a notice from an official PDF. AI extraction is run after the upload and must be reviewed before publishing."
      />

      {error && (
        <div className="mb-5 flex items-start gap-2 p-3 bg-danger-soft border border-danger rounded-sm" role="alert">
          <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-body-sm text-danger">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Section A: Upload method */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="flex items-center gap-2 text-h4 font-semibold text-text mb-4"><UploadIcon className="w-5 h-5" aria-hidden="true" /> Official PDF</h2>
          <input ref={fileInputRef} id="pdf-input" type="file" accept="application/pdf" className="sr-only" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />

          <label
            htmlFor="pdf-input"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFileChange(e.dataTransfer.files?.[0] ?? null); }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 py-10 px-4 border-2 border-dashed rounded-md cursor-pointer transition-colors',
              'text-center',
              error ? 'border-danger bg-danger-soft' : 'border-border hover:border-accent hover:bg-accent-soft/40'
            )}
          >
            {file ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-success" aria-hidden="true" />
                <p className="text-body font-medium text-text">{file.name}</p>
                <p className="text-body-sm text-text-muted">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); }}
                  className="mt-1 text-body-sm text-danger hover:underline"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-text-muted" aria-hidden="true" />
                <p className="text-body font-medium text-text">Drag & drop a PDF here, or click to choose</p>
                <p className="text-body-sm text-text-muted">PDF only · up to {formatBytes(FILE_UPLOAD.MAX_SIZE)}</p>
              </>
            )}
          </label>

          {error && <p className="mt-2 text-body-sm text-danger" role="alert">{error}</p>}
        </section>

        {/* Section B: Basic information */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="basic-heading">
          <h2 id="basic-heading" className="flex items-center gap-2 text-h4 font-semibold text-text mb-4"><FileText className="w-5 h-5" aria-hidden="true" /> Basic Notice Information</h2>
          <div className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer Internship Programme 2027" error={formErrors.title} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Paste or summarise the official announcement text…" error={formErrors.description} />
            <Select
              label="Category"
              placeholder="Select category"
              options={(NOTICE_CATEGORIES as readonly string[]).map((c) => ({ value: c, label: NOTICE_CATEGORY_LABELS[c] }))}
              error={formErrors.category}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Input label="Application URL (optional)" type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="https://placement.example.edu/apply" error={formErrors.applicationUrl} />
            <Input label="Source URL (optional)" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://notices.example.edu/doc.pdf" error={formErrors.sourceUrl} />
          </div>
          <div className="sm:max-w-xs mt-4">
            <Input label="Deadline (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </section>

        {/* Section C: Processing */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="processing-heading">
          <h2 id="processing-heading" className="text-h4 font-semibold text-text mb-2">What happens next</h2>
          <p className="text-body-sm text-text-muted mb-4">
            After uploading, the pipeline extracts the PDF text and runs AI extraction. It ends in <strong>Pending Review</strong> — you check every field against the source PDF in the review workspace before approving and publishing.
          </p>
          <ol className="grid sm:grid-cols-5 gap-2 text-caption text-text-muted mb-6">
            {['PDF uploaded', 'Text extraction', 'AI extraction', 'Validation', 'Awaiting review'].map((s, i) => (
              <li key={s} className="px-2 py-2 bg-bg border border-border rounded-sm text-center">{i + 1}. {s}</li>
            ))}
          </ol>

          {uploadState !== 'idle' && (
            <div className="mb-4" role="status">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-colors" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-caption text-text-muted">
                {uploadState === 'creating' ? 'Creating notice…' : `Uploading PDF… ${progress}%`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => { navigate('/admin/notices'); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={uploadState === 'creating' || uploadState === 'uploading'} disabled={uploadState !== 'idle' || !file}>
              Upload & Start Processing
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}