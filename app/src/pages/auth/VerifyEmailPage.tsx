import { Link } from 'react-router-dom';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants';

export function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-soft flex items-center justify-center" aria-hidden="true">
          <MailCheck className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-h1 font-semibold text-text mb-3">Verify your email</h1>
        <p className="text-body text-text-muted mb-6">
          A confirmation message was sent to the address you registered with. Open it and click the verification link to activate your account.
        </p>
        <div className="bg-bg-elevated border border-border rounded-lg p-5 text-left mb-8">
          <p className="text-body-sm text-text-muted">
            Can't find the email? Check your spam folder. If it still hasn't arrived after a few minutes, contact your institution administrator for help.
          </p>
        </div>
        <Link to={ROUTES.LOGIN} className="btn-primary w-full h-10 inline-flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Return to login
        </Link>
      </div>
    </div>
  );
}