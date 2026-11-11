import { CheckCircle2, XCircle, HelpCircle, Info } from 'lucide-react';
import type { Eligibility } from '../../types';
import { cn } from '../../utils/helpers';

const STATUS_CONFIG: Record<Eligibility['status'], { label: string; icon: React.ComponentType<{ className?: string }>; dot: string; text: string }> = {
  ELIGIBLE: { label: 'Eligible', icon: CheckCircle2, dot: 'bg-success', text: 'text-success' },
  NOT_ELIGIBLE: { label: 'Not Eligible', icon: XCircle, dot: 'bg-danger', text: 'text-danger' },
  POSSIBLY_ELIGIBLE: { label: 'Possibly Eligible', icon: HelpCircle, dot: 'bg-warning', text: 'text-warning' },
};

export function EligibilityReasons({ eligibility, compact }: { eligibility: Eligibility; compact?: boolean }) {
  const config = STATUS_CONFIG[eligibility.status];

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <div className="flex items-center gap-2">
        <div className={cn('flex-shrink-0 w-2 h-2 rounded-full', config.dot, 'animate-blink-dot')} aria-hidden="true" />
        <span className={`text-body-sm font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>
      <p className="text-body-sm text-text-muted leading-relaxed">
        {eligibility.status === 'ELIGIBLE'
          ? 'All specified requirements matched your profile.'
          : eligibility.status === 'NOT_ELIGIBLE'
          ? 'At least one requirement is not met by your profile.'
          : 'Some information is missing or ambiguous, so the result is uncertain.'}
      </p>

      {eligibility.reasons?.length > 0 && (
        <ul className="space-y-1">
          {eligibility.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-body-sm text-text-muted">
              <span className="mt-1 w-1 h-1 rounded-full bg-text-muted flex-shrink-0" aria-hidden="true" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {eligibility.missingFields?.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 bg-bg border border-border rounded-sm">
          <Info className="w-4 h-4 text-info flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-caption text-text-muted">
            Missing profile fields: <span className="text-text">{eligibility.missingFields.join(', ')}</span>. Update your profile to sharpen this result.
          </p>
        </div>
      )}
    </div>
  );
}
