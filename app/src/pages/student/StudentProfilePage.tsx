import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Pencil, Check } from 'lucide-react';
import { useStudentProfile, useUpdateStudentProfile } from '../../hooks/useAuthService';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button, ErrorState, Badge, Avatar } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';
import { INTEREST_OPTIONS, BRANCH_OPTIONS, SEMESTER_OPTIONS } from '../../constants';

const profileSchema = z.object({
  branch: z.string().min(1, 'Select your branch'),
  semester: z.number().min(1).max(8),
  cpi: z.number().min(0).max(10),
  graduationYear: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 6),
  activeBacklogs: z.number().min(0).max(20),
  interests: z.array(z.string()).min(1, 'Pick at least one interest'),
});

type ProfileForm = z.infer<typeof profileSchema>;

function firstProfileRecord(resp: { student_profiles: unknown }) {
  const sp = resp.student_profiles;
  return Array.isArray(sp) ? sp[0] : sp;
}

export function StudentProfilePage() {
  const profileQuery = useStudentProfile();
  const updateMutation = useUpdateStudentProfile();
  const addToast = useAddToast();
  const [editing, setEditing] = useState(false);

  const profile = profileQuery.data;
  const record = profile ? firstProfileRecord(profile) : null;

  const [interestsValue, setInterestsValue] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      branch: '',
      semester: 1,
      cpi: 0,
      graduationYear: new Date().getFullYear() + 1,
      activeBacklogs: 0,
      interests: [],
    },
  });

  useEffect(() => {
    if (record) {
      reset({
        branch: record.branch ?? '',
        semester: record.semester ?? 1,
        cpi: record.cpi ?? 0,
        graduationYear: record.graduation_year ?? new Date().getFullYear() + 1,
        activeBacklogs: record.active_backlogs ?? 0,
        interests: record.interests ?? [],
      });
      setInterestsValue(record.interests ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const toggleInterest = (value: string) => {
    const next = interestsValue.includes(value) ? interestsValue.filter((i) => i !== value) : [...interestsValue, value];
    setInterestsValue(next);
    setValue('interests', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSave = handleSubmit(async (data) => {
    try {
      await updateMutation.mutateAsync({
        branch: data.branch,
        semester: data.semester,
        cpi: data.cpi,
        graduationYear: data.graduationYear,
        activeBacklogs: data.activeBacklogs,
        interests: data.interests,
      });
      addToast({ type: 'success', title: 'Profile updated', message: 'Eligibility results now use your latest details.' });
      setEditing(false);
    } catch {
      addToast({ type: 'error', title: 'Update failed', message: 'Could not save your profile. Try again.' });
    }
  });

  if (profileQuery.isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-48 bg-border/40 rounded skeleton-shimmer" />
        <div className="bg-bg-elevated border border-border rounded-lg p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-border/40 rounded skeleton-shimmer" style={{ width: `${60 + i * 5}%` }} />)}
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profile || !record) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-h1 font-semibold text-text mb-6">My Profile</h1>
        <ErrorState
          title="Could not load your profile"
          message="Your academic profile is required for personalised feeds and eligibility results."
          action={{ label: 'Retry', onClick: () => profileQuery.refetch() }}
        />
      </div>
    );
  }

  const interestLabel = (v: string) => INTEREST_OPTIONS.find((i) => i.value === v)?.label ?? v;

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-text">My Profile</h1>
          <p className="text-body text-text-muted mt-1">Your details drive the eligibility engine — keep them accurate.</p>
        </div>
        {!editing && <Button variant="secondary" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" aria-hidden="true" /> Edit profile</Button>}
      </header>

      {/* Personal info (read-only) */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="personal-heading">
        <h2 id="personal-heading" className="text-h4 font-semibold text-text mb-4">Personal information</h2>
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={profile.name} size="lg" />
          <div>
            <p className="text-body font-medium text-text">{profile.name}</p>
            <p className="text-body-sm text-text-muted">{profile.email}</p>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-6">
          <div className="flex justify-between py-2 border-b border-border">
            <dt className="text-body-sm text-text-muted">Name</dt>
            <dd className="text-body-sm text-text">{profile.name}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <dt className="text-body-sm text-text-muted">Email</dt>
            <dd className="text-body-sm text-text">{profile.email}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <dt className="text-body-sm text-text-muted">Role</dt>
            <dd><Badge variant="info" size="sm">{profile.role}</Badge></dd>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <dt className="text-body-sm text-text-muted">Institution</dt>
            <dd className="text-body-sm text-text text-right">{profile.institutions?.name ?? 'Not assigned'}</dd>
          </div>
        </dl>
      </section>

      {/* Academic info */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="academic-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="academic-heading" className="text-h4 font-semibold text-text">Academic information</h2>
          {editing && <span className="text-caption text-text-muted">Editing…</span>}
        </div>

        {editing ? (
          <form onSubmit={onSave} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Branch"
                placeholder="Select branch"
                error={errors.branch?.message}
                options={(BRANCH_OPTIONS as readonly string[]).map((b) => ({ value: b, label: b }))}
                {...register('branch')}
              />
              <Select
                label="Current semester"
                error={errors.semester?.message as string}
                options={[...SEMESTER_OPTIONS].map((n) => ({ value: String(n), label: `Semester ${n}` }))}
                {...register('semester', { valueAsNumber: true })}
              />
              <Input label="CPI" type="number" step="0.01" min={0} max={10} error={errors.cpi?.message as string} {...register('cpi', { valueAsNumber: true })} />
              <Input label="Graduation year" type="number" error={errors.graduationYear?.message as string} {...register('graduationYear', { valueAsNumber: true })} />
              <Input label="Active backlogs" type="number" min={0} error={errors.activeBacklogs?.message as string} {...register('activeBacklogs', { valueAsNumber: true })} />
            </div>

            <div>
              <p className="text-body-sm font-medium text-text mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleInterest(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${interestsValue.includes(opt.value) ? 'bg-accent text-text-inverted border-accent' : 'border-border text-text-muted hover:border-border-strong'}`}
                    aria-pressed={interestsValue.includes(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {errors.interests?.message && <p className="mt-1.5 text-body-sm text-danger" role="alert">{errors.interests.message}</p>}
            </div>

            <div className="flex items-start gap-2 p-3 bg-info-soft border border-info rounded-sm">
              <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-body-sm text-text-muted">Saving changes recomputes your personalised feed and eligibility results against the updated profile.</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => { setEditing(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty}>
                <Check className="w-4 h-4" aria-hidden="true" /> Save changes
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid sm:grid-cols-2 gap-x-6">
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">Department</dt><dd className="text-body-sm text-text">{record.departments?.name ?? '—'}</dd></div>
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">Branch</dt><dd className="text-body-sm text-text">{record.branch ?? '—'}</dd></div>
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">Current semester</dt><dd className="text-body-sm text-text">{record.semester ?? '—'}</dd></div>
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">CPI</dt><dd className="text-body-sm text-text">{record.cpi ?? '—'}</dd></div>
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">Graduation year</dt><dd className="text-body-sm text-text">{record.graduation_year ?? '—'}</dd></div>
            <div className="flex justify-between py-2 border-b border-border"><dt className="text-body-sm text-text-muted">Active backlogs</dt><dd className="text-body-sm text-text">{record.active_backlogs ?? 0}</dd></div>
          </dl>
        )}
      </section>

      {/* Interests (read-only view) */}
      {!editing && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="interests-heading">
          <h2 id="interests-heading" className="text-h4 font-semibold text-text mb-4">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {(record.interests ?? []).length === 0 ? (
              <p className="text-body-sm text-text-muted">No interests selected yet.</p>
            ) : (
              (record.interests ?? []).map((interest: string) => (
                <Badge key={interest} variant="info" size="md">{interestLabel(interest)}</Badge>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}