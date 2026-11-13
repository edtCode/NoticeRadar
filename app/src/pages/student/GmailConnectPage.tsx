import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, ExternalLink, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { emailService } from '../../services/email.service';
import { ROUTES } from '../../constants';
import { Button } from '../../components/ui';
import { useAddToast } from '../../stores/uiStore';

export function GmailConnectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToast = useAddToast();
  const [status, setStatus] = useState<{
    connected: boolean;
    emailAddress: string | null;
    loading: boolean;
  }>({ connected: false, emailAddress: null, loading: true });

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const result = await emailService.getGmailStatus();
        if (!cancelled) {
          setStatus({ connected: result.connected, emailAddress: result.emailAddress, loading: false });
        }
      } catch {
        if (!cancelled) setStatus({ connected: false, emailAddress: null, loading: false });
      }
    };

    loadStatus();

    // Surface OAuth result flags from the query string.
    if (success === '1') {
      addToast({
        type: 'success',
        title: 'Gmail connected',
        message: 'Your Gmail account is connected. Click Sync to import announcements.'
      });
    } else if (error) {
      addToast({
        type: 'error',
        title: 'Gmail connection failed',
        message:
          error === 'access_denied'
            ? 'You did not grant Gmail access. Try again.'
            : error === 'invalid_state'
              ? 'Invalid session. Please sign in again.'
              : 'Could not complete the connection. Try again.'
      });
    }

    return () => {
      cancelled = true;
    };
  }, [success, error, addToast]);

  const handleConnect = async () => {
    try {
      const { authUrl } = await emailService.getGmailAuthUrl();
      window.location.href = authUrl;
    } catch {
      addToast({
        type: 'error',
        title: 'Gmail not configured',
        message: 'Google OAuth is not set up on the server. Contact support.'
      });
    }
  };

  const handleSync = async () => {
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const result = await emailService.syncGmail();
      setStatus((s) => ({ ...s, loading: false }));
      addToast({
        type: 'success',
        title: 'Sync complete',
        message: `${result.processed} new message(s) processed, ${(result.results ?? [])
        .filter((r) => Boolean(r.announcementCount))
        .reduce((sum, r) => sum + Number(r.announcementCount ?? 0), 0)} announcement(s) extracted.`
      });
      navigate(ROUTES.STUDENT_ANNOUNCEMENTS);
    } catch (error) {
      setStatus((s) => ({ ...s, loading: false }));
      addToast({
        type: 'error',
        title: 'Sync failed',
        message: error instanceof Error ? error.message : 'Could not sync Gmail.'
      });
    }
  };

  if (status.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Gmail account? Extracted announcements will remain.')) return;
    try {
      await emailService.disconnectGmail();
      setStatus({ connected: false, emailAddress: null, loading: false });
      addToast({ type: 'success', title: 'Disconnected', message: 'Your Gmail account was disconnected.' });
    } catch {
      addToast({ type: 'error', title: 'Could not disconnect', message: 'Please try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-6 h-6 text-accent" aria-hidden="true" />
          <h1 className="text-h2 font-semibold text-text">Connect Gmail</h1>
        </div>
        <p className="text-body text-text-muted">
          Oppora reads your authorized Gmail messages, identifies
          announcements (internships, placements, hackathons, scholarships,
          events and more), and turns them into structured opportunities on
          your dashboard.
        </p>

        <div className="mt-6 space-y-3">
          {status.connected ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-success-soft border border-success rounded-lg text-success">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span className="text-body-sm font-medium text-success">
                  Connected: {status.emailAddress ?? 'Gmail account'}
                </span>
              </div>
              <p className="text-body-sm text-text-muted">
                Emails are scanned periodically. You can sync now to import
                recent announcements immediately.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleSync}
                  disabled={status.loading}
                  className="flex-1"
                >
                  {status.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Gmail Now
                </Button>
                <Button variant="ghost" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-body-sm text-text-muted">
                Connect your Gmail account to start discovering opportunities
                from your inbox.
              </p>
              <Button
                onClick={handleConnect}
                className="flex w-full sm:w-auto items-center gap-2"
              >
                <Mail className="w-4 h-4" /> Connect Gmail Account
              </Button>
              <p className="text-caption text-text-muted">
                You will be asked to grant read-only access to your Gmail.
                Oppora never sends email on your behalf.
              </p>
            </>
          )}
        </div>
      </div>

      {status.connected && (
        <section className="bg-bg-elevated border border-border rounded-lg p-6" aria-labelledby="announcements-heading">
          <h2 id="announcements-heading" className="text-h4 font-semibold text-text mb-4">
            Your Extracted Announcements
          </h2>
          <p className="text-body text-text-muted mb-4">
            Extracted announcements appear below once you sync. Open one to
            review the details the AI found in the original email.
          </p>
          <Link to={ROUTES.STUDENT_ANNOUNCEMENTS} className="btn-secondary inline-flex items-center gap-1">
            View all announcements <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}
