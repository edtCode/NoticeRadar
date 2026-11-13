import { cn } from '../../utils/helpers';

const MARK_SIZES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
} as const;

const WORDMARK_SIZES = {
  sm: 'text-body',
  md: 'text-h3',
  lg: 'text-h2',
} as const;

type LogoSize = keyof typeof MARK_SIZES;

type LogoProps = {
  size?: LogoSize;
  /** Hide the "Oppora" wordmark and render only the mark. */
  markOnly?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

/** Oppora bird mark, rendered on transparent background. */
export function OpporaMark({ size = 'md', className }: { size?: LogoSize; className?: string }) {
  return (
    <img
      src="/oppora-mark.svg"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('shrink-0 select-none', MARK_SIZES[size], className)}
    />
  );
}

export function OpporaLogo({
  size = 'md',
  markOnly = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <OpporaMark size={size} />
      {!markOnly && (
        <span
          className={cn(
            'font-display font-bold tracking-[-0.03em] text-text',
            WORDMARK_SIZES[size],
            wordmarkClassName
          )}
        >
          Oppora
        </span>
      )}
    </span>
  );
}