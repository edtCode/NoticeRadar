import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui';
import { ShieldOff, Compass, FileWarning } from 'lucide-react';

export function AccessDeniedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <EmptyState
        icon={<ShieldOff className="w-12 h-12 text-danger" />}
        title="Access denied"
        description="You don't have permission to view this page. If you believe this is wrong, talk to your institution administrator."
        action={{ label: 'Go home', onClick: () => (window.location.href = '/') }}
      />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <EmptyState
        icon={<Compass className="w-12 h-12" />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={{ label: 'Go home', onClick: () => (window.location.href = '/') }}
      />
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <EmptyState
        icon={<FileWarning className="w-12 h-12 text-warning" />}
        title="Something went wrong"
        description="The server had an unexpected problem. Try again in a few moments."
        action={{ label: 'Retry home', onClick: () => (window.location.href = '/') }}
      />
    </div>
  );
}

export { AccessDeniedPage as default403, NotFoundPage as default404, ServerErrorPage as default500 };