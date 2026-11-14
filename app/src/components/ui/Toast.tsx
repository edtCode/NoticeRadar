import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/helpers';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const icons: Record<Toast['type'], ReactNode> = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const variantStyles: Record<string, { bg: string; border: string; dot: string; icon: string }> = {
    success: { bg: 'bg-success-soft', border: 'border-success', dot: 'bg-success', icon: 'text-success' },
    error: { bg: 'bg-danger-soft', border: 'border-danger', dot: 'bg-danger', icon: 'text-danger' },
    warning: { bg: 'bg-warning-soft', border: 'border-warning', dot: 'bg-warning', icon: 'text-warning' },
    info: { bg: 'bg-info-soft', border: 'border-info', dot: 'bg-info', icon: 'text-info' },
  };

  const style = variantStyles[toast.type] ?? variantStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 border-[1.5px] shadow-lg card-signal card-signal-hover',
        style.bg,
        style.border,
        isExiting && 'animate-toast-out',
        'animate-toast-in'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', style.dot)} aria-hidden="true">
          {icons[toast.type]}
        </div>
        <span className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', style.dot) === 'bg-success' ? 'bg-success border-2 border-success-soft animate-check-pop' : 'bg-accent border-2 border-accent-soft animate-blink-dot'} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-semibold text-text">{toast.title}</p>
        {toast.message && <p className="text-body-sm text-text-muted">{toast.message}</p>}
      </div>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick?.();
            onClose(toast.id);
          }}
          className="btn-ghost btn-sm ml-2 shrink-0 whitespace-nowrap text-accent"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onClose(toast.id)}
        className="w-4 h-4 rounded-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-3 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:max-w-sm">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
