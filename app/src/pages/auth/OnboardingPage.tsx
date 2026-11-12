import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Input, Select } from '../../components/ui/Input';
import { SectionHeader } from '../../components/common/PageHeader';
import { InstitutionAutocomplete } from '../../components/common/InstitutionAutocomplete';
import { useStudentProfile, useCreateStudentProfile } from '../../hooks/useAuthService';
import { INTEREST_OPTIONS, BRANCH_OPTIONS, SEMESTER_OPTIONS } from '../../constants';
import type { InstitutionSearchResult, StudentProfileResponse } from '../../types';
import { cn } from '../../utils/helpers';

const onboardingSchema = z.object({
  institutionId: z.string().min(1, 'Select your institution'),
  departmentName: z.string().trim().min(2, 'Type your department name').max(100, 'Department name is too long'),
  branch: z.string().min(1, 'Select your branch'),
  semester: z.number({ error: 'Select your semester' }).min(1).max(8),
  cpi: z.number({ error: 'Enter your CPI' }).min(0, 'CPI cannot be negative').max(10, 'CPI cannot exceed 10'),
  graduationYear: z.number({ error: 'Enter your graduation year' }).min(new Date().getFullYear(), 'Graduation year must be the current year or later').max(new Date().getFullYear() + 6, 'Graduation year is too far in the future'),
  activeBacklogs: z.number({ error: 'Enter number of backlogs' }).min(0).max(20),
  interests: z.array(z.string()).min(1, 'Pick at least one interest'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const firstStudentProfile = (response?: StudentProfileResponse | null) => {
  const record = response?.student_profiles;
  return Array.isArray(record) ? (record[0] ?? null) : (record ?? null);
};

const STEPS = ['Institution', 'Academics', 'Interests', 'Review'] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interestsValue, setInterestsValue] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const profileQuery = useStudentProfile();
  const profile = profileQuery.data;
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      semester: (SEMESTER_OPTIONS as unknown as number[])[0],
      activeBacklogs: 0,
      interests: [],
    },
  });

  const createProfile = useCreateStudentProfile();

  // Returning to this page after the profile was saved should not restart
  // onboarding — the student already has a dashboard to go to.
  useEffect(() => {
    if (firstStudentProfile(profile)) {
      navigate('/student/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  // Registration can already carry an institution — prefill it once loaded.
  useEffect(() => {
    const institution = profile?.institutions;
    if (!institution || selectedInstitutionId) return;

    setValue('institutionId', institution.id);
    setSelectedInstitutionId(institution.id);
    setInstitutionName(institution.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.institutions?.id]);

  const handleInstitutionChange = (institution: InstitutionSearchResult | null) => {
    const nextId = institution?.id ?? '';
    const changed = nextId !== selectedInstitutionId;

    setValue('institutionId', nextId, { shouldValidate: true });
    setInstitutionName(institution?.name ?? '');

    if (changed) {
      setValue('departmentName', '');
      setSelectedInstitutionId(nextId);
    }
  };

  const watched = watch();
  const categoryForInterest = INTEREST_OPTIONS;

  const next = async () => {
    const fieldsByStep: Record<number, (keyof OnboardingForm)[]> = {
      0: ['institutionId', 'departmentName'],
      1: ['branch', 'semester', 'cpi', 'graduationYear', 'activeBacklogs'],
      2: ['interests'],
      3: [],
    };
    const valid = await trigger(fieldsByStep[step]);
    if (!valid) return;
    setFormError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setFormError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleInterest = (value: string) => {
    const nextValue = interestsValue.includes(value)
      ? interestsValue.filter((i) => i !== value)
      : [...interestsValue, value];
    setInterestsValue(nextValue);
    setValue('interests', nextValue, { shouldValidate: true });
  };

  const onComplete = handleSubmit(async (data) => {
    setFormError(null);
    try {
      await createProfile.mutateAsync({
        institutionId: data.institutionId,
        departmentName: data.departmentName,
        branch: data.branch,
        semester: data.semester,
        cpi: data.cpi,
        graduationYear: data.graduationYear,
        activeBacklogs: data.activeBacklogs,
        interests: data.interests,
      });
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      // The profile may have been saved by an earlier attempt; the dashboard
      // guard only needs the profile to exist, so send the student there.
      const refreshed = await profileQuery.refetch();
      if (firstStudentProfile(refreshed.data)) {
        navigate('/student/dashboard', { replace: true });
        return;
      }

      const message = error instanceof Error && error.message ? error.message : null;
      setFormError(message ? `Could not complete your profile: ${message}` : 'Could not complete your profile. Please try again.');
    }
  });

  const interestLabel = (v: string) => categoryForInterest.find((i) => i.value === v)?.label ?? v;

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      <header className="text-center mb-10">
        <h1 className="text-h1 font-semibold text-text">Set up your profile</h1>
        <p className="text-body text-text-muted mt-2">
          Welcome, {profile?.name ?? 'student'}. This information powers your personalised feed and eligibility results.
        </p>
      </header>

      {/* Progress */}
      <ol className="flex items-center justify-between mb-10" aria-label="Onboarding progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1 flex flex-col items-center relative">
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-body-sm font-semibold border-2 transition-colors',
                i < step && 'bg-accent border-accent text-text-inverted',
                i === step && 'border-accent text-accent',
                i > step && 'border-border text-text-muted'
              )}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
            </div>
            <span className={cn('mt-2 text-caption', i === step ? 'text-text font-medium' : 'text-text-muted')}>{label}</span>
            {i < STEPS.length - 1 && <div className={cn('absolute top-4 left-full w-full h-0.5 -translate-x-1/2', i < step ? 'bg-accent' : 'bg-border')} aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <form onSubmit={onComplete} className="bg-bg-elevated border border-border rounded-lg p-6" noValidate>
        {formError && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-danger-soft border border-danger rounded-sm" role="alert">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" aria-hidden="true" />
            <p className="text-body-sm text-danger">{formError}</p>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <SectionHeader title="Institution information" description="Which institution and department do you belong to?" />
            <InstitutionAutocomplete
              value={watched.institutionId ?? ''}
              initialName={institutionName}
              onChange={handleInstitutionChange}
              placeholder="Search by college name, city or abbreviation"
              hint="Pick your institution from the verified list so notices reach you."
              error={errors.institutionId?.message}
              allowRequest
            />

            <Input
              label="Department"
              placeholder="e.g. Computer Science and Engineering"
              hint="Type the name of your department exactly as your college uses it."
              error={errors.departmentName?.message}
              {...register('departmentName')}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <SectionHeader title="Academic information" description="Your branch, semester, CPI and graduation details — used for eligibility matching." />
            <Select
              label="Branch"
              placeholder="Select branch"
              error={errors.branch?.message}
              options={(BRANCH_OPTIONS as readonly string[]).map((b) => ({ value: b, label: b }))}
              {...register('branch')}
            />
            <Select
              label="Current semester"
              placeholder="Select semester"
              error={errors.semester?.message as string}
              options={[...SEMESTER_OPTIONS].map((n) => ({ value: String(n), label: `Semester ${n}` }))}
              {...register('semester', { valueAsNumber: true })}
            />
            <Input
              label="CPI"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 7.5"
              error={errors.cpi?.message as string}
              {...register('cpi', { valueAsNumber: true })}
            />
            <Input
              label="Graduation year"
              type="number"
              min={2026}
              max={2032}
              placeholder="e.g. 2028"
              error={errors.graduationYear?.message as string}
              {...register('graduationYear', { valueAsNumber: true })}
            />
            <Input
              label="Active backlogs"
              type="number"
              min="0"
              max="20"
              placeholder="0"
              hint="How many backlogs are currently not cleared. Many opportunities require zero."
              error={errors.activeBacklogs?.message as string}
              {...register('activeBacklogs', { valueAsNumber: true })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionHeader title="Your interests" description="Pick what you want to see more of. You can change this later from your profile." />
            {errors.interests?.message && <p className="text-body-sm text-danger" role="alert">{errors.interests.message}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INTEREST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleInterest(option.value)}
                  className={cn(
                    'p-3 rounded-md border text-body-sm font-medium text-left transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    interestsValue.includes(option.value)
                      ? 'border-accent bg-accent text-loud-ink'
                      : 'border-border text-text hover:border-border-strong'
                  )}
                  aria-pressed={interestsValue.includes(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <SectionHeader title="Review your profile" description="Check everything before completing. You can edit each section using the back button." />

            <dl>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Institution</dt>
                <dd className="text-body-sm font-medium text-text">
                  {institutionName || '—'}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Department</dt>
                <dd className="text-body-sm font-medium text-text">
                  {watched.departmentName || '—'}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Branch</dt>
                <dd className="text-body-sm font-medium text-text">{watched.branch || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Semester</dt>
                <dd className="text-body-sm font-medium text-text">{watched.semester || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">CPI</dt>
                <dd className="text-body-sm font-medium text-text">{watched.cpi ?? '—'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Graduation year</dt>
                <dd className="text-body-sm font-medium text-text">{watched.graduationYear || '—'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <dt className="text-body-sm text-text-muted">Active backlogs</dt>
                <dd className="text-body-sm font-medium text-text">{watched.activeBacklogs ?? 0}</dd>
              </div>
              <div className="py-2">
                <dt className="text-body-sm text-text-muted mb-2">Interests</dt>
                <dd>
                  <div className="flex flex-wrap gap-2">
                    {(watched.interests || []).map((v) => (
                      <span key={v} className="px-2.5 py-0.5 rounded-full bg-accent text-loud-ink text-body-sm font-medium">
                        {interestLabel(v)}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="btn-secondary h-10 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="btn-primary h-10 inline-flex items-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary h-10 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Completing…' : 'Complete Profile'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}