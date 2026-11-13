import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { InstitutionAutocomplete } from '../../components/common/InstitutionAutocomplete';
import { useRegister } from '../../hooks/useAuthService';
import { ROUTES } from '../../constants';
import { OpporaMark } from '../../components/brand';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    institutionId: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    acceptTerms: z.boolean().refine((v) => v, { message: 'You must accept the terms and conditions' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function registrationErrorMessage(error: unknown): string {
  const raw = error && typeof error === 'object' && 'message' in error ? (error as { message?: unknown }).message : undefined;
  const message = typeof raw === 'string' ? raw.trim() : '';

  if (!message || message === 'Network Error') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  return message;
}

function passwordChecks(password: string) {
  return [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains an uppercase letter', ok: /[A-Z]/.test(password) },
  ];
}

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [registrationState, setRegistrationState] = useState<'form' | 'verify' | 'success'>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const password = watch('password');
  const accepted = watch('acceptTerms');
  const institutionId = watch('institutionId');
  const checks = passwordChecks(password || '');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        institutionId: institutionId || undefined,
      });
      setRegisteredEmail(data.email);
      setRegistrationState(response.requiresEmailConfirmation || !response.session ? 'verify' : 'success');
      if (response.session) {
        navigate(ROUTES.ONBOARDING, { replace: true });
      }
    } catch {
      // error surfaced by store
    }
  };

  if (registrationState === 'verify') {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-soft flex items-center justify-center">
            <Check className="w-8 h-8 text-accent" aria-hidden="true" />
          </div>
          <h1 className="text-h1 font-semibold text-text mb-2">Check your inbox</h1>
          <p className="text-body text-text-muted mb-2">
            We've sent a confirmation link to <span className="font-medium text-text">{registeredEmail}</span>.
          </p>
          <p className="text-body-sm text-text-muted mb-8">
            Click the link in the email to verify your account, then sign in.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-primary w-full h-10 inline-flex items-center justify-center">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6" aria-label="Oppora Home">
            <OpporaMark size="lg" />
          </Link>
          <h1 className="text-h1 font-semibold text-text">Create your account</h1>
          <p className="text-body text-text-muted mt-1">For students — free, always.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-elevated border border-border rounded-lg p-6 space-y-4" noValidate>
          {registerMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger rounded-sm" role="alert">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-body-sm text-danger">{registrationErrorMessage(registerMutation.error)}</p>
            </div>
          )}

          <Input label="Full name" type="text" autoComplete="name" placeholder="Shivam Kumar" error={errors.name?.message} {...register('name')} />
          <Input label="Email address" type="email" autoComplete="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />

          <InstitutionAutocomplete
            label="College / institution (optional)"
            value={watch('institutionId') ?? ''}
            onChange={(institution) => setValue('institutionId', institution?.id ?? '', { shouldValidate: true })}
            placeholder="Search your college or university"
            hint="Pick from the verified list. You can also add this during profile setup."
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-10 text-text-muted hover:text-text transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {password && (
            <ul className="space-y-1" aria-label="Password requirements">
              {checks.map((c) => (
                <li key={c.label} className={`flex items-center gap-1.5 text-caption ${c.ok ? 'text-success' : 'text-text-muted'}`}>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" /> {c.label}
                </li>
              ))}
            </ul>
          )}

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded-sm border-border text-accent focus:ring-2 focus:ring-accent"
                checked={accepted}
                onChange={(e) => setValue('acceptTerms', e.target.checked, { shouldValidate: true })}
              />
              <span className="text-body-sm text-text-muted">
                I agree to the{' '}
                <Link to={ROUTES.TERMS} className="text-accent hover:underline">Terms of Service</Link>
                {' '}and the{' '}
                <Link to={ROUTES.PRIVACY} className="text-accent hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.acceptTerms && <p className="mt-1 text-body-sm text-danger" role="alert">{errors.acceptTerms.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || registerMutation.isPending}
            className="btn-primary w-full h-10 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting || registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-body-sm text-text-muted">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}