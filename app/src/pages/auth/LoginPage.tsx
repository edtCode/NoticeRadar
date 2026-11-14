import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { useLogin } from '../../hooks/useAuthService';
import { useAuthStore } from '../../stores/authStore';
import { ROUTES } from '../../constants';
import { OpporaMark } from '../../components/brand';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const authError = useAuthStore((s) => s.error);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      const user = useAuthStore.getState().user;
      if (user?.role === 'ADMIN') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
      }
    } catch {
      // error already in store
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="hero-bloom pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2" aria-label="Oppora Home">
            <OpporaMark size="lg" />
          </Link>
          <h1 className="text-h1 text-text">Welcome back</h1>
          <p className="mx-auto mt-2 max-w-xs text-body text-text-muted text-pretty">
            Sign in to pick up the notices and deadlines waiting for you.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-signal space-y-4 p-6 sm:p-7" noValidate>
          {authError && (
            <div className="flex items-start gap-2 p-3 bg-danger-soft border border-danger rounded-sm" role="alert">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-body-sm text-danger">{authError}</p>
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loginMutation.isPending}
            className="btn-primary w-full h-10 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting || loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-body-sm text-text-muted">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-accent font-medium hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <p className="mx-auto mt-6 max-w-sm text-center text-caption leading-relaxed text-text-muted">
          By signing in you agree to our{' '}
          <Link to={ROUTES.TERMS} className="text-text-muted underline underline-offset-4 hover:text-text">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to={ROUTES.PRIVACY} className="text-text-muted underline underline-offset-4 hover:text-text">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}